-- Mahalli — Seller OS
-- Migration 0010: order pipeline + auto-built customer book
--
-- Customer book is maintained by triggers on `orders`, so it stays correct no
-- matter how an order is created (storefront, manual entry) or changed:
--   * BEFORE INSERT  -> ensure a customer row exists for the buyer phone and
--                       link orders.customer_id.
--   * AFTER  I/U/D   -> recompute that customer's aggregates.
--
-- Status changes go through set_order_status(), which atomically moves the
-- order and adjusts stock: decrement when an order first becomes "committed"
-- (confirmed/ready/out/delivered), restore when it returns to new/cancelled.

-- ---------------------------------------------------------------------------
-- recompute_customer: rebuild one customer's aggregates from their orders.
-- ---------------------------------------------------------------------------
create or replace function public.recompute_customer(p_seller uuid, p_phone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
begin
  if v_phone is null then return; end if;

  insert into public.customers (seller_id, phone)
  values (p_seller, v_phone)
  on conflict (seller_id, phone) do nothing;

  update public.customers c set
    order_count    = agg.cnt,
    total_spent    = agg.spent,
    first_order_at = agg.first_at,
    last_order_at  = agg.last_at,
    name           = coalesce(agg.last_name, c.name),
    area           = coalesce(agg.last_area, c.area)
  from (
    select
      count(*) filter (where status <> 'cancelled')            as cnt,
      coalesce(sum(total) filter (where status = 'delivered'), 0) as spent,
      min(created_at)                                          as first_at,
      max(created_at)                                          as last_at,
      (array_agg(buyer_name order by created_at desc) filter (where buyer_name is not null))[1] as last_name,
      (array_agg(buyer_area order by created_at desc) filter (where buyer_area is not null))[1] as last_area
    from public.orders
    where seller_id = p_seller and buyer_phone = v_phone
  ) agg
  where c.seller_id = p_seller and c.phone = v_phone;
end;
$$;

revoke all on function public.recompute_customer(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- BEFORE INSERT: link/create the customer for this order.
-- ---------------------------------------------------------------------------
create or replace function public.orders_link_customer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := nullif(btrim(coalesce(new.buyer_phone, '')), '');
  v_cid uuid;
begin
  if v_phone is null then
    return new;
  end if;
  insert into public.customers (seller_id, phone, name, area)
  values (new.seller_id, v_phone, nullif(btrim(coalesce(new.buyer_name,'')),''), new.buyer_area)
  on conflict (seller_id, phone) do nothing;

  select id into v_cid from public.customers
  where seller_id = new.seller_id and phone = v_phone;
  new.customer_id := v_cid;
  return new;
end;
$$;

create trigger orders_link_customer_trg
  before insert on orders
  for each row execute function public.orders_link_customer();

-- ---------------------------------------------------------------------------
-- AFTER insert/update/delete: refresh affected customer aggregates.
-- ---------------------------------------------------------------------------
create or replace function public.orders_touch_customer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') and new.buyer_phone is not null then
    perform public.recompute_customer(new.seller_id, new.buyer_phone);
  end if;
  if tg_op in ('UPDATE', 'DELETE') and old.buyer_phone is not null
     and (tg_op = 'DELETE' or old.buyer_phone is distinct from new.buyer_phone) then
    perform public.recompute_customer(old.seller_id, old.buyer_phone);
  end if;
  return null;
end;
$$;

create trigger orders_touch_customer_trg
  after insert or update or delete on orders
  for each row execute function public.orders_touch_customer();

-- ---------------------------------------------------------------------------
-- set_order_status: move an order and adjust stock atomically.
-- ---------------------------------------------------------------------------
create or replace function public.set_order_status(p_order uuid, p_status public.order_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seller    uuid;
  v_committed boolean;
  v_now_committed boolean;
  v_item      record;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select seller_id, stock_committed into v_seller, v_committed
  from public.orders where id = p_order;
  if v_seller is null then
    raise exception 'order not found' using errcode = 'P0404';
  end if;
  if v_seller not in (select public.user_seller_ids()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- "committed" states hold stock; new/cancelled release it.
  v_now_committed := p_status in ('confirmed', 'ready', 'out', 'delivered');

  if v_now_committed and not v_committed then
    -- decrement stock (clamped at 0 so we never violate the >= 0 check)
    for v_item in
      select product_id, variant_id, qty from public.order_items where order_id = p_order
    loop
      if v_item.variant_id is not null then
        update public.product_variants
          set stock = greatest(0, stock - v_item.qty) where id = v_item.variant_id;
      elsif v_item.product_id is not null then
        update public.products
          set stock = greatest(0, stock - v_item.qty) where id = v_item.product_id;
      end if;
    end loop;
  elsif (not v_now_committed) and v_committed then
    -- restore stock
    for v_item in
      select product_id, variant_id, qty from public.order_items where order_id = p_order
    loop
      if v_item.variant_id is not null then
        update public.product_variants
          set stock = stock + v_item.qty where id = v_item.variant_id;
      elsif v_item.product_id is not null then
        update public.products
          set stock = stock + v_item.qty where id = v_item.product_id;
      end if;
    end loop;
  end if;

  update public.orders
    set status = p_status, stock_committed = v_now_committed
    where id = p_order;

  insert into public.audit_log (seller_id, actor_user_id, action, entity, entity_id, meta)
  values (v_seller, auth.uid(), 'order.status', 'order', p_order,
          jsonb_build_object('status', p_status));
end;
$$;

revoke all on function public.set_order_status(uuid, public.order_status) from public, anon;
grant execute on function public.set_order_status(uuid, public.order_status) to authenticated;

-- ---------------------------------------------------------------------------
-- create_manual_order: seller enters an order taken over DM/WhatsApp/phone.
-- Prices are re-derived from the catalogue, like the storefront path.
-- ---------------------------------------------------------------------------
create or replace function public.create_manual_order(
  p_seller       uuid,
  p_buyer_name   text,
  p_buyer_phone  text,
  p_buyer_area   text,
  p_notes        text,
  p_delivery_fee numeric,
  p_items        jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order    uuid;
  v_subtotal numeric := 0;
  v_fee      numeric := greatest(0, coalesce(p_delivery_fee, 0));
  v_item     jsonb;
  v_qty      int;
  v_price    numeric;
  v_snap     text;
  v_prod     public.products;
  v_var      public.product_variants;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_seller not in (select public.user_seller_ids()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 100 then
    raise exception 'invalid items' using errcode = 'P0012';
  end if;

  insert into public.orders (seller_id, status, channel, buyer_name, buyer_phone, buyer_area, notes)
  values (p_seller, 'new', 'manual',
          nullif(btrim(coalesce(p_buyer_name, '')), ''),
          nullif(btrim(coalesce(p_buyer_phone, '')), ''),
          nullif(btrim(coalesce(p_buyer_area, '')), ''),
          nullif(btrim(coalesce(p_notes, '')), ''))
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'qty')::int, 0);
    if v_qty < 1 or v_qty > 1000 then
      raise exception 'bad quantity' using errcode = 'P0014';
    end if;

    select * into v_prod from public.products
    where id = (v_item->>'product_id')::uuid and seller_id = p_seller;
    if v_prod.id is null then
      raise exception 'product unavailable' using errcode = 'P0015';
    end if;

    v_price := v_prod.price;
    v_snap  := v_prod.name;
    if nullif(v_item->>'variant_id', '') is not null then
      select * into v_var from public.product_variants
      where id = (v_item->>'variant_id')::uuid and product_id = v_prod.id;
      if v_var.id is null then
        raise exception 'variant unavailable' using errcode = 'P0015';
      end if;
      v_price := coalesce(v_var.price_override, v_prod.price);
      v_snap  := v_prod.name || ' - ' || v_var.label;
    end if;

    insert into public.order_items (order_id, product_id, variant_id, name_snapshot, price_snapshot, qty)
    values (v_order, v_prod.id, nullif(v_item->>'variant_id', '')::uuid, v_snap, v_price, v_qty);

    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  update public.orders
    set subtotal = v_subtotal, delivery_fee = v_fee, total = v_subtotal + v_fee
    where id = v_order;

  return v_order;
end;
$$;

revoke all on function public.create_manual_order(uuid, text, text, text, text, numeric, jsonb) from public, anon;
grant execute on function public.create_manual_order(uuid, text, text, text, text, numeric, jsonb) to authenticated;
