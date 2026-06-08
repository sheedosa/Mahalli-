-- Mahalli — local/CI seed (runs on `supabase db reset`, LOCAL only).
--
-- Creates a deterministic demo shop "demo-shop" with products so the storefront
-- E2E test (e2e/storefront.spec.ts) has something to load. NEVER runs against
-- production (prod is migrated via the MCP, not seeded).

do $$
declare
  v_user uuid := '00000000-0000-0000-0000-0000000000de';
  v_shop uuid := '00000000-0000-0000-0000-00000000beef';
  v_p1 uuid;
begin
  insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', v_user, 'authenticated','authenticated','demo@mahalli.local', now(), now())
  on conflict (id) do nothing;

  insert into public.sellers (id, name, slug, owner_user_id, city, lang, theme, delivery_areas)
  values (v_shop, 'Demo Bakery', 'demo-shop', v_user, 'Tripoli', 'en', 'cream',
          '[{"area":"Tripoli","fee":10}]'::jsonb)
  on conflict (id) do nothing;

  insert into public.profiles (user_id, seller_id, role)
  values (v_user, v_shop, 'owner') on conflict do nothing;

  insert into public.products (seller_id, name, description, price, category, stock, active)
  values (v_shop, 'Chocolate Cake', 'Rich Belgian chocolate', 95, 'Cakes', 8, true)
  returning id into v_p1;
  insert into public.product_variants (product_id, label, price_override, stock) values
    (v_p1, 'Small', null, 5), (v_p1, 'Large', 140, 4);

  insert into public.products (seller_id, name, price, category, stock, active) values
    (v_shop, 'Vanilla Cupcakes', 40, 'Cupcakes', 20, true),
    (v_shop, 'Berry Cheesecake', 75, 'Cheesecake', 6, true);
end $$;
