-- Mahalli — Seller OS
-- Migration 0018: buyer trust — stock re-check, checkout idempotency, public
-- order tracking, and new reserved slugs for the auth recovery routes.
--
--  * place_order / create_manual_order now reject items whose quantity exceeds
--    the current stock (P0016) so orders can't oversell at creation time.
--  * orders.client_key (+ partial unique index) makes storefront checkout
--    idempotent: a network retry with the same key returns the same order.
--  * get_order_status(slug, ref, phone) is the anon tracking entry point —
--    returns only the order's own snapshot, verified by phone, rate-limited
--    per phone so refs can't be enumerated.

-- ---------------------------------------------------------------------------
-- 1. Reserved slugs: auth recovery routes are top-level paths now
-- ---------------------------------------------------------------------------
create or replace function public.slug_is_reserved(p_slug text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(p_slug) = any (array[
    'api','auth','login','signup','logout','dashboard','products','orders',
    'customers','broadcasts','settings','onboarding','offline','admin','account',
    'sw','icon','icons','manifest','assets','static','public','_next','s','app',
    'about','terms','privacy','help','support','pricing','blog','www',
    'forgot-password','reset-password','track','health'
  ]);
$$;

-- ---------------------------------------------------------------------------
-- 2. Checkout idempotency + ref lookup index
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists client_key uuid;

create unique index if not exists orders_client_key_uniq
  on public.orders (seller_id, client_key)
  where client_key is not null;

-- Fast ref lookups (public tracking + seller search by ref).
create index if not exists orders_ref_lookup_idx
  on public.orders (seller_id, (left(id::text, 8)));

-- ---------------------------------------------------------------------------
-- 3. Tracking-lookup rate limit bookkeeping (definer-only writes; RLS shut)
-- ---------------------------------------------------------------------------
create table if not exists public.order_lookups (
  id         bigint generated always as identity primary key,
  phone      text not null,
  created_at timestamptz not null default now()
);
alter table public.order_lookups enable row level security;
alter table public.order_lookups force row level security;
create index if not exists order_lookups_phone_time_idx
  on public.order_lookups (phone, created_at desc);
create index if not exists order_lookups_created_idx
  on public.order_lookups (created_at);

-- ---------------------------------------------------------------------------
-- 4. place_order: + p_client_key (idempotent replay) + stock re-check (P0016)
-- ---------------------------------------------------------------------------
drop function if exists public.place_order(text, text, text, text, jsonb, text);

create or replace function public.place_order(
  p_slug        text,
  p_buyer_name  text,
  p_buyer_phone text,
  p_buyer_area  text,
  p_items       jsonb,
  p_hp          text default '',
  p_client_key  uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seller   uuid;
  v_areas    jsonb;
  v_name     text := btrim(coalesce(p_buyer_name, ''));
  v_phone    text := btrim(coalesce(p_buyer_phone, ''));
  v_area     text := nullif(btrim(coalesce(p_buyer_area, '')), '');
  v_order    uuid;
  v_subtotal numeric := 0;
  v_fee      numeric := 0;
  v_count    int;
  v_item     jsonb;
  v_qty      int;
  v_price    numeric;
  v_snap     text;
  v_prod     public.products;
  v_var      public.product_variants;
begin
  -- 1. Honeypot + payload validation -------------------------------------
  if coalesce(btrim(p_hp), '') <> '' then
    raise exception 'rejected' using errcode = 'P0009';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 120 then
    raise exception 'invalid name' using errcode = 'P0010';
  end if;
  if char_length(v_phone) < 6 or char_length(v_phone) > 40 then
    raise exception 'invalid phone' using errcode = 'P0011';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'invalid items' using errcode = 'P0012';
  end if;

  -- 2. Resolve shop ------------------------------------------------------
  select id, delivery_areas into v_seller, v_areas
  from public.sellers where slug = lower(p_slug);
  if v_seller is null then
    raise exception 'shop not found' using errcode = 'P0404';
  end if;

  -- 2b. Idempotent replay: a retry with the same key returns the order it
  -- already created — checked BEFORE rate limiting so retries aren't punished.
  if p_client_key is not null then
    select id into v_order from public.orders
    where seller_id = v_seller and client_key = p_client_key;
    if v_order is not null then
      return v_order;
    end if;
  end if;

  -- 3. Rate limiting -----------------------------------------------------
  select count(*) into v_count from public.orders
  where seller_id = v_seller and buyer_phone = v_phone
    and created_at > now() - interval '30 seconds';
  if v_count > 0 then raise exception 'slow down' using errcode = 'P0013'; end if;

  select count(*) into v_count from public.orders
  where seller_id = v_seller and buyer_phone = v_phone
    and created_at > now() - interval '1 hour';
  if v_count >= 5 then raise exception 'rate limit' using errcode = 'P0013'; end if;

  select count(*) into v_count from public.orders
  where seller_id = v_seller and created_at > now() - interval '1 minute';
  if v_count >= 60 then raise exception 'busy' using errcode = 'P0013'; end if;

  -- 4. Create the order shell (concurrent same-key insert -> return winner) -
  insert into public.orders (seller_id, status, channel, buyer_name, buyer_phone, buyer_area, client_key)
  values (v_seller, 'new', 'storefront', v_name, v_phone, v_area, p_client_key)
  on conflict (seller_id, client_key) where client_key is not null do nothing
  returning id into v_order;

  if v_order is null then
    select id into v_order from public.orders
    where seller_id = v_seller and client_key = p_client_key;
    return v_order;
  end if;

  -- 5. Items: re-derive every price/name from the DB (never trust client),
  --    and reject quantities that exceed current stock (P0016).
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'qty')::int, 0);
    if v_qty < 1 or v_qty > 100 then
      raise exception 'bad quantity' using errcode = 'P0014';
    end if;

    select * into v_prod from public.products
    where id = (v_item->>'product_id')::uuid and seller_id = v_seller;
    if v_prod.id is null or not v_prod.active then
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
      if v_qty > coalesce(v_var.stock, 0) then
        raise exception 'out of stock' using errcode = 'P0016';
      end if;
      v_price := coalesce(v_var.price_override, v_prod.price);
      v_snap  := v_prod.name || ' - ' || v_var.label;
    else
      if v_qty > coalesce(v_prod.stock, 0) then
        raise exception 'out of stock' using errcode = 'P0016';
      end if;
    end if;

    insert into public.order_items
      (order_id, product_id, variant_id, name_snapshot, price_snapshot, qty)
    values
      (v_order, v_prod.id, nullif(v_item->>'variant_id', '')::uuid, v_snap, v_price, v_qty);

    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  -- 6. Delivery fee from the shop's (informational) areas ----------------
  if v_area is not null and v_areas is not null then
    select coalesce((elem->>'fee')::numeric, 0) into v_fee
    from jsonb_array_elements(v_areas) elem
    where lower(btrim(elem->>'area')) = lower(v_area)
    limit 1;
    v_fee := coalesce(v_fee, 0);
  end if;

  update public.orders
  set subtotal = v_subtotal, delivery_fee = v_fee, total = v_subtotal + v_fee
  where id = v_order;

  return v_order;
end;
$$;

revoke all on function public.place_order(text, text, text, text, jsonb, text, uuid) from public;
grant execute on function public.place_order(text, text, text, text, jsonb, text, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. create_manual_order: stock re-check (P0016), same signature
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
      if v_qty > coalesce(v_var.stock, 0) then
        raise exception 'out of stock' using errcode = 'P0016';
      end if;
      v_price := coalesce(v_var.price_override, v_prod.price);
      v_snap  := v_prod.name || ' - ' || v_var.label;
    else
      if v_qty > coalesce(v_prod.stock, 0) then
        raise exception 'out of stock' using errcode = 'P0016';
      end if;
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

-- ---------------------------------------------------------------------------
-- 6. get_order_status: anon order tracking, verified by phone, rate-limited
-- ---------------------------------------------------------------------------
create or replace function public.get_order_status(
  p_slug  text,
  p_ref   text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seller uuid;
  v_phone  text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_ref    text := lower(btrim(coalesce(p_ref, '')));
  v_count  int;
  v_result jsonb;
begin
  -- Invalid input -> "not found" (no detail that helps enumeration).
  if v_ref !~ '^[0-9a-f]{8}$' or char_length(v_phone) < 6 then
    return null;
  end if;

  -- Rate-limit lookups per phone (20/hour) so refs can't be brute-forced.
  select count(*) into v_count from public.order_lookups
  where phone = v_phone and created_at > now() - interval '1 hour';
  if v_count >= 20 then
    raise exception 'rate limit' using errcode = 'P0013';
  end if;
  insert into public.order_lookups (phone) values (v_phone);
  delete from public.order_lookups where created_at < now() - interval '1 day';

  select id into v_seller from public.sellers where slug = lower(p_slug);
  if v_seller is null then
    return null;
  end if;

  select jsonb_build_object(
    'ref', upper(left(o.id::text, 8)),
    'status', o.status,
    'created_at', o.created_at,
    'subtotal', o.subtotal,
    'delivery_fee', o.delivery_fee,
    'total', o.total,
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object('name', i.name_snapshot, 'qty', i.qty, 'price', i.price_snapshot)
        order by i.name_snapshot
      )
      from public.order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  ) into v_result
  from public.orders o
  where o.seller_id = v_seller
    and left(o.id::text, 8) = v_ref
    and right(regexp_replace(coalesce(o.buyer_phone, ''), '\D', '', 'g'), 6) = right(v_phone, 6)
  order by o.created_at desc
  limit 1;

  return v_result;
end;
$$;

revoke all on function public.get_order_status(text, text, text) from public;
grant execute on function public.get_order_status(text, text, text) to anon, authenticated;
