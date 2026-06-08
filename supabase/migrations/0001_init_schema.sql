-- Mahalli — Seller OS
-- Migration 0001: core schema (tables, enums, indexes)
--
-- Tenancy model: single Postgres database. Every business table carries
-- `seller_id`. Isolation is enforced by Row-Level Security (see 0002).
-- This migration only creates structure; RLS is enabled separately so the
-- security spine is reviewed as its own unit.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type seller_plan      as enum ('free', 'growth', 'pro');
create type profile_role     as enum ('owner', 'staff');
create type order_status     as enum ('new', 'confirmed', 'ready', 'out', 'delivered', 'cancelled');
create type order_channel    as enum ('storefront', 'manual');
create type payment_status   as enum ('unpaid', 'paid', 'refunded');
create type payment_method   as enum ('cod', 'prepaid');
create type coupon_type      as enum ('pct', 'fixed');
create type broadcast_segment as enum ('all', 'repeat', 'recent');
create type broadcast_channel as enum ('wa_link', 'wa_cloud', 'sms');
create type broadcast_status  as enum ('draft', 'queued', 'sending', 'sent', 'failed');

-- ---------------------------------------------------------------------------
-- sellers — one row per shop (the tenant)
-- ---------------------------------------------------------------------------
create table sellers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (length(btrim(name)) between 1 and 120),
  slug          text not null unique
                  check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  owner_user_id uuid not null references auth.users (id) on delete restrict,
  city          text,
  logo_url      text,
  contact_phone text,
  lang          text not null default 'ar' check (lang in ('ar', 'en')),
  plan          seller_plan not null default 'free',
  -- delivery areas/fees are informational (no fleet, no dispatch). Stored as
  -- [{ "area": "Tripoli - Center", "fee": 10 }, ...]
  delivery_areas jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- profiles — maps an authenticated user to a tenant + role
-- ---------------------------------------------------------------------------
create table profiles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  seller_id  uuid not null references sellers (id) on delete cascade,
  role       profile_role not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (user_id, seller_id)
);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table products (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references sellers (id) on delete cascade,
  name        text not null check (length(btrim(name)) between 1 and 200),
  description text,
  price       numeric(12,2) not null default 0 check (price >= 0),
  image_url   text,
  category    text,
  -- base stock used when a product has no variants
  stock       integer not null default 0 check (stock >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- product_variants — optional per product (e.g. "Red / M")
-- ---------------------------------------------------------------------------
create table product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products (id) on delete cascade,
  label          text not null check (length(btrim(label)) between 1 and 120),
  sku            text,
  price_override numeric(12,2) check (price_override >= 0),
  stock          integer not null default 0 check (stock >= 0)
);

-- ---------------------------------------------------------------------------
-- customers — auto-built from orders, keyed by phone per seller
-- ---------------------------------------------------------------------------
create table customers (
  id             uuid primary key default gen_random_uuid(),
  seller_id      uuid not null references sellers (id) on delete cascade,
  phone          text not null,
  name           text,
  area           text,
  order_count    integer not null default 0,
  total_spent    numeric(14,2) not null default 0,
  first_order_at timestamptz,
  last_order_at  timestamptz,
  -- e.g. { "no_show": 2, "blocked": false }
  flags          jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  unique (seller_id, phone)
);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table orders (
  id             uuid primary key default gen_random_uuid(),
  seller_id      uuid not null references sellers (id) on delete cascade,
  customer_id    uuid references customers (id) on delete set null,
  status         order_status not null default 'new',
  channel        order_channel not null default 'manual',
  -- buyer contact is captured on the order even before a customer row exists
  buyer_name     text,
  buyer_phone    text,
  buyer_area     text,
  subtotal       numeric(14,2) not null default 0 check (subtotal >= 0),
  delivery_fee   numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total          numeric(14,2) not null default 0 check (total >= 0),
  payment_status payment_status not null default 'unpaid',
  payment_method payment_method not null default 'cod',
  courier        text,
  notes          text,
  -- set when status first enters 'confirmed' so stock is decremented once only
  stock_committed boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- order_items — name/price snapshots are intentional so historical orders
-- never change when a product changes later.
-- ---------------------------------------------------------------------------
create table order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders (id) on delete cascade,
  product_id     uuid references products (id) on delete set null,
  variant_id     uuid references product_variants (id) on delete set null,
  name_snapshot  text not null,
  price_snapshot numeric(12,2) not null check (price_snapshot >= 0),
  qty            integer not null check (qty > 0)
);

-- ---------------------------------------------------------------------------
-- broadcasts — async WhatsApp/SMS sends (Phase 2)
-- ---------------------------------------------------------------------------
create table broadcasts (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references sellers (id) on delete cascade,
  message         text not null,
  segment         broadcast_segment not null default 'all',
  channel         broadcast_channel not null default 'wa_link',
  recipient_count integer not null default 0,
  status          broadcast_status not null default 'draft',
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- coupons (Phase 2)
-- ---------------------------------------------------------------------------
create table coupons (
  id         uuid primary key default gen_random_uuid(),
  seller_id  uuid not null references sellers (id) on delete cascade,
  code       text not null,
  type       coupon_type not null,
  value      numeric(12,2) not null check (value >= 0),
  active     boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (seller_id, code)
);

-- ---------------------------------------------------------------------------
-- audit_log — sensitive actions only
-- ---------------------------------------------------------------------------
create table audit_log (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid not null references sellers (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  action        text not null,
  entity        text,
  entity_id     uuid,
  meta          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (per spec §4 + §7). Every seller_id is indexed; list views are
-- supported by composite indexes so they cursor-paginate without scans.
-- ---------------------------------------------------------------------------
create index sellers_slug_idx            on sellers (slug);
create index profiles_seller_idx         on profiles (seller_id);
create index products_seller_active_idx  on products (seller_id, active);
create index products_seller_created_idx on products (seller_id, created_at desc);
create index variants_product_idx        on product_variants (product_id);
create unique index customers_seller_phone_idx on customers (seller_id, phone);
create index customers_seller_last_idx   on customers (seller_id, last_order_at desc nulls last);
create index orders_seller_status_created_idx on orders (seller_id, status, created_at desc);
create index orders_seller_created_idx   on orders (seller_id, created_at desc);
create index orders_customer_idx         on orders (customer_id);
create index order_items_order_idx       on order_items (order_id);
create index order_items_product_idx     on order_items (product_id);
create index broadcasts_seller_idx       on broadcasts (seller_id, created_at desc);
create index coupons_seller_idx          on coupons (seller_id);
create index audit_seller_created_idx    on audit_log (seller_id, created_at desc);
