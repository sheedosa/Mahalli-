# Deploying Mahalli to Vercel

Mahalli is a standard Next.js app — Vercel auto-detects everything. You only
need to set environment variables and point Supabase Auth at your domain.

## 1. Import the project

In the [Vercel dashboard](https://vercel.com/new): **Add New → Project →**
import the GitHub repo (`sheedosa/Mahalli-`) and pick the branch you want to
deploy. Framework preset, build command and output are detected automatically
(no `vercel.json` needed).

## 2. Set environment variables

Add these under **Project → Settings → Environment Variables** (apply to
Production **and** Preview). The first two are client-safe public keys; they
must be present **at build time** because Next inlines `NEXT_PUBLIC_*` values
into the browser bundle.

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wolrnueoxodvezijyrbf.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_xleM4UKcVyZoYOQyI5iZgg_MSF6z9ZJ` |
| `NEXT_PUBLIC_SITE_URL` | your Vercel URL, e.g. `https://mahalli.vercel.app` |

> If you set `NEXT_PUBLIC_SITE_URL` only after the first deploy, **redeploy**
> so auth email links point at the right origin.

Optional / later (Phase 2 — leave unset for now):
`SUPABASE_SERVICE_ROLE_KEY`, `DPAY_*`, `WHATSAPP_CLOUD_TOKEN`. The app builds
and runs without them; they're only needed for payment webhooks / background
jobs.

## 3. Configure Supabase Auth redirect URLs

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL:** your Vercel URL (e.g. `https://mahalli.vercel.app`)
- **Redirect URLs:** add `https://<your-vercel-domain>/auth/callback`
  (and `http://localhost:3000/auth/callback` for local dev)

This lets the email-confirmation / magic links return to your app.

## 4. Deploy

Trigger the deploy. After it's live:

1. Open the site, **sign up**, confirm your email (check spam), then sign in.
2. Create your shop (onboarding) → add products → open your storefront at
   `https://<your-domain>/<your-slug>` → place a test order → see it under
   **Orders** and the customer auto-created under **Customers**.

## Custom domain (optional)

Add your domain in **Vercel → Settings → Domains**, then update
`NEXT_PUBLIC_SITE_URL` and the Supabase redirect URLs to match, and redeploy.

## Notes

- The database schema + RLS are already applied to the live Supabase project;
  no migration step is required to deploy. To reproduce the schema on a fresh
  project, run `supabase/migrations/*.sql` in order (see `supabase/README.md`).
- Email delivery uses Supabase's built-in mailer by default (fine for testing;
  configure a custom SMTP provider in Supabase for production volume).
