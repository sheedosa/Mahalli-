-- Mahalli — Seller OS
-- Migration 0012: per-shop storefront theme
--
-- A seller picks a storefront theme (Editorial Cream / Mono / Pastel / Noir /
-- Sage / Blush / Ocean). It's a presentation token applied as a CSS-variable
-- palette on the storefront; defaults to 'cream'.

alter table sellers
  add column theme text not null default 'cream'
  check (theme in ('cream','mono','pastel','noir','sage','blush','ocean'));

-- Expose the theme on the public storefront read.
create or replace function public.get_storefront(p_slug text)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_seller public.sellers;
  v_result jsonb;
begin
  select * into v_seller from public.sellers where slug = lower(p_slug);
  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'shop', jsonb_build_object(
      'name', v_seller.name,
      'slug', v_seller.slug,
      'city', v_seller.city,
      'logo_url', v_seller.logo_url,
      'contact_phone', v_seller.contact_phone,
      'lang', v_seller.lang,
      'theme', v_seller.theme,
      'delivery_areas', v_seller.delivery_areas
    ),
    'products', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'price', p.price,
          'image_url', p.image_url,
          'category', p.category,
          'stock', p.stock,
          'variants', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', v.id, 'label', v.label,
                'price_override', v.price_override, 'stock', v.stock
              ) order by v.label
            )
            from public.product_variants v where v.product_id = p.id
          ), '[]'::jsonb)
        ) order by p.created_at desc
      )
      from public.products p
      where p.seller_id = v_seller.id and p.active = true
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;
