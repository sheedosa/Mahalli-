-- Mahalli — Seller OS
-- Migration 0006: atomic product upsert
--
-- save_product() creates or updates a product and replaces its variant set in
-- a single transaction. SECURITY DEFINER so the product + variant writes are
-- atomic; ownership is enforced explicitly against user_seller_ids() since the
-- definer context bypasses RLS. Table CHECK constraints (price >= 0, stock >= 0,
-- name length) act as a server-side backstop to the app's zod validation.

create or replace function public.save_product(
  p_id          uuid,            -- null => create
  p_seller      uuid,
  p_name        text,
  p_description text,
  p_price       numeric,
  p_category    text,
  p_image_url   text,
  p_stock       integer,
  p_active      boolean,
  p_variants    jsonb            -- [{ label, sku, price_override, stock }]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pid uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- The seller must be one the caller belongs to.
  if p_seller not in (select public.user_seller_ids()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_id is null then
    insert into public.products
      (seller_id, name, description, price, category, image_url, stock, active)
    values (
      p_seller,
      btrim(p_name),
      nullif(btrim(coalesce(p_description, '')), ''),
      coalesce(p_price, 0),
      nullif(btrim(coalesce(p_category, '')), ''),
      nullif(btrim(coalesce(p_image_url, '')), ''),
      coalesce(p_stock, 0),
      coalesce(p_active, true)
    )
    returning id into v_pid;
  else
    update public.products set
      name        = btrim(p_name),
      description = nullif(btrim(coalesce(p_description, '')), ''),
      price       = coalesce(p_price, 0),
      category    = nullif(btrim(coalesce(p_category, '')), ''),
      image_url   = nullif(btrim(coalesce(p_image_url, '')), ''),
      stock       = coalesce(p_stock, 0),
      active      = coalesce(p_active, true)
    where id = p_id and seller_id = p_seller
    returning id into v_pid;

    if v_pid is null then
      raise exception 'product not found' using errcode = 'P0404';
    end if;

    delete from public.product_variants where product_id = v_pid;
  end if;

  -- (Re)insert variants, skipping rows without a label.
  insert into public.product_variants (product_id, label, sku, price_override, stock)
  select
    v_pid,
    btrim(x->>'label'),
    nullif(btrim(coalesce(x->>'sku', '')), ''),
    nullif(x->>'price_override', '')::numeric,
    coalesce(nullif(x->>'stock', '')::integer, 0)
  from jsonb_array_elements(coalesce(p_variants, '[]'::jsonb)) as x
  where length(btrim(coalesce(x->>'label', ''))) > 0;

  return v_pid;
end;
$$;

revoke all on function public.save_product(uuid, uuid, text, text, numeric, text, text, integer, boolean, jsonb) from public, anon;
grant execute on function public.save_product(uuid, uuid, text, text, numeric, text, text, integer, boolean, jsonb) to authenticated;
