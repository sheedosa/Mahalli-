# Mahalli — Design Language (2026)

> **For Claude / agents:** read this before building or changing any UI. It defines the
> look, the tokens, the components to reuse, the storefront **theme** system, and a
> pre-ship checklist. The goal is a UI that feels like a **modern 2026 commerce app** and
> is **beginner-friendly** for Libyan shop owners — while staying mobile-first,
> Arabic-first/RTL, and fast on weak networks.

Companion docs: [`README.md`](README.md) (overview), [`supabase/README.md`](supabase/README.md)
(data/security), [`DEPLOY.md`](DEPLOY.md).

---

## 0. How to use this doc

When you build UI:

1. **Reuse the primitives** in §10 — don't reinvent buttons, inputs, cards.
2. **Obey the tokens** in §6 and the **active theme** in §4 (never hard-code an accent
   colour — use the accent token).
3. **Follow the principles** in §3 and the patterns in §5/§7.
4. **Run the pre-ship checklist** in §11 before you finish.

**Non-negotiables (every screen):** mobile-first (≤448px column), RTL-safe (logical
properties only), all copy externalised to **both** `ar` and `en` dictionaries, tap
targets ≥44px, exactly **one** primary action per screen.

---

## 1. What we're going for

Three reference boards informed this direction (a cream editorial web dashboard "VRAI",
a mono black/white + orange mobile shop, and a soft-lavender "LuxiQue" mobile shop). They
look different on the surface but speak the **same 2026 commerce dialect**. Mahalli adopts
that dialect, expressed through one neutral system + a per-shop accent.

---

## 2. Reference analysis → the 2026 language

The shared motifs across all three references — these are the design "tells" we want:

| # | Motif | How it shows up |
|---|-------|-----------------|
| 1 | **Big radii / pill geometry** | `rounded-2xl/3xl` cards, **pill** (`rounded-full`) buttons & selectors, rounded product imagery |
| 2 | **Soft base + ONE accent + near-black CTA** | cream / white / pastel background, a single brand hue, solid black/navy primary buttons |
| 3 | **Circular icon buttons** | `↗` open, `+ / −` steppers, share, favourite ♥, "🔥 trending" chips |
| 4 | **Bold display headings** | oversized, tight headings for hero & section titles |
| 5 | **Layered cards + soft shadow** | floating panels, depth from `shadow-sm/lg`, not hard borders |
| 6 | **Airy whitespace** | generous padding/gaps; content breathes |
| 7 | **Floating / dark mobile nav** | bottom bar with one emphasised active item |
| 8 | **Rich rounded product photography** | square, `object-cover`, on clean/neutral backdrops |
| 9 | **Commerce micro-details** | sale **strikethrough** price, item-count chips, pagination dots, favourites |
| 10 | **Restrained motion** | subtle colour/opacity transitions, spinners; nothing flashy |

**Per board → which seller it suits:**

- **VRAI — Editorial / cream (web):** discount hero banner, side cart panel, category
  cards, layered `rounded-3xl` panels, dark navy pill CTAs. → **boutiques / fashion**.
- **Board 2 — Mono + orange (mobile):** bold question-style headings, underline tabs,
  pill size/colour selectors, filter sheet, dark floating nav. → **streetwear / clean brands**.
- **LuxiQue — Soft lavender (mobile):** pastel gradient, soft/neumorphic cards, circular
  controls, floating pill nav, 🔥 trending + strikethrough sale. → **trendy / youth**.

These three become the three starter **storefront templates** in §4.

---

## 3. Design principles (north star)

1. **Calm, neutral base.** Zinc/white does the structural work; colour is rare and
   meaningful. The shop's products are the colour.
2. **Accent = meaning + brand.** Each shop has exactly one accent (its theme). Use it for
   the primary action and selected states — never decoratively, never for body text.
3. **Pill geometry.** Prefer rounded-2xl surfaces and pill controls; it reads modern and
   friendly. Sharp corners feel dated here.
4. **Depth from light, not lines.** Soft shadows and subtle layering over heavy borders.
5. **Big, confident type for moments.** Hero/section titles are bold and large; body stays
   quiet and readable.
6. **One primary action per screen.** Everything else is secondary/ghost. Beginners should
   never wonder what to tap next.
7. **Mobile-first, RTL-native, beginner-friendly, weak-network-tolerant.** These constrain
   every choice; see §8 (RTL) and §5 (beginner patterns).

---

## 4. Storefront template system (themes)

**Concept:** a seller picks a **template** for their public storefront (`mahalli.app/<slug>`),
the way Shopify merchants pick a theme. A template is a small set of design tokens layered
over the shared neutral system — it changes *feel*, not structure, so every template stays
accessible, RTL-correct, and fast.

A theme = these tokens:

| Token | Meaning | Example values |
|-------|---------|----------------|
| `--accent` | brand hue (primary CTA, selected states) | `#0f766e`, `#f97316`, `#7c6cf5` |
| `--accent-contrast` | text/icon colour on accent | usually `#ffffff` |
| `--surface` | page background | `#f7f7f8`, `#ffffff`, gradient |
| `--card` | card background | `#ffffff` |
| `--radius` | base radius scale | `xl`, `2xl`, `3xl` |
| `--btn-shape` | CTA shape | `pill` (`rounded-full`) or `rounded` (`rounded-xl`) |
| `--hero` | storefront hero style | `banner` (promo) or `minimal` |
| `--nav` | mobile nav style | `dark-bar` or `floating-pill` |
| `--density` | grid/card density | `comfortable` or `cozy` |

> **Hard rule for any theme:** the `--accent` used on a solid CTA must keep **WCAG AA**
> contrast with `--accent-contrast`. Body text is always the neutral foreground, never the
> accent.

### Starter templates

**A. Editorial Cream** — *boutiques / fashion* (VRAI)
| | |
|---|---|
| accent | teal/sage `#0f766e` |
| surface / card | cream `#f7f7f8` / white |
| radius | `3xl` panels, `2xl` cards |
| button | pill, dark navy `zinc-900` |
| hero | promo **banner** (e.g. "خصم حتى 50٪") with bold display heading |
| nav | dark bar |
| vibe | layered rounded panels, big editorial photography, lots of whitespace |

**B. Mono Minimal** — *streetwear / clean brands* (board 2)
| | |
|---|---|
| accent | orange `#f97316` (on a near-black/white base) |
| surface / card | white / white |
| radius | `2xl` cards, pill selectors |
| button | pill, black |
| hero | **minimal** — bold question heading + search ("شنو تدوّر عليه؟") |
| nav | dark floating bar, underline active tab |
| vibe | high-contrast, confident type, pill size/colour chips |

**C. Soft Pastel** — *trendy / youth* (LuxiQue)
| | |
|---|---|
| accent | lavender `#7c6cf5` (configurable pastel) |
| surface / card | white→pastel **gradient** / white |
| radius | `3xl` soft cards |
| button | pill, black |
| hero | minimal, two soft "Explore / Top selling" cards |
| nav | **floating pill** nav with one expanded item |
| extras | 🔥 trending chips, **strikethrough** sale price, circular `↗`/`+`/`−` controls |
| vibe | soft, friendly, neumorphic-ish, playful |

Default for new shops: **Editorial Cream** (closest to the current build).

> Implementation of the picker/wiring is a **follow-up** — see §12. This doc defines the
> tokens so that work is mechanical.

---

## 5. Mapping to the current build — what's good, what to evolve

Mahalli is already close to the references. **Keep** (don't redo): bottom-tab nav
(`src/components/dashboard/BottomNav.tsx`), glassmorphic sticky `TopBar.tsx`, bottom-sheet
modal (`src/components/storefront/ProductSheet.tsx`), safe-area insets, RTL + Cairo font,
status/stock badges, the primitive set, empty-state pattern.

**Evolve toward the 2026 feel** (deltas, with where they live):

| Delta | Today | Move to | Where |
|-------|-------|---------|-------|
| **CTA shape** | `rounded-xl` | **pill** (`rounded-full`) when theme `--btn-shape: pill` | `src/components/ui/Button.tsx` |
| **Card radius** | `rounded-2xl` | keep `2xl`; hero/feature panels `rounded-3xl` | `src/components/ui/Card.tsx`, storefront |
| **Accent** | hard-coded `zinc-900` everywhere | introduce `--accent` token; primary/selected use it | `src/app/globals.css`, `layout.tsx` |
| **Storefront hero** | plain shop header | optional **promo banner** + bold display heading | `src/components/storefront/StorefrontApp.tsx` |
| **Icon buttons** | square-ish steppers | **circular** `↗`/`+`/`−`/♥ buttons | `ProductSheet.tsx`, `CheckoutView.tsx` |
| **Variant/size chips** | chips | **pill**, filled-on-select | `ProductSheet.tsx`, `VariantsEditor.tsx` |
| **Sale price** | single price | support `compare_at` **strikethrough** | storefront product card (future field) |
| **Display type** | `text-xl` titles | larger hero display (`text-3xl/4xl` bold, tight) | storefront only |

None of these change information architecture — they're polish + a theme layer.

---

## 6. Foundations (tokens) — current, with north-star notes

### Color
- Base vars (`src/app/globals.css`): `--color-background: #f7f7f8`, `--color-foreground: #18181b`.
- **Neutral roles (zinc):** `zinc-900` text & default primary · `zinc-700` labels ·
  `zinc-500` hints/secondary · `zinc-400` placeholder/icons · `zinc-200` borders ·
  `zinc-100`/`zinc-50` surfaces & hovers.
- **Accent (themed):** `--accent` drives primary CTA + selected states. *North star:* the
  current `zinc-900` primary is just the default theme's accent.
- **Semantic:** success `emerald-{50,500,600,700}` · danger `red-{50,200,500,600,700}` ·
  warning `amber-{100,700}`.
- **Order-status badges** (`src/components/orders/status.ts` → `statusBadgeClass`):
  new `bg-blue-100 text-blue-700` · confirmed `bg-indigo-100 text-indigo-700` · ready
  `bg-violet-100 text-violet-700` · out `bg-amber-100 text-amber-700` · delivered
  `bg-emerald-100 text-emerald-700` · cancelled `bg-zinc-100 text-zinc-500`.
- **Stock badges** (`src/components/products/ProductList.tsx`): inactive `zinc-100/500` ·
  out-of-stock `red-100/700` · low `amber-100/700` · in-stock `emerald-100/700`.

### Typography — Cairo (`--font-app`, set in `src/app/layout.tsx`)
| Use | Classes |
|-----|---------|
| Hero display (storefront) | `text-3xl`/`text-4xl` `font-bold` tight leading |
| Page title (h1) | `text-xl font-bold text-zinc-900` |
| Section (h2) | `text-lg font-bold` |
| Subsection | `text-sm font-semibold` |
| Body primary / secondary | `text-base text-zinc-900` / `text-sm text-zinc-500` |
| Label | `text-sm font-medium text-zinc-700` |
| Hint / meta / badge | `text-xs` |

Weights: `font-medium` (500), `font-semibold` (600), `font-bold` (700).

### Spacing & layout
- Container: `mx-auto max-w-md` (448px). Page padding `px-4/5`, vertical rhythm
  `space-y-2 → space-y-6`. Heights from full viewport: `min-h-dvh`.
- Safe areas: `pb-[env(safe-area-inset-bottom)]` (nav), `pb-[calc(1rem+env(safe-area-inset-bottom))]`
  (floating CTA / sheet).

### Radii & shadows
- `rounded-lg` small controls · `rounded-xl` buttons/inputs · `rounded-2xl` cards ·
  `rounded-3xl` sheets & hero panels · `rounded-full` pills/avatars/icon-buttons.
- `shadow-sm` cards · `shadow-lg` floating CTA. Prefer shadow over border for depth.

### Iconography — lucide-react
- Sizes: `size-4` (inline/buttons), `size-5` (nav/list), `size-7/8` (empty states),
  `size-14` (success/large). Color neutral by default; semantic when it means something.
- **Directional icons mirror in RTL** with the `.flip-x` utility (chevrons, arrows, logout).

### Motion
- `transition-colors` on interactive states; `animate-spin` for `Loader2`. Respect
  `prefers-reduced-motion` (already globally handled in `globals.css`).

---

## 7. Components (anatomy · when · reuse path)

All shapes below are theme-aware: primary buttons and selected chips take `--accent` and
the theme's `--btn-shape`.

- **Button** — `src/components/ui/Button.tsx`. Variants `primary` (accent),
  `secondary` (outline), `ghost`, `danger`; sizes `md` (`h-11`) / `lg` (`h-13`);
  full-width; `focus-visible` ring. *Use for every action; one primary per screen.*
- **Input / Field / Textarea** — `src/components/ui/Input.tsx`. `h-11`, `rounded-xl`,
  `focus:ring`. `Field` wraps label + hint + error. *Always label; show inline errors.*
- **Card / StatCard** — `src/components/ui/Card.tsx`. `rounded-2xl border bg-white
  shadow-sm`. *Group related content; stats use StatCard.*
- **SubmitButton** — `src/components/ui/SubmitButton.tsx`. Form-aware pending state +
  `pendingLabel`. *Use in every server-action form.*
- **Badge / Pill** — inline pattern `rounded-full px-2 py-0.5 text-xs font-medium` +
  colour. *Status/stock; filter pills `rounded-full px-3 py-1.5`.*
- **Toggle switch** — pattern in `ProductForm.tsx` (`h-6 w-11 rounded-full`, knob slides
  via logical `start-*`). *Boolean settings.*
- **Quantity stepper** — circular `size-9`/`size-7` `rounded-full border` ± buttons.
  *Cart/quantities; make circular per the 2026 look.*
- **Bottom sheet** — `ProductSheet.tsx` (`rounded-t-3xl`, overlay `bg-black/40`, safe-area).
  *Mobile detail/selection instead of new pages.*
- **Bottom-tab nav** — `BottomNav.tsx` (sticky, glassmorphic, one active item).
- **Sticky top bar** — `TopBar.tsx` (`bg-white/95 backdrop-blur`).
- **Search + filter bar** — icon-in-input (`ps-9`) + scrollable filter pills; debounce
  ~300ms (see `OrdersList.tsx`, `ProductList.tsx`).
- **Radio-card group** — `has-[:checked]:` filled cards (see `ShopForm`/`ProductForm`).
- **Empty state** — `rounded-2xl border-dashed p-8 text-center` + icon + title + one CTA.
- **Floating CTA** — fixed bottom, `rounded-2xl`/pill, `shadow-lg`, safe-area (storefront cart).

---

## 8. RTL & i18n rules

- **Logical properties only:** `ps-/pe-`, `ms-/me-`, `start-/end-`, `inset-x-`. **Never**
  `left/right`/`pl/pr`.
- **Mirror directional icons** with `.flip-x` (`<ChevronLeft className="flip-x" />`).
- **Every string in both dictionaries:** `src/i18n/dictionaries/en.ts` **and** `ar.ts`
  (the `Dictionary` type fails the build if `ar` is missing a key). Arabic is the default;
  copy is warm and Libyan-dialect-friendly.
- Locale/direction come from `src/i18n/config.ts` + `layout.tsx`; read strings via
  `useI18n()` (client) / `getI18n()` (server).

---

## 9. Accessibility baseline

- Tap targets ≥44px (`h-11`+, `size-9` icon buttons).
- Visible focus (`focus-visible:outline`/`ring`) on all interactives.
- Real `<label>`s / `aria-label`; `sr-only` for visually-hidden inputs (e.g. radio cards).
- Contrast: neutral text passes AA; **theme accents must pass AA on CTAs** (§4 rule).
- Honor reduced motion (already global).

---

## 10. Reusable building blocks — index (reuse, don't reinvent)

| Need | Use |
|------|-----|
| Button / CTA | `src/components/ui/Button.tsx`, `SubmitButton.tsx` |
| Text input / textarea / labelled field | `src/components/ui/Input.tsx` (`Input`, `Textarea`, `Field`) |
| Card / stat tile | `src/components/ui/Card.tsx` (`Card`, `StatCard`) |
| Class merge / price format | `cn`, `formatPrice` in `src/lib/utils.ts` |
| Order status flow + badge colours | `src/components/orders/status.ts` |
| Translations / locale / dir | `src/i18n/*` (`useI18n`, `getI18n`, dictionaries, `config`) |
| Language toggle | `src/components/LocaleSwitcher.tsx` |
| Bottom nav / top bar | `src/components/dashboard/{BottomNav,TopBar}.tsx` |
| Storefront catalog / sheet / checkout | `src/components/storefront/*` |

---

## 11. Pre-ship checklist (run before finishing any UI)

- [ ] Fits a `max-w-md` mobile column; usable one-handed; ≥44px targets.
- [ ] RTL correct: only logical properties; directional icons use `.flip-x`.
- [ ] All new copy added to **both** `en.ts` and `ar.ts`; no hard-coded strings.
- [ ] Exactly one primary action; secondary actions are `secondary`/`ghost`.
- [ ] Reused the primitives in §10 (no bespoke button/input/card).
- [ ] Tokens/theme respected: accent via token, radii/spacing per §6, no stray hex.
- [ ] Empty, loading, and error states all handled (with friendly microcopy).
- [ ] Focus states present; images `object-cover` with `alt`; `min-w-0`+`truncate` where needed.
- [ ] `npm run typecheck && npm run lint && npm run build` all green.

---

## 12. Future implementation note (out of scope for this doc)

To ship the template system later (mechanical, given §4):

1. Add a `theme` value to `sellers` (enum or jsonb of the §4 tokens).
2. On the storefront root, emit the theme as CSS variables (`--accent`, `--surface`,
   `--radius`, …) and have components read them (e.g. primary button bg = `var(--accent)`).
3. Add a **theme picker** in Settings (the radio-card pattern already exists) with live
   preview; default new shops to **Editorial Cream**.
4. Optionally add product fields for the commerce micro-details (`compare_at_price` for
   strikethrough, a `featured`/trending flag).

Until then, the app runs on the **default theme** (neutral zinc + `zinc-900` primary),
which is "Editorial Cream" without the cream accent — already consistent with this doc.
