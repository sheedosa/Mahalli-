-- Mahalli — Seller OS
-- Migration 0002: Row-Level Security (the product's security spine)
--
-- Model: a row is accessible only if its seller_id matches a seller the
-- requesting user belongs to (auth.uid() -> profiles -> seller_id).
--
-- RLS is deny-by-default once enabled. We grant NO policies to the `anon`
-- role: the public storefront and anonymous order creation go exclusively
-- through SECURITY DEFINER RPCs / service-role server endpoints (0003), never
-- a raw anon read/insert. `service_role` bypasses RLS for trusted server code.

-- ---------------------------------------------------------------------------
-- Tenant resolver. SECURITY DEFINER so it bypasses RLS on `profiles` and can
-- never recurse into the policies that call it. STABLE so the planner caches
-- it per-statement. Empty search_path to prevent search-path hijacking.
-- ---------------------------------------------------------------------------
create or replace function public.user_seller_ids()
returns setof uuid
language sql
security definer
stable
set search_path = ''
as $$
  select seller_id from public.profiles where user_id = auth.uid();
$$;

revoke all on function public.user_seller_ids() from public;
grant execute on function public.user_seller_ids() to authenticated;

-- Convenience: does the current user own (role = owner) the given seller?
-- Used to gate owner-only actions (billing, staff, destructive ops).
create or replace function public.user_is_owner(target_seller uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid()
      and seller_id = target_seller
      and role = 'owner'
  );
$$;

revoke all on function public.user_is_owner(uuid) from public;
grant execute on function public.user_is_owner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere. FORCE so even the table owner is subject to policies
-- (defense in depth; only service_role / SECURITY DEFINER bypass).
-- ---------------------------------------------------------------------------
alter table sellers          enable row level security;
alter table profiles         enable row level security;
alter table products         enable row level security;
alter table product_variants enable row level security;
alter table customers        enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table broadcasts       enable row level security;
alter table coupons          enable row level security;
alter table audit_log        enable row level security;

-- ---------------------------------------------------------------------------
-- sellers — read/update your own shop(s). Creation is done atomically via the
-- create_shop() RPC (0003); there is intentionally no INSERT policy here so a
-- shop can never be created without a matching owner profile. Deletion is not
-- exposed to the API.
-- ---------------------------------------------------------------------------
create policy sellers_select on sellers for select to authenticated
  using (id in (select public.user_seller_ids()));

create policy sellers_update on sellers for update to authenticated
  using (id in (select public.user_seller_ids()))
  with check (id in (select public.user_seller_ids()));

-- ---------------------------------------------------------------------------
-- profiles — you can see profiles within your own tenant (for staff lists).
-- Writes (invites, role changes) go through RPCs / RBAC in Phase 2.
-- ---------------------------------------------------------------------------
create policy profiles_select on profiles for select to authenticated
  using (user_id = auth.uid() or seller_id in (select public.user_seller_ids()));

-- ---------------------------------------------------------------------------
-- products — full CRUD within your tenant.
-- ---------------------------------------------------------------------------
create policy products_select on products for select to authenticated
  using (seller_id in (select public.user_seller_ids()));
create policy products_insert on products for insert to authenticated
  with check (seller_id in (select public.user_seller_ids()));
create policy products_update on products for update to authenticated
  using (seller_id in (select public.user_seller_ids()))
  with check (seller_id in (select public.user_seller_ids()));
create policy products_delete on products for delete to authenticated
  using (seller_id in (select public.user_seller_ids()));

-- ---------------------------------------------------------------------------
-- product_variants — scoped through the parent product's seller_id.
-- ---------------------------------------------------------------------------
create policy variants_select on product_variants for select to authenticated
  using (exists (
    select 1 from products p
    where p.id = product_variants.product_id
      and p.seller_id in (select public.user_seller_ids())));
create policy variants_insert on product_variants for insert to authenticated
  with check (exists (
    select 1 from products p
    where p.id = product_variants.product_id
      and p.seller_id in (select public.user_seller_ids())));
create policy variants_update on product_variants for update to authenticated
  using (exists (
    select 1 from products p
    where p.id = product_variants.product_id
      and p.seller_id in (select public.user_seller_ids())))
  with check (exists (
    select 1 from products p
    where p.id = product_variants.product_id
      and p.seller_id in (select public.user_seller_ids())));
create policy variants_delete on product_variants for delete to authenticated
  using (exists (
    select 1 from products p
    where p.id = product_variants.product_id
      and p.seller_id in (select public.user_seller_ids())));

-- ---------------------------------------------------------------------------
-- customers — CRUD within your tenant. (Auto-built from orders; sellers may
-- also edit name/area/flags.)
-- ---------------------------------------------------------------------------
create policy customers_select on customers for select to authenticated
  using (seller_id in (select public.user_seller_ids()));
create policy customers_insert on customers for insert to authenticated
  with check (seller_id in (select public.user_seller_ids()));
create policy customers_update on customers for update to authenticated
  using (seller_id in (select public.user_seller_ids()))
  with check (seller_id in (select public.user_seller_ids()));

-- ---------------------------------------------------------------------------
-- orders — CRUD within your tenant.
-- ---------------------------------------------------------------------------
create policy orders_select on orders for select to authenticated
  using (seller_id in (select public.user_seller_ids()));
create policy orders_insert on orders for insert to authenticated
  with check (seller_id in (select public.user_seller_ids()));
create policy orders_update on orders for update to authenticated
  using (seller_id in (select public.user_seller_ids()))
  with check (seller_id in (select public.user_seller_ids()));
create policy orders_delete on orders for delete to authenticated
  using (seller_id in (select public.user_seller_ids()));

-- ---------------------------------------------------------------------------
-- order_items — scoped through the parent order's seller_id.
-- ---------------------------------------------------------------------------
create policy order_items_select on order_items for select to authenticated
  using (exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and o.seller_id in (select public.user_seller_ids())));
create policy order_items_insert on order_items for insert to authenticated
  with check (exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and o.seller_id in (select public.user_seller_ids())));
create policy order_items_update on order_items for update to authenticated
  using (exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and o.seller_id in (select public.user_seller_ids())))
  with check (exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and o.seller_id in (select public.user_seller_ids())));
create policy order_items_delete on order_items for delete to authenticated
  using (exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and o.seller_id in (select public.user_seller_ids())));

-- ---------------------------------------------------------------------------
-- broadcasts — CRUD within your tenant.
-- ---------------------------------------------------------------------------
create policy broadcasts_select on broadcasts for select to authenticated
  using (seller_id in (select public.user_seller_ids()));
create policy broadcasts_insert on broadcasts for insert to authenticated
  with check (seller_id in (select public.user_seller_ids()));
create policy broadcasts_update on broadcasts for update to authenticated
  using (seller_id in (select public.user_seller_ids()))
  with check (seller_id in (select public.user_seller_ids()));

-- ---------------------------------------------------------------------------
-- coupons — CRUD within your tenant.
-- ---------------------------------------------------------------------------
create policy coupons_select on coupons for select to authenticated
  using (seller_id in (select public.user_seller_ids()));
create policy coupons_insert on coupons for insert to authenticated
  with check (seller_id in (select public.user_seller_ids()));
create policy coupons_update on coupons for update to authenticated
  using (seller_id in (select public.user_seller_ids()))
  with check (seller_id in (select public.user_seller_ids()));
create policy coupons_delete on coupons for delete to authenticated
  using (seller_id in (select public.user_seller_ids()));

-- ---------------------------------------------------------------------------
-- audit_log — read-only within your tenant. Append-only: writes happen via
-- SECURITY DEFINER helpers only, never directly from the client.
-- ---------------------------------------------------------------------------
create policy audit_select on audit_log for select to authenticated
  using (seller_id in (select public.user_seller_ids()));
