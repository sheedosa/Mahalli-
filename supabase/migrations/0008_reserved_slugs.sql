-- Mahalli — Seller OS
-- Migration 0008: reserved storefront slugs
--
-- The storefront lives at the root path (mahalli.app/<slug>). A slug must not
-- collide with a real application route, or that shop would be unreachable.
-- Reserve those names: reject them at creation and report them as unavailable.

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
    'about','terms','privacy','help','support','pricing','blog','www'
  ]);
$$;

revoke all on function public.slug_is_reserved(text) from public, anon;
grant execute on function public.slug_is_reserved(text) to authenticated;

-- is_slug_available now also rejects reserved names.
create or replace function public.is_slug_available(p_slug text)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select not public.slug_is_reserved(p_slug)
     and not exists (select 1 from public.sellers where slug = lower(p_slug));
$$;

-- create_shop refuses reserved slugs (P0002, same code as "taken").
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

  if public.slug_is_reserved(v_slug) then
    raise exception 'slug reserved' using errcode = 'P0002';
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

revoke all on function public.create_shop(text, text, text, text, text, text) from public, anon;
grant execute on function public.create_shop(text, text, text, text, text, text) to authenticated;
