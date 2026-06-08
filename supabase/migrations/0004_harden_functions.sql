-- Mahalli — Seller OS
-- Migration 0004: function hardening (addresses Supabase security advisors)
--
-- 1. Pin set_updated_at's search_path (advisor 0011).
-- 2. Ensure the `anon` role cannot call any of our SECURITY DEFINER helpers
--    (advisor 0028). Anonymous traffic only ever reaches the storefront via
--    dedicated, narrowly-scoped paths — never these tenant/identity helpers.
--    `authenticated` retains EXECUTE because RLS policy evaluation needs it.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.user_seller_ids()              from anon;
revoke execute on function public.user_is_owner(uuid)            from anon;
revoke execute on function public.is_slug_available(text)        from anon;
revoke execute on function public.create_shop(text, text, text, text, text, text) from anon;
