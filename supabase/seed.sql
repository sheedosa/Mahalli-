-- Mahalli — development seed (OPTIONAL, run manually)
--
-- Real tenants are provisioned through the app: a seller signs up, then
-- create_shop() makes their `sellers` + owner `profiles` rows atomically.
-- Because every shop is tied to a real auth.users row (and a real password we
-- never store in SQL), we do NOT seed sellers/users here.
--
-- What this script DOES: populate a demo product catalogue for a shop that
-- already exists, identified by its slug. Useful for poking at the dashboard
-- and (later) the storefront with realistic data.
--
-- Usage: create a shop in the app, note its slug, then run this with that slug.
-- Safe to re-run: it clears and re-inserts this shop's demo products.

do $$
declare
  v_shop_slug text := 'layla-boutique';  -- <-- change to your shop's slug
  v_seller    uuid;
  v_p1 uuid; v_p2 uuid; v_p3 uuid;
begin
  select id into v_seller from public.sellers where slug = v_shop_slug;
  if v_seller is null then
    raise notice 'No shop with slug "%". Create it in the app first.', v_shop_slug;
    return;
  end if;

  delete from public.products where seller_id = v_seller;

  insert into public.products (seller_id, name, description, price, category, stock, active)
  values (v_seller, 'عباية كلاسيك', 'عباية سوداء بقصّة كلاسيكية', 220, 'عبايات', 12, true)
  returning id into v_p1;

  insert into public.products (seller_id, name, description, price, category, stock, active)
  values (v_seller, 'فستان سهرة', 'فستان طويل لمناسبات', 480, 'فساتين', 4, true)
  returning id into v_p2;

  insert into public.products (seller_id, name, description, price, category, stock, active)
  values (v_seller, 'عطر وردي', 'عطر نسائي بنفحة وردية', 95, 'عطور', 2, true)
  returning id into v_p3;

  -- a couple of variants on the abaya
  insert into public.product_variants (product_id, label, sku, stock) values
    (v_p1, 'أسود / S', 'AB-BLK-S', 4),
    (v_p1, 'أسود / M', 'AB-BLK-M', 5),
    (v_p1, 'أسود / L', 'AB-BLK-L', 3);

  raise notice 'Seeded 3 products for shop "%".', v_shop_slug;
end $$;
