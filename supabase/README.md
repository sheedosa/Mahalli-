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
  used for the storefront order endpoint, payment webhooks, background jobs.

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

`get_advisors(security)` reports four `authenticated_security_definer_function_executable`
warnings (`create_shop`, `is_slug_available`, `user_seller_ids`, `user_is_owner`).
These are **intentional**:

- `create_shop` / `is_slug_available` are deliberate RPC endpoints for signed-in
  users during onboarding.
- `user_seller_ids` / `user_is_owner` must be EXECUTE-able by `authenticated`
  because the RLS engine evaluates them during policy checks.

Each returns only the caller's own data (or validates the caller's own input),
so there is no cross-tenant exposure. The `anon` role cannot execute any of
them (revoked in 0004).
