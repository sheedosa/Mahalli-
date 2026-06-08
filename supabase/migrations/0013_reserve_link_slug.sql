-- Mahalli — Seller OS
-- Migration 0013: reserve the `link` slug
--
-- /link is now a seller dashboard route (store-link manager), so a shop must
-- not be able to take the slug `link` (it would be shadowed).

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
    'about','terms','privacy','help','support','pricing','blog','www','link'
  ]);
$$;
