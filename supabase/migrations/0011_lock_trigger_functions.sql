-- Mahalli — Seller OS
-- Migration 0011: stop trigger functions being callable as RPCs
--
-- orders_link_customer() and orders_touch_customer() are trigger-only. Triggers
-- invoke them regardless of EXECUTE grants, so revoking direct execute is safe
-- and removes them from the exposed REST RPC surface (advisors 0028/0029).

revoke all on function public.orders_link_customer()  from public, anon, authenticated;
revoke all on function public.orders_touch_customer() from public, anon, authenticated;
