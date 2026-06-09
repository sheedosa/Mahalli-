# Mahalli — Project Status (Technical Handoff)

> Point-in-time snapshot of the whole application. Technical/handoff oriented.
> **Branch:** `claude/mahalli-seller-os-spec-vv1Fy` · **Last updated:** 2026-06-09 ·
> **Stage:** MVP feature-complete, pre-launch · **CI:** green (unit + DB + E2E).

---

## 1. At a glance

Mahalli is a **multi-tenant, Arabic-first / RTL, mobile-first PWA** — a "Seller OS" that lets
small independent sellers in Libya (who sell via Instagram, Facebook, WhatsApp and in person)
run their whole shop from a phone: products, a public storefront, orders, and an
auto-built customer book.

- **Frontend/runtime:** Next.js 16 (App Router) + React 19 + Tailwind v4, TypeScript, PWA.
- **Backend/data:** Supabase — Postgres + Auth + Storage; tenancy by `seller_id`, enforced by
  Row-Level Security (RLS) and `SECURITY DEFINER` RPCs.
- **Hosting:** Vercel (app) + Supabase (`eu-central-1`, Frankfurt; project ref
  `wolrnueoxodvezijyrbf`).
- **Product constraints:** no delivery fleet, no money custody (payments via a future
  third-party gateway), weak-network tolerant, Arabic-RTL by default.

Status: the foundation → products → storefront → order pipeline → customer book is **built,
branded, mobile-polished, and tested** end-to-end with green CI. Pre-revenue; several Phase-2
features (broadcasts, payments, staff roles, analytics) are intentionally not built yet.

---

## 2. Tech stack

| Area | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | `16.2.7` |
| UI runtime | React / React DOM | `19.2.4` |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) | `^4` |
| Language | TypeScript | `^5` |
| Data/Auth/Storage | `@supabase/ssr` / `@supabase/supabase-js` | `^0.10.3` / `^2.107.0` |
| Validation | zod | `^4.4.3` |
| Icons | lucide-react | `^1.17.0` |
| QR | qrcode | `^1.5.4` |
| Class utils | tailwind-merge / clsx | `^3.6.0` / `^2.1.1` |
| Server guard | server-only | `^0.0.1` |
| Unit tests | Vitest (+ v8 coverage) | `^2.1.9` |
| E2E | @playwright/test | `^1.60.0` |

No backend service of our own — all server logic runs as Next.js **server actions / route
handlers** and Postgres **RPCs**.

---

## 3. Architecture

- **App Router**, server components by default; mutations via **server actions**; client
  components only where interactivity is needed (lists, forms, sheets).
- **`src/proxy.ts`** (middleware): refreshes the Supabase session, gates protected routes,
  bounces signed-in users off auth screens, and sets security headers (nonce-based CSP with
  `strict-dynamic`, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, Referrer/Permissions
  policy). Hardened so a failure falls through as "no session" instead of 500-ing.
- **Lazy / baked-in env** (`src/lib/env.ts`): the public Supabase URL + publishable key have
  built-in defaults, so the app **builds and runs with zero env vars**. The server-only
  service-role key has no default and is guarded by a `server-only` import (can never reach the
  browser bundle).
- **Resilience:** `app/error.tsx`, `app/global-error.tsx`, a branded root `not-found.tsx`, and
  an offline page — nothing blanks or 500s.
- **PWA:** `src/app/manifest.ts` + `public/sw.js` (precached shell, network-first nav with
  offline fallback, bypasses auth/Supabase) + maskable icons. Installable to home screen.

---

## 4. Multi-tenancy & security model

- **RLS on every table** (9 tables, deny-by-default). The single tenant choke point is
  `user_seller_ids()` — `SECURITY DEFINER`, `STABLE`, `search_path = ''` — used by every policy;
  it can't recurse into the policies that call it.
- **Anonymous traffic has no table policies.** Buyers reach the DB only through two tightly
  scoped `SECURITY DEFINER` RPCs: `get_storefront` (active products only) and `place_order`
  (server-side validation, **prices re-derived from the DB**, honeypot, per-phone/per-shop rate
  limits). Never a raw anon insert/select.
- **Storage:** product images live in a public-read bucket but **writes are folder-scoped per
  seller** (`<seller_id>/…`) via RLS; no bucket listing.
- **Every mutation is zod-validated**; all `SECURITY DEFINER` functions pin `search_path`.
- **Advisors:** performance advisors clean after migration `0014`. One security advisor remains
  by choice for now — **leaked-password protection is still disabled** (a one-click Supabase
  Auth toggle; see §11).

---

## 5. Database

**Migrations (`supabase/migrations/`, 14 total):**

| # | File | Purpose |
|---|---|---|
| 0001 | `init_schema` | tables, enums, indexes |
| 0002 | `rls_policies` | RLS + `user_seller_ids()` / `user_is_owner()` |
| 0003 | `onboarding_and_helpers` | `create_shop`, `is_slug_available` |
| 0004 | `harden_functions` | `search_path` pinning |
| 0005 | `product_image_storage` | storage bucket + policies |
| 0006 | `save_product` | atomic product+variant upsert RPC |
| 0007 | `storage_no_listing` | drop bucket LIST policy |
| 0008 | `reserved_slugs` | `slug_is_reserved()` |
| 0009 | `storefront` | `get_storefront`, `place_order` |
| 0010 | `order_pipeline` | `set_order_status`, `create_manual_order`, customer triggers |
| 0011 | `lock_trigger_functions` | revoke trigger-only fns from API roles |
| 0012 | `seller_theme` | `sellers.theme` + storefront exposure |
| 0013 | `reserve_link_slug` | reserve `/link` |
| 0014 | `advisor_perf` | RLS init-plan fix, drop dup index, FK covering indexes |

**Tables:** `sellers`, `profiles`, `products`, `product_variants`, `customers`, `orders`,
`order_items`, `broadcasts`, `coupons`, `audit_log`.

**Key RPCs / behaviour:**
- `create_shop` — atomic seller + owner profile (no owner-less shops); reserved/duplicate slug
  rejected.
- `save_product` — ownership-checked upsert; replaces variants atomically.
- `get_storefront` / `place_order` — public read/write (see §4).
- `set_order_status` — status flow New→Confirmed→Ready→Out→Delivered/Cancelled; **stock
  decremented on first commit, restored on cancel** (idempotent via a `stock_committed` flag).
- `create_manual_order` — seller-entered orders (in-store/phone), prices re-derived.
- Triggers `orders_link_customer` / `orders_touch_customer` + `recompute_customer` — **customers
  auto-built and merged by phone** (order count, total spent, last order); trigger-only, not API
  reachable.

---

## 6. Routes / surfaces

| Route | Type | What it is |
|---|---|---|
| `/` | public | Landing (value prop + CTAs) |
| `/login`, `/signup` | public | Email+password auth |
| `/auth/callback` | public | Email-confirmation code exchange |
| `/onboarding` | gated | Create shop (live slug check) |
| `/dashboard` | gated | Overview: metric tiles, getting-started checklist, recent orders |
| `/products`, `/products/new`, `/products/[id]` | gated | Product list / create / edit |
| `/orders`, `/orders/new`, `/orders/[id]` | gated | Order list / manual entry / detail + status |
| `/customers`, `/customers/[id]` | gated | Customer book / detail |
| `/settings` | gated | Shop info, language, storefront theme |
| `/link` | gated | Share storefront: live URL, real QR, WhatsApp/FB/Telegram |
| `/[slug]` | **public storefront** | Buyer: browse → product sheet → cart → checkout → success |
| `/offline`, `not-found` | system | PWA offline + branded 404 |

---

## 7. Feature status

**Built & working**
- Auth (email+password, session refresh, route gating, callback).
- Onboarding (atomic shop creation, live slug availability, language).
- Dashboard overview with real per-seller stats + a **Getting-Started checklist** (add product →
  share link → first order, live progress, dismissible).
- Products: search + cursor pagination, create/edit/delete, **variants**, **image upload**
  (seller-scoped Storage), stock/active badges.
- Orders: list (status filter, search, pagination), **manual order entry**, detail with status
  pipeline + editable notes; stock movement on confirm/cancel.
- Customers: auto-built book keyed by phone.
- Settings: shop info, default language, storefront theme picker.
- Store link: live URL, **real scannable QR**, social share.
- Public storefront: full buyer flow with anonymous, validated order placement.
- 7 storefront themes; **EN/AR with full RTL** (Arabic default, one-toggle switch).
- PWA (installable, offline shell); branded identity; app-wide mobile polish.

**Not built yet / roadmap**
- Phone-OTP sign-in (auth layer is structured for it; needs a Libya-capable SMS provider).
- WhatsApp broadcasts; coupons/discounts; payments (e.g. DPAY, COD default today).
- Staff / role-based access (Phase 2); overview analytics; guided multi-step onboarding wizard.
- Email confirmation is **currently off** for demo testing.

---

## 8. i18n, theming & branding

- **i18n:** cookie-driven locale (`mahalli_locale`), Arabic default + RTL; EN/AR dictionaries
  with **type-enforced key parity** (`Dictionary = typeof en`, so `tsc` fails on drift). Voice is
  warm and **channel-agnostic** ("Your shop, in your pocket" / "Run your shop from your phone").
- **Theming:** 7 seller-selectable storefront themes (cream/mono/pastel/noir/sage/blush/ocean)
  via CSS-variable classes, plus a dedicated **`.theme-mahalli`** app surface (green/orange) used
  only on the seller/admin shells — storefront themes are untouched by the app rebrand.
- **Branding:** green shopping-bag "M" mark with a coral handle + "Mahalli" wordmark, wired into
  the PWA icon, favicon, OG/Twitter metadata, and the seller headers. **The committed brand
  assets are faithful vector stand-ins** (`public/brand/`) — final PNG exports (`icon.png`,
  `wordmark.png`, `og.png`) can be dropped in to replace them.

---

## 9. Testing & CI

Three layers, all in `.github/workflows/ci.yml` (push + PR), three parallel jobs:

| Layer | Tool | Scope | Command |
|---|---|---|---|
| Unit | Vitest | 39 tests — cart/pricing, themes, order-status, slug rules, i18n | `npm test` |
| Database | psql/SQL | RLS isolation, every RPC's checks, stock, customer merge, price re-derivation, honeypot/rate-limit (txn rolled back) | `npm run test:db` |
| E2E | Playwright | buyer checkout + seller signup→onboard→add-product, against built app + local Supabase | `npm run test:e2e` |

- **quality** job needs no secrets (baked-in public defaults). **db** + **e2e** spin up a local
  Supabase (Docker) and never touch production.
- **Known flake:** the `db`/`e2e` jobs use `supabase/setup-cli@v1` with `version: latest`, which
  occasionally hits the GitHub API rate limit while resolving the latest release. A re-run fixes
  it; pinning the version would remove the flake (see §11).

---

## 10. Environments & deploy

- **Hosting:** Vercel (needs a Node server — auth, server actions, the `proxy`, dynamic routes;
  GitHub Pages can't run it). Live Supabase project `wolrnueoxodvezijyrbf` (`eu-central-1`).
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (both have baked-in
  public defaults), `NEXT_PUBLIC_SITE_URL` (auth email redirect / absolute links), and the
  server-only `SUPABASE_SERVICE_ROLE_KEY` (only needed for future webhooks/background jobs).
- **Build needs zero env vars** (env is read lazily), so a missing var never fails the build —
  but `NEXT_PUBLIC_*` must be set for the app to reach a non-default Supabase project.
- See **`DEPLOY.md`** for the full Vercel + Supabase step-by-step.

---

## 11. Known gaps / before launch

- [ ] Enable Supabase **leaked-password protection** (Auth setting; only remaining security WARN).
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production domain on Vercel.
- [ ] Re-enable **email confirmation** before real users (off for demo).
- [ ] Commit the **final brand PNGs** to `public/brand/` (vector stand-ins are in place).
- [ ] **Pin `supabase/setup-cli`** to a fixed version in CI to remove the rate-limit flake.
- [ ] Choose a Libya-capable **SMS provider** (phone-OTP) and a **payments gateway**.
- [ ] Refresh the older **`README.md`** (predates the rebrand / voice / mobile pass).

---

## 12. Recent changes (latest first)

- **Mobile FAB fix** — moved the Products "Add" FAB out of the `.anim-in` (transform) wrapper so
  it stops rendering off-screen on iOS (a transformed ancestor was capturing the fixed element).
- **App-wide mobile polish** — safe-area insets (notch / home indicator), 16px inputs (no iOS
  zoom), bigger tap targets, native tap ergonomics; storefront scroll-lock + 2-line product
  names; offline retry button.
- **Friendlier onboarding** — channel-agnostic voice, softened jargon, dashboard
  getting-started checklist (no DB change; `localStorage` + `useSyncExternalStore`).
- **Mahalli rebrand** — `.theme-mahalli` app surface + wordmark/icon, storefront untouched.
- **Pre-demo hardening** — perf migration `0014`, branded 404, real scannable QR.

---

## 13. Repo layout

```
src/
  app/
    (auth)/            login, signup, server actions
    auth/callback/     email-confirmation code exchange
    onboarding/        create-shop flow
    (dashboard)/       protected shell: overview, products, orders, customers, settings, link
    [slug]/            public storefront + order placement
    manifest.ts        PWA manifest
    page.tsx           public landing
    not-found.tsx      branded 404
  components/          UI primitives, dashboard shell, storefront, forms, brand, locale switcher
  i18n/                locales, AR/EN dictionaries, provider, config
  lib/                 supabase clients, auth resolver, env, themes, slug, utils
  proxy.ts             session refresh + auth gating + security headers
supabase/
  migrations/          schema + RLS + RPCs + hardening (0001–0014)
  tests/               platform.test.sql (transactional DB assertions)
  seed.sql             deterministic dev/E2E catalogue
public/
  brand/               app icon + wordmark (vector stand-ins)
  sw.js                service worker
e2e/                   Playwright specs (seller + storefront)
```

Further reading: `README.md` (setup), `DEPLOY.md` (hosting), `DESIGN.md` (UI language),
`supabase/README.md` (DB & security spine).
