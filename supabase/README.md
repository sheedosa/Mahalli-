# Mahalli — Database & Security Spine

Single Postgres database, multi-tenant by `seller_id`, isolation enforced by
**Row-Level Security**. RLS is the product's security boundary — it is written
and tested before any feature reads or writes real data (spec §6, §10).

## Migrations (apply in order)

| File | What it does |
|------|--------------|
| `0001_init_schema.sql` | Enums, all tables (§4), indexes (§4/§7). Structure only. |
| `0002_rls_policies.sql` | The security spine: tenant resolver + RLS on every table. |
| `0003_onboarding_and_helpers.sql` | `create_shop()` RPC, `is_slug_available()`, `updated_at` trigger. |
| `0004_harden_functions.sql` | Pins function `search_path`; revokes helper EXECUTE from `anon`. |
| `0005_product_image_storage.sql` | `product-images` bucket + storage RLS (sellers write only their own folder). |
| `0006_save_product.sql` | Atomic `save_product()` RPC: upsert product + replace variants, ownership-checked. |
| `0007_storage_no_listing.sql` | Drops the public listing policy (object URLs still work; no enumeration). |
| `0008_reserved_slugs.sql` | Reserved-slug guard so a shop can't shadow an app route. |
| `0009_storefront.sql` | Public `get_storefront()` (read) + `place_order()` (validated, rate-limited write). |
| `seed.sql` | Optional dev catalogue for an existing shop (run manually). |

Live project: **Mahalli** (`wolrnueoxodvezijyrbf`, eu-central-1). Migrations
0001–0004 are already applied there.

Apply locally with the Supabase CLI:

```bash
supabase db push           # or: psql "$DATABASE_URL" -f supabase/migrations/000X_*.sql
```

Regenerate TypeScript types after any schema change:

```bash
supabase gen types typescript --project-id wolrnueoxodvezijyrbf > src/lib/database.types.ts
```

## How tenant isolation works

`auth.uid()` → `profiles` → `seller_id`. A `SECURITY DEFINER` helper,
`public.user_seller_ids()`, returns the seller(s) the caller belongs to. It is
`DEFINER` so it bypasses RLS on `profiles` and can never recurse into the
policies that call it; `search_path = ''` prevents search-path hijacking.

Every business table has policies of the form:

```sql
using (seller_id in (select public.user_seller_ids()))
```

Child tables without a direct `seller_id` (`order_items`, `product_variants`)
are scoped through their parent via an `EXISTS` join.

### Roles
- **`authenticated`** — sellers/staff; scoped to their tenant by the policies above.
- **`anon`** — has **no** policies and **no** EXECUTE on the helper functions.
  Public storefront reads and anonymous order creation go through dedicated,
  narrowly-scoped paths (a storefront RPC and a service-role server endpoint —
  build steps 5+), never raw anon access.
- **`service_role`** — trusted server code only (admin client). Bypasses RLS;
  reserved for future payment webhooks / background jobs.

### The public storefront (anonymous access)

Anonymous buyers never touch tables directly — there are no `anon` RLS
policies. They reach the database only through two `SECURITY DEFINER` functions
that `anon` can execute:

- **`get_storefront(slug)`** — returns a shop's public info and its *active*
  products only (inactive products and other tenants are invisible).
- **`place_order(slug, name, phone, area, items, hp)`** — creates a `new`
  storefront order. It **re-derives every price from the DB** (client-supplied
  prices are ignored), validates each product belongs to the shop and is
  active, enforces a **honeypot** and **rate limits** (per phone: 1/30s and
  5/hour; per shop: 60/min), and writes the order + items atomically. Stock is
  *not* decremented here — that happens on confirm (build step 6).

This is the spec's "server-side validated endpoint, never a raw anon insert"
(§6) implemented as RPCs instead of a service-role HTTP handler: same security
properties, no service-role key to hold, and testable under the `anon` role.

## Provisioning a tenant

There is **no INSERT policy** on `sellers` or `profiles`. The only way to
create a shop is `create_shop(name, slug, …)`, a `SECURITY DEFINER` RPC that
inserts the seller and the owner profile in one transaction and writes an
audit-log entry. This guarantees every shop has exactly one owner and no
orphaned/owner-less shops can exist.

## Cross-tenant isolation test

Step 2 of the build sequence requires proving isolation before continuing. The
test creates two users + shops, then asserts from each user's RLS context that
they cannot read or write the other's rows. It runs inside a single `DO` block
that raises at the end to roll itself back, leaving zero test data. Re-run:

```sql
-- see the DO block used during the build; it asserts:
--   * a user sees only their own products/sellers
--   * a user CANNOT read another tenant's product (no leak)
--   * a user CANNOT update another tenant's product (no tamper)
```

Result on the live project: **all assertions passed**, zero rows persisted.

## Security advisor notes

`get_advisors(security)` reports only `*_security_definer_function_executable`
warnings, all **intentional**:

- **anon-executable** (`get_storefront`, `place_order`) — the public storefront
  endpoints. Both are deliberately exposed to `anon` and strictly scoped (see
  "The public storefront" above): reads return active products only; writes are
  validated, price-re-derived and rate-limited.
- **authenticated-executable** (`create_shop`, `is_slug_available`,
  `save_product`, `user_seller_ids`, `user_is_owner`) — RPC endpoints for
  signed-in sellers, plus the RLS helpers the policy engine must evaluate.
  `save_product` checks `p_seller in (select user_seller_ids())` and updates
  only rows matching `seller_id`, so a product cannot be created in or moved to
  another tenant (verified by test).

Each function returns only the caller's permitted data (or validates the
caller's own input), so there is no cross-tenant exposure. No base tables are
exposed to `anon`; there are no anon RLS policies.

## Storage

Bucket `product-images` is public (so the storefront/CDN can serve images by
URL). Writes are restricted by `storage.objects` RLS: a seller may only
create/replace/delete objects under a top-level folder named after a
`seller_id` they belong to (key convention `<seller_id>/<uuid>.<ext>`). There is
no public SELECT/list policy — object content is reachable via its public URL,
but the bucket's filenames cannot be enumerated.
