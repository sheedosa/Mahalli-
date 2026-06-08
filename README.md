# Mahalli — Seller OS

A multi-tenant **seller operating system** for independent Instagram/Facebook
shops in Libya: products, orders, customers, repeat-sales and a storefront, in
one mobile-first, Arabic-first PWA.

> Hard product constraints: **no delivery fleet**, **no money custody** (payments
> via a third-party gateway), **mobile-first / weak-network-tolerant / Arabic-RTL**.
> See the full build spec for the full vision and phasing.

## Stack

- **Next.js 16** (App Router) + **React 19** + **Tailwind v4**, built as an
  installable **PWA** (service worker, offline shell, Arabic/RTL).
- **Supabase** — Postgres + Auth + Storage. Tenancy by `seller_id`, enforced by
  **Row-Level Security**.
- Hosting target: Vercel (frontend/API) + Supabase (data).

## What's built (foundation — build sequence steps 1–3)

- ✅ Next.js + Tailwind + PWA shell (manifest, service worker, offline page).
- ✅ Full database **schema + RLS on every table + indexes** (the security
  spine), applied to a live Supabase project and **cross-tenant isolation
  tested**. See [`supabase/README.md`](supabase/README.md).
- ✅ Atomic shop provisioning (`create_shop` RPC) — no owner-less shops possible.
- ✅ **Auth** (email + password) with session refresh, route gating and a
  structure ready to add phone-OTP.
- ✅ **Seller onboarding** — create shop with live slug-availability check.
- ✅ **Dashboard shell** — mobile bottom-nav, overview with real per-seller
  stats, editable **settings**.
- ✅ **Products & inventory** (step 4) — list with search + cursor pagination,
  create/edit/delete with **variants**, **image upload** to Supabase Storage
  (seller-scoped), stock/active badges. Mutations go through an atomic,
  ownership-checked `save_product` RPC.
- ✅ **Public storefront** (step 5) — `/<slug>`, Arabic/RTL, product grid +
  add-to-cart sheet (variants/qty) + checkout. Anonymous **order creation** via
  the `place_order` RPC: server-side validated, prices re-derived from the DB,
  honeypot + rate-limited — never a raw anon insert. Reserved slugs stop shops
  shadowing app routes.
- ✅ **Order pipeline + customer book** (step 6) — orders list (status filter,
  search, pagination), order detail with status flow (New→Confirmed→Ready→Out→
  Delivered/Cancelled), **stock decremented on confirm, restored on cancel**,
  editable notes, manual order entry. Customers are **auto-built from orders by
  phone** (order count, total spent, last order) via DB triggers.
- ✅ **i18n EN/AR + full RTL** — Arabic is the default; one toggle flips all
  copy and direction.
- ✅ **Security hardening** — nonce-based CSP (`strict-dynamic`), HSTS,
  `X-Frame-Options`, `nosniff`, Referrer/Permissions-Policy; service-role key
  guarded out of the client bundle; zod validation on every mutation.

## What's next (later build-sequence steps)

7. Overview/analytics.
8. Phase 2: WhatsApp broadcast → notifications → COD/RTO → payments (DPAY) →
   discounts → staff/RBAC → delivery note.

## Local development

```bash
cp .env.example .env.local     # fill in the Supabase URL + publishable key
npm install
npm run dev                    # http://localhost:3000
```

The committed `.env.local` already points at the live **Mahalli** Supabase
project (URL + publishable/anon key — both client-safe). To exercise the
storefront order endpoint / webhooks later you'll also need the server-only
`SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard → Project Settings → API).

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sheedosa/Mahalli-&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_SITE_URL)

Vercel is the recommended host (GitHub Pages can't run this — it needs a Node
server for auth, server actions, the `proxy`, and dynamic routes). Set three
public env vars and point Supabase Auth at your domain. Full step-by-step with
the exact values: **[DEPLOY.md](DEPLOY.md)**.

The build does **not** require any env vars to be present (env is read lazily
at runtime), so a missing var won't fail the build — but `NEXT_PUBLIC_*` must
be set for the app to actually reach Supabase.

## Project layout

```
src/
  app/
    (auth)/            login, signup, server actions
    auth/callback/     email-confirmation code exchange
    onboarding/        create-shop flow
    (dashboard)/       protected shell: overview, products, orders, customers, settings
    [slug]/            public storefront + order placement action
    manifest.ts        PWA manifest
    page.tsx           public landing
  components/          UI primitives, dashboard shell, forms, locale switcher
  i18n/                locales, AR/EN dictionaries, provider, config
  lib/
    supabase/          client / server / proxy / admin (service-role) clients
    auth.ts            seller-context resolver (cached per request)
    database.types.ts  generated from the live schema
  proxy.ts             session refresh + auth gating + security headers
supabase/
  migrations/          schema + RLS + onboarding + hardening
  seed.sql             optional dev catalogue
  README.md            database & security spine docs
```

## Security model (non-negotiable)

RLS scopes every read/write to the signed-in user's tenant. The browser only
ever holds the publishable (anon) key. The (future) service-role key lives in
server env and is guarded by a `server-only` import so it can never reach the
client. Anonymous traffic has **no database table policies** — buyers reach the
DB only through two tightly-scoped `SECURITY DEFINER` RPCs (`get_storefront`,
`place_order`) that validate and rate-limit server-side. Full details:
[`supabase/README.md`](supabase/README.md).

## Decisions made during this build

- **Auth:** email + password now; auth layer structured so phone-OTP slots in
  later (spec §11). Needs a Libya-capable SMS provider before enabling.
- **Storefront addressing:** path-based `/<slug>` (per spec).
- **Supabase region:** `eu-central-1` (Frankfurt), closest to Libya.

Still open (spec §11): final brand/domain, SMS provider, pricing tiers and exact
feature gating, when to move from `wa.me` links to the WhatsApp Cloud API.
