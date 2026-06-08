-- Mahalli — Seller OS
-- Migration 0005: product image storage
--
-- A public bucket so the storefront/CDN can serve images without auth. Writes
-- are locked down by RLS: a seller may only create/replace/delete objects
-- under a top-level folder named after a seller_id they belong to. Object key
-- convention: `<seller_id>/<uuid>.<ext>`.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Public read (storefront). The bucket is public, but be explicit for the
-- authenticated API path too.
create policy "product images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Sellers may upload only within their own seller_id folder.
create policy "sellers upload own product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] in (select public.user_seller_ids()::text)
  );

create policy "sellers update own product images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] in (select public.user_seller_ids()::text)
  )
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] in (select public.user_seller_ids()::text)
  );

create policy "sellers delete own product images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] in (select public.user_seller_ids()::text)
  );
