-- Mahalli — Seller OS
-- Migration 0007: stop public listing of the product-images bucket
--
-- A public bucket serves object *content* through the public URL
-- (/storage/v1/object/public/...) without any SELECT policy on
-- storage.objects. The broad SELECT policy added in 0005 additionally allowed
-- the storage API to LIST every object (enumerate filenames), which we don't
-- want. We store each image's URL on the product row, so listing is never
-- needed. Drop it (fixes advisor 0025). Image rendering is unaffected.

drop policy if exists "product images are publicly readable" on storage.objects;
