-- Mahalli — Seller OS
-- Migration 0014: performance advisor cleanup
--
-- Non-destructive fixes flagged by the Supabase performance advisor. None of
-- these change behaviour or access — they only make the planner faster.

-- 1. RLS init-plan: wrap auth.uid() in a scalar subquery so Postgres evaluates
--    it once per statement instead of once per row (lint 0003). The
--    user_seller_ids() arm is already a subquery, so it was never the problem.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    user_id = (select auth.uid())
    or seller_id in (select public.user_seller_ids())
  );

-- 2. Duplicate index (lint 0009): customers_seller_phone_idx is identical to the
--    UNIQUE constraint index customers_seller_id_phone_key. Drop the plain copy;
--    the UNIQUE index stays and keeps serving merge-by-phone lookups.
drop index if exists public.customers_seller_phone_idx;

-- 3. Unindexed foreign keys (lint 0001): add covering indexes so FK lookups and
--    cascade checks don't sequential-scan.
create index if not exists order_items_variant_idx
  on public.order_items (variant_id);
create index if not exists sellers_owner_user_idx
  on public.sellers (owner_user_id);
create index if not exists audit_log_actor_idx
  on public.audit_log (actor_user_id);
