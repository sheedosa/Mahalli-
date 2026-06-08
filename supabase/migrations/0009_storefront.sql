-- Mahalli — Seller OS
-- Migration 0009: public storefront read + validated order placement
--
-- The storefront is the only place anonymous users touch the database, and it
-- does so ONLY through these two SECURITY DEFINER functions — never raw anon
-- table access (there are no anon RLS policies). Both are tightly scoped:
--   * get_storefront  — read: a shop's public info + its ACTIVE products only.
--   * place_order     — write: server-side validated, price re-derived from the
--                       DB, rate-limited, honeypot-checked. Creates a 'new'
--                       storefront order atomically. Stock is NOT decremented
--                       here (that happens on confirm — build step 6).

-- ---------------------------------------------------------------------------
-- get_storefront(slug) -> jsonb | null
-- ---------------------------------------------------------------------------
create or replace function public.get_storefront(p_slug text)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_seller public.sellers;
  v_result jsonb;
begin
  select * into v_seller from public.sellers where slug = lower(p_slug);
  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'shop', jsonb_build_object(
      'name', v_seller.name,
      'slug', v_seller.slug,
      'city', v_seller.city,
      'logo_url', v_seller.logo_url,
      'contact_phone', v_seller.contact_phone,
      'lang', v_seller.lang,
      'delivery_areas', v_seller.delivery_areas
    ),
    'products', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'price', p.price,
          'image_url', p.image_url,
          'category', p.category,
          'stock', p.stock,
          'variants', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', v.id, 'label', v.label,
                'price_override', v.price_override, 'stock', v.stock
              ) order by v.label
            )
            from public.product_variants v where v.product_id = p.id
          ), '[]'::jsonb)
        ) order by p.created_at desc
      )
      from public.products p
      where p.seller_id = v_seller.id and p.active = true
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_storefront(text) from public;
grant execute on function public.get_storefront(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- place_order(...) -> uuid (the new order id)
-- p_items: [{ product_id, variant_id?, qty }]
-- p_hp: honeypot — must be empty (bots fill hidden fields).
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_slug        text,
  p_buyer_name  text,
  p_buyer_phone text,
  p_buyer_area  text,
  p_items       jsonb,
  p_hp          text default ''
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

  -- 4. Create the order shell -------------------------------------------
  insert into public.orders (seller_id, status, channel, buyer_name, buyer_phone, buyer_area)
  values (v_seller, 'new', 'storefront', v_name, v_phone, v_area)
  returning id into v_order;

  -- 5. Items: re-derive every price/name from the DB (never trust client) -
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
      v_price := coalesce(v_var.price_override, v_prod.price);
      v_snap  := v_prod.name || ' - ' || v_var.label;
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

revoke all on function public.place_order(text, text, text, text, jsonb, text) from public;
grant execute on function public.place_order(text, text, text, text, jsonb, text) to anon, authenticated;
