-- Mahalli — Seller OS
-- Migration 0003: onboarding RPC + shared triggers/helpers
--
-- Onboarding is atomic and runs SECURITY DEFINER so the seller row and the
-- owner profile are always created together. There is deliberately no INSERT
-- policy on `sellers`/`profiles` (0002) — this RPC is the only sanctioned path
-- to provision a tenant, which guarantees every shop has exactly one owner.

-- keep orders.updated_at honest
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_set_updated_at
  before update on orders
  for each row execute function public.set_updated_at();

-- Is a storefront slug free? Safe to expose to authenticated users during
-- onboarding (reveals only existence of a slug, which is public anyway).
create or replace function public.is_slug_available(p_slug text)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select not exists (select 1 from public.sellers where slug = lower(p_slug));
$$;

revoke all on function public.is_slug_available(text) from public;
grant execute on function public.is_slug_available(text) to authenticated;

-- Provision a shop for the currently authenticated user and make them owner.
-- One shop per user in Phase 1: refuses if the user already has a profile.
create or replace function public.create_shop(
  p_name          text,
  p_slug          text,
  p_city          text default null,
  p_logo_url      text default null,
  p_contact_phone text default null,
  p_lang          text default 'ar'
)
returns public.sellers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_slug   text := lower(btrim(p_slug));
  v_seller public.sellers;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if exists (select 1 from public.profiles where user_id = v_uid) then
    raise exception 'user already belongs to a shop' using errcode = 'P0001';
  end if;

  if p_lang is null or p_lang not in ('ar', 'en') then
    p_lang := 'ar';
  end if;

  begin
    insert into public.sellers (name, slug, owner_user_id, city, logo_url, contact_phone, lang)
    values (btrim(p_name), v_slug, v_uid, nullif(btrim(coalesce(p_city, '')), ''),
            nullif(btrim(coalesce(p_logo_url, '')), ''),
            nullif(btrim(coalesce(p_contact_phone, '')), ''), p_lang)
    returning * into v_seller;
  exception
    when unique_violation then
      raise exception 'slug already taken' using errcode = 'P0002';
    when check_violation then
      raise exception 'invalid shop name or slug' using errcode = 'P0003';
  end;

  insert into public.profiles (user_id, seller_id, role)
  values (v_uid, v_seller.id, 'owner');

  insert into public.audit_log (seller_id, actor_user_id, action, entity, entity_id, meta)
  values (v_seller.id, v_uid, 'shop.created', 'seller', v_seller.id,
          jsonb_build_object('slug', v_seller.slug));

  return v_seller;
end;
$$;

revoke all on function public.create_shop(text, text, text, text, text, text) from public;
grant execute on function public.create_shop(text, text, text, text, text, text) to authenticated;
