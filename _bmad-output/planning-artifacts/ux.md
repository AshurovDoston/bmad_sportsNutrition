# UX Retrofit — Sports Nutrition (Demo Cut)

**Author:** Sally (UX Designer)
**Date:** 2026-05-06
**Status:** Tactical retrofit. Two days to manager demo.
**Scope:** Fix what's broken. Do not redesign.

---

## What this document is — and isn't

This is **not** a greenfield UX spec. The PRD has set the strategy, the routes already exist in `frontend/src/app/`, and the demo clock is at T-2 days. What we have is a working skeleton with no skin and no nervous system: pages render, but they don't feel like one product.

This document fixes three specific things:
1. **No global navigation** — every page is an island.
2. **Inconsistent layout** — pages don't share width, padding, or vertical rhythm.
3. **Unstyled feel** — no shared UI primitives, plus a literal font bug overriding Geist with Arial.

Everything else — IA, route structure, brand identity, visual system — stays as-is. We are stitching, not rebuilding.

---

## Reality check — what's already in the codebase

| Slot | Current state |
|---|---|
| `app/layout.tsx` | Renders `<Providers>{children}</Providers>`. No header. No footer. No nav. |
| `components/layout/` | **Empty directory.** |
| `components/ui/` | **Empty directory.** |
| `app/globals.css` | Tailwind v4 wired, but `body { font-family: Arial }` overrides the loaded Geist font. |
| Existing routes | `/`, `/products`, `/products/[slug]`, `/cart`, `/checkout`, `/checkout/confirmation`, `/account/orders`, `/account/profile`, `/login`, `/register`, `/admin/*`, `/confusion-resolver` |
| State + data | Zustand for cart/auth, Tanstack Query for server state. Both already in use. |
| Components | Feature components exist under `components/features/{products,cart,checkout,auth,admin}` and use Tailwind classes individually. |

**The gap is connective:** chrome, primitives, and a baseline visual contract. That's it.

---

## Design intent (the rails, not a rebrand)

We are not picking a new palette. We are not commissioning a logo. We are establishing the smallest possible visual contract that makes the existing pages feel like one product.

- **Palette:** Keep the zinc-based neutrals already used by `goal-selector.tsx`. Add **one brand accent** for primary CTAs and trust markers. Recommendation: **emerald-600** — reads as "verified / trusted / health," fits the "no fakes" promise, and contrasts cleanly against zinc on light and dark.
- **Typography:** Geist Sans is already loaded. Just stop overriding it (see Fix 3).
- **Density:** Mobile-first. The PRD's primary user (Aziz) is on a 4G phone. Optimize for 375–428px viewport, then expand.
- **Reachability rule:** From any page, the user can reach any other primary page in **at most two taps** (header dropdown counts as one tap).
- **Trust signals are visual primitives, not copy:** authenticity badge, "Verified review" badge, "2-hour delivery" badge — these are first-class components, not decorations.

---

## Fix 1 — Global chrome (header + footer)

### `<SiteHeader />` — sticky on every page

| Zone | Element | Behavior |
|---|---|---|
| Left | Wordmark "Sports Nutrition" | `Link` → `/` (goal selector) |
| Center (desktop) / Drawer (mobile) | **Goals** dropdown | Lists the 4 goals from `GOAL_CATEGORIES` → `/products?goal={slug}` |
| Center | **All Products** | → `/products` |
| Center | **Confusion Resolver** | → `/confusion-resolver` |
| Right | **Search icon** | Placeholder for demo (no functionality required) |
| Right | **Cart icon + badge** | Badge shows live cart count from Zustand store. → `/cart` |
| Right | **Account / Login** | If unauthenticated: "Sign in" → `/login`. If authenticated: avatar/initial → dropdown with "Orders", "Profile", "Sign out". Admin role gets an extra "Admin" link. |

**Behavior:**
- Sticky top, white background with bottom border (zinc-200), backdrop-blur on scroll.
- Mobile (<768px): collapse Goals/Products/Resolver into a hamburger drawer. Cart badge stays visible.
- Active route gets `text-emerald-600 font-semibold`.

### `<SiteFooter />` — every page

Two compact columns plus a top promise band.

- **Promise band (full width):** "Verified products · 2-hour Tashkent delivery · Real reviews from real lifters." Single line, emerald-tinted background, becomes part of the trust language.
- **Column A — Shop:** Goals (4 links), All Products, Confusion Resolver.
- **Column B — Account:** Sign in / Register / Orders.
- **Bottom strip:** Copyright + "Tashkent, Uzbekistan." Optional Telegram/Instagram icons (placeholder).

### Files to create

```
src/components/layout/
  site-header.tsx
  site-footer.tsx
  cart-badge.tsx           ← reads count from Zustand cart store
  goals-menu.tsx           ← dropdown content used in header + mobile drawer
  account-menu.tsx         ← auth-aware account dropdown
  mobile-nav.tsx           ← hamburger drawer
```

### Wiring

In `src/app/layout.tsx`, the `<body>` becomes:

```tsx
<body className="min-h-full flex flex-col">
  <Providers>
    <SiteHeader />
    <main className="flex-1">{children}</main>
    <SiteFooter />
  </Providers>
</body>
```

That's the single biggest visible change in the entire retrofit.

---

## Fix 2 — Shared layout primitives

### `<Container>` — width and gutter contract

A single component that owns horizontal width across the app. Without this, every page reinvents `container mx-auto px-4` slightly differently.

```tsx
// src/components/layout/container.tsx
// max-w-7xl, mx-auto, px-4 sm:px-6 lg:px-8
```

Apply it to every page's outer wrapper. Replace the ad-hoc `container mx-auto px-4 py-16` already used in `app/page.tsx`.

### `<PageHeader>` — page-level title pattern

Optional but cheap. Used by Products list, Cart, Checkout, Order detail.

```tsx
// src/components/layout/page-header.tsx
// h1 + optional subtitle + optional right-side action slot
```

### Vertical rhythm rule

Every page's main content area uses `py-8 sm:py-12`. No page invents its own vertical spacing. The home page's current `py-16` is the exception (hero) and stays.

---

## Fix 3 — Visual baseline

### 3a. The Arial bug (one line, biggest impact)

`src/app/globals.css` line 25 reads:

```css
body { font-family: Arial, Helvetica, sans-serif; }
```

This **overrides** the Geist font variable applied in `app/layout.tsx`. Replace with:

```css
body { font-family: var(--font-sans); }
```

The whole site instantly looks like 2026 instead of 1998. This is non-negotiable and takes thirty seconds.

### 3b. Design tokens in CSS

Add to `globals.css` `@theme inline` block:

```css
--color-brand: oklch(0.65 0.15 160);     /* emerald-600 */
--color-brand-fg: white;
--color-success: oklch(0.7 0.17 145);
--color-danger: oklch(0.6 0.22 25);
--color-warning: oklch(0.75 0.15 75);
```

Reference these via Tailwind v4's auto-generated `bg-brand`, `text-brand`, etc.

### 3c. Reusable UI primitives (small set, demo-sized)

Build a **deliberately tiny** kit. Five components. Anything more is over-investing for a 2-day demo.

| Component | Variants | Used by |
|---|---|---|
| `<Button>` | `primary` (brand), `secondary` (zinc outline), `ghost`, `danger`. Sizes: `sm`, `md`, `lg`. | Every CTA across the app |
| `<Card>` | Default + `interactive` (hover lift) | Product cards, order cards, goal selector tiles |
| `<Badge>` | `verified` (emerald), `stock` (zinc), `goal` (zinc tint), `discount` (orange), `out-of-stock` (red) | Product list, product detail, order status |
| `<Input>` + `<Label>` | Text/email/password/number; standard error state | Login, register, profile, checkout |
| `<EmptyState>` | Icon + title + body + optional CTA | Empty cart, no orders, no products match filter |

```
src/components/ui/
  button.tsx
  card.tsx
  badge.tsx
  input.tsx
  label.tsx
  empty-state.tsx
```

**Important:** these are *thin wrappers* over Tailwind classes — not a full design system. The point is consistency, not abstraction. Keep `cn()` helper for class merging if useful.

### 3d. Refactor pass on existing feature components

After primitives exist, do a **one-pass replacement** through `components/features/`:

- Replace inline `<button className="...">` with `<Button>`.
- Replace inline product/order/cart card markup with `<Card>`.
- Replace ad-hoc badge spans with `<Badge>`.
- Replace bare `<input>` with `<Input>` + `<Label>`.

This is mechanical, not creative. Don't redesign these components — just swap the primitives in.

---

## Page-by-page connection map

The cure for "disconnected pages" is making sure every page has obvious links **in** and **out**. This table is the contract.

| Page | Reached from | Primary outbound links | Empty / loading state |
|---|---|---|---|
| `/` (home / goal selector) | Header logo | Each goal tile → `/products?goal=…`; "Browse all products" link → `/products` | n/a |
| `/products` | Header (Goals dropdown, All Products), home tiles | Product card → `/products/[slug]`; filter chips → goal-filtered self; "Add to cart" inline | "No products match" → reset filters CTA |
| `/products/[slug]` | Product list | "Add to cart" → toast + cart badge updates; "View certificate" → modal/PDF; "Back to {goal}" breadcrumb | Loading skeleton |
| `/cart` | Header cart icon | "Checkout" CTA → `/checkout`; "Continue shopping" → `/products`; line item → `/products/[slug]` | `<EmptyState>` "Your cart is empty" → "Browse products" CTA |
| `/checkout` | Cart CTA | "Place order" → `/checkout/confirmation`; "Back to cart" link | n/a |
| `/checkout/confirmation` | Checkout success | "View orders" → `/account/orders`; "Continue shopping" → `/products`; for guests: "Create an account to track this order" → `/register` | n/a |
| `/account/orders` | Header account menu | Order row → `/account/orders/[id]` (if route exists, else expand inline); "Shop again" → `/products` | `<EmptyState>` "No orders yet" → "Browse products" CTA |
| `/account/profile` | Header account menu | Save → toast | n/a |
| `/login` | Header, checkout (if guest opts in) | "Create account" → `/register`; "Forgot password?" (placeholder ok) | n/a |
| `/register` | Login page, post-checkout | Submit → `/` or back to where they came from | n/a |
| `/confusion-resolver` | Header | Each Q&A → recommended product → `/products/[slug]` | n/a |
| `/admin/*` | Header (admin role only) | Admin sub-nav | n/a |

**The breadcrumb principle:** any product detail page shows a "← Back to {Goal}" or "← Back to Products" link, sourced from the referrer query param or default. This single touch is what makes browsing feel continuous instead of teleport-y.

---

## Mobile drawer (the one mobile-only piece)

Below 768px, the header collapses primary links into a hamburger drawer. The drawer is full-height, slides in from the right, and contains:

1. **Goals** (expanded list, not a sub-dropdown — drawer space is cheap)
2. **All Products**
3. **Confusion Resolver**
4. Divider
5. **Sign in** / **Account** / **Orders** / **Sign out** (auth-aware)
6. Divider
7. Footer mini-copy: "Verified products · 2-hour Tashkent delivery"

Cart badge stays in the header bar even when the drawer is closed — never hide the cart.

---

## Priority order — what ships in 2 days

### P0 — must ship for the demo (target: end of day 1)

1. **Fix the Arial font line in `globals.css`** — 30 seconds, huge perceptual win.
2. **Build `<SiteHeader />` and `<SiteFooter />`**, wire into `app/layout.tsx`. Cart badge live from Zustand. Account menu auth-aware.
3. **Build `<Container>`**, apply to all existing pages.
4. **Build `<Button>`, `<Card>`, `<Badge>`** primitives (skip the rest for now).
5. **Replacement pass** through `components/features/products/*` and `components/features/cart/*` to use the new primitives. These are the demo-critical screens.
6. **Mobile drawer** (basic version — `<details>` element is acceptable; framer-motion is overkill).

### P1 — if time on day 2

7. `<Input>` + `<Label>` + replacement pass through auth and checkout forms.
8. `<EmptyState>` component + apply to empty cart and no-orders.
9. Breadcrumb on product detail page.
10. Footer promise band styling polish.
11. Keyboard focus rings audit (Tab through the demo flow once and fix anything invisible).

### P2 — explicitly skip for demo

- Search actually working. Icon is enough; clicking it can show "Coming soon" toast.
- Dark mode toggle. Tailwind has dark variants in classes already, but the toggle UI is not demo-critical.
- Animations beyond hover transitions.
- Theming for admin panel — the existing admin layout is fine for demo.
- Russian / Uzbek language toggle. PRD lists it as post-MVP. Stay disciplined.

---

## What we are explicitly NOT doing

- **Not redesigning the brand.** No new logo, no typography exploration, no color study.
- **Not introducing shadcn/ui or any UI library.** Five hand-rolled primitives is faster for a 2-day demo than installing, configuring, and theming a kit. (If the project lifts off, revisit this in week 2 — shadcn is a strong choice for the long haul, but the install + theming overhead is real.)
- **Not changing routes or IA.** The route tree is already correct per the PRD.
- **Not building a search backend.** Icon only.
- **Not refactoring the data layer.** Zustand and Tanstack Query stay exactly as wired.
- **Not adding tests for UI primitives.** The existing Vitest setup is for feature behavior. Visual primitives get tested by the demo itself.

---

## Acceptance checklist (use this to know you're done)

- [ ] Header is visible on every page (test by visiting all 12 routes).
- [ ] Footer is visible on every page.
- [ ] Cart badge updates when an item is added (no page reload).
- [ ] Logo click from any page returns to `/`.
- [ ] Each of the 4 goals is reachable from the header dropdown.
- [ ] Mobile (375px) shows hamburger; drawer opens and links work.
- [ ] No page uses raw Arial — Geist visible everywhere.
- [ ] Primary CTAs across the app are visually consistent (one Button component, one accent color).
- [ ] Empty cart shows an `<EmptyState>` with a path back to `/products` (P1).
- [ ] Tabbing through the home → product list → product detail → cart → checkout flow shows a visible focus ring at every step (P1).
- [ ] Admin menu item only appears for admin role.
- [ ] Active route is visually distinguished in the header.

---

## Locked decisions (confirmed by Doston, 2026-05-06)

1. **Brand accent:** ✅ **emerald-600** — read as "verified / trusted / health," reinforces the "no fakes" promise.
2. **Primitives approach:** ✅ **Hand-rolled** — five components, no UI library install. Speed over abstraction.
3. **Footer promise band copy:** Keep as drafted: *"Verified products · 2-hour Tashkent delivery · Real reviews from real lifters."*

---

*This document is intentionally short. A 30-page UX bible would not survive a 2-day demo. What's here is the minimum needed to take a working skeleton and make it feel like a product.*
