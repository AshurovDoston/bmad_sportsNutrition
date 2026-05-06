---
title: 'UI/UX Retrofit P0 — Global Chrome, Primitives, and Visual Baseline'
type: 'feature'
created: '2026-05-06'
status: 'done'
baseline_commit: '451b3856833c0bb6e22331b768b185c0e8f036f4'
context:
  - '_bmad-output/planning-artifacts/ux.md'
  - 'frontend/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Next.js frontend has no global navigation header or footer (every page is an island in `app/layout.tsx`), no shared UI primitives (`components/ui/` and `components/layout/` are empty directories), and a CSS bug where `body { font-family: Arial }` overrides the loaded Geist font. The app is two days from a manager demo and feels disconnected and unstyled even though the route tree and feature components already exist.

**Approach:** Execute the **P0 list** from `_bmad-output/planning-artifacts/ux.md`. Add a sticky `SiteHeader` and `SiteFooter` to the root layout. Create five hand-rolled primitives (Container, Button, Card, Badge, plus a `cn()` helper). Fix the Arial override and add emerald-600 brand tokens. Substitute primitives into `features/products/*` and `features/cart/*` without redesigning them. Skip P1/P2 entirely.

## Boundaries & Constraints

**Always:**
- Brand accent is **emerald-600**. Used for primary CTAs, active-route nav state, the footer promise band, the cart badge dot, and "Verified" badges.
- Header is sticky (`top-0 z-40`), white background with bottom border, blurred on scroll. Visible on **every** route including `/admin/*`.
- Cart icon shows a live badge using `useCartStore.getState().itemCount()`; updates without page reload.
- Account menu is auth-aware. Unauthenticated → "Sign in" link to `/login`. Authenticated → dropdown with Orders / Profile / Sign out. **Admin link only when `user.is_staff === true`.**
- Mobile drawer (<768px) replaces the desktop center nav. Cart badge stays visible in the bar even when the drawer is closed.
- Active route in header gets `text-emerald-600 font-semibold`. Compute from `usePathname()`.
- Geist Sans must render everywhere — i.e. `body` font-family resolves to `var(--font-sans)`.
- Primitives are **thin Tailwind wrappers**. No abstraction beyond variant + size props. Use a `cn()` helper from `lib/utils.ts`.
- The refactor pass swaps inline `<button>`/card markup for primitives **without** changing visual layout, copy, behavior, or props of the consuming components.

**Ask First:**
- Adding any new dependency (none should be needed).
- Touching files outside the listed Code Map.
- Any change to Zustand stores, Tanstack Query setup, route structure, or backend code.

**Never:**
- Install shadcn/ui or any UI library.
- Add framer-motion or animation libraries (use CSS transitions only).
- Implement search functionality, dark-mode toggle, breadcrumbs, EmptyState component, Input/Label primitives, or i18n toggle — all explicitly P1/P2 in `ux.md`.
- Redesign existing feature components — only swap markup for primitives.
- Modify `app/admin/layout.tsx` beyond ensuring the global header/footer wrap it correctly.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Cart badge — empty | `itemCount() === 0` | Cart icon renders; **no** numeric badge | N/A |
| Cart badge — non-zero | `itemCount() === 3` | Cart icon with emerald `3` badge | N/A |
| Cart badge — 99+ | `itemCount() === 150` | Display `99+` | N/A |
| Account menu — guest | `accessToken === null` | Show "Sign in" link → `/login` | N/A |
| Account menu — user | authed, `is_staff === false` | Dropdown: Orders / Profile / Sign out. **No Admin link.** | N/A |
| Account menu — admin | authed, `is_staff === true` | Dropdown: Admin / Orders / Profile / Sign out | N/A |
| Active route | `usePathname() === '/products'` | "All Products" link in header gets emerald + bold | N/A |
| Mobile drawer | viewport <768px, hamburger tapped | Drawer opens; tapping a link closes drawer + navigates | N/A |
| SSR safety | first render before hydration | Cart badge renders without count or hidden until mount; no hydration mismatch | Use mount guard |

</frozen-after-approval>

## Code Map

- `frontend/src/app/layout.tsx` -- wire `<SiteHeader />` above `<main className="flex-1">{children}</main>` and `<SiteFooter />` after main
- `frontend/src/app/globals.css` -- replace `font-family: Arial...` with `var(--font-sans)`; add brand tokens (`--color-brand`, `--color-brand-fg`, `--color-success`, `--color-danger`, `--color-warning`) inside `@theme inline`
- `frontend/src/lib/utils.ts` -- export `cn(...classes)` helper (string-join + falsy-filter; no `clsx`/`tailwind-merge` deps)
- `frontend/src/components/layout/site-header.tsx` -- sticky header, desktop center nav, mobile hamburger trigger, cart badge, account menu (NEW)
- `frontend/src/components/layout/site-footer.tsx` -- emerald promise band + two columns + bottom strip (NEW)
- `frontend/src/components/layout/cart-badge.tsx` -- client component that subscribes to `useCartStore.itemCount()` with mount guard for SSR (NEW)
- `frontend/src/components/layout/goals-menu.tsx` -- shared dropdown content rendered in header desktop nav and mobile drawer (NEW)
- `frontend/src/components/layout/account-menu.tsx` -- auth-aware dropdown reading `useAuthStore` (NEW)
- `frontend/src/components/layout/mobile-nav.tsx` -- `<details>`-based drawer (no animation lib) (NEW)
- `frontend/src/components/layout/container.tsx` -- `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (NEW)
- `frontend/src/components/ui/button.tsx` -- variants: `primary | secondary | ghost | danger`; sizes: `sm | md | lg`; supports `asChild`-free Link composition via `<Link>` consumer (NEW)
- `frontend/src/components/ui/card.tsx` -- `default` + `interactive` variants (NEW)
- `frontend/src/components/ui/badge.tsx` -- variants: `verified | stock | goal | discount | out-of-stock | neutral` (NEW)
- `frontend/src/components/features/products/product-card.tsx` -- swap inline button + stock/goal spans for `<Button>`/`<Badge>`/`<Card variant="interactive">`
- `frontend/src/components/features/products/product-list.tsx` -- swap any inline buttons for `<Button>`
- `frontend/src/components/features/products/product-detail.tsx` -- swap inline button + badges for primitives
- `frontend/src/components/features/products/goal-selector.tsx` -- wrap each tile in `<Card variant="interactive">`
- `frontend/src/components/features/products/filter-panel.tsx` -- swap apply/clear buttons for `<Button>`
- `frontend/src/components/features/products/search-bar.tsx` -- swap submit button for `<Button>` (no functionality change)
- `frontend/src/components/features/cart/cart-item-row.tsx` -- swap remove/quantity buttons for `<Button>` variants
- `frontend/src/components/features/cart/cart-summary.tsx` -- swap checkout button for `<Button variant="primary" size="lg">`
- `frontend/src/app/page.tsx` -- wrap in `<Container>`
- `frontend/src/app/(shop)/products/page.tsx`, `[slug]/page.tsx`, `cart/page.tsx`, `checkout/page.tsx`, `checkout/confirmation/page.tsx` -- wrap in `<Container>`
- `frontend/src/app/account/orders/page.tsx`, `account/profile/page.tsx`, `login/page.tsx`, `register/page.tsx`, `confusion-resolver/page.tsx` (and any sub-routes) -- wrap in `<Container>`

## Tasks & Acceptance

**Execution (ordered by dependency):**

- [x] `frontend/src/app/globals.css` -- replace Arial body font with `var(--font-sans)`; add brand/success/danger/warning tokens inside `@theme inline` -- baseline visual fix
- [x] `frontend/src/lib/utils.ts` -- add `cn(...classes: Array<string | false | null | undefined>): string` helper -- needed by all primitives
- [x] `frontend/src/components/layout/container.tsx` -- create Container wrapper -- consumed by all pages
- [x] `frontend/src/components/ui/button.tsx` -- variant/size primitive using `cn()` and emerald-600 token for `primary` -- consumed by header, footer, refactor pass
- [x] `frontend/src/components/ui/card.tsx` -- default + interactive variants -- consumed by goal-selector, product-card
- [x] `frontend/src/components/ui/badge.tsx` -- six variants incl. `verified` (emerald) and `out-of-stock` (red) -- consumed by product-card and product-detail
- [x] `frontend/src/components/layout/cart-badge.tsx` -- subscribes to `useCartStore.itemCount()`; emerald dot; renders `99+` when ≥100; mount-guard avoids SSR hydration mismatch -- consumed by header
- [x] `frontend/src/components/layout/goals-menu.tsx` -- renders 4 links from `GOAL_CATEGORIES` -- consumed by header desktop + mobile drawer
- [x] `frontend/src/components/layout/account-menu.tsx` -- auth-aware dropdown; admin link gated on `user.is_staff` -- consumed by header
- [x] `frontend/src/components/layout/mobile-nav.tsx` -- `<details>`-driven drawer; closes on navigation -- consumed by header
- [x] `frontend/src/components/layout/site-header.tsx` -- composes wordmark, GoalsMenu, All Products, Confusion Resolver, search-icon placeholder, CartBadge, AccountMenu, MobileNav; sticky with bottom border; active route uses `usePathname()` for emerald state -- core deliverable
- [x] `frontend/src/components/layout/site-footer.tsx` -- emerald promise band + Shop/Account columns + copyright strip -- core deliverable
- [x] `frontend/src/app/layout.tsx` -- mount header/main/footer structure; main has `flex-1` so footer sits at viewport bottom on short pages -- wires the chrome
- [x] `frontend/src/components/features/products/*.tsx` (6 files) -- swap inline buttons/cards/badges for primitives -- consistency pass
- [x] `frontend/src/components/features/cart/*.tsx` (2 files) -- swap inline buttons for primitives -- consistency pass
- [x] All page-level files under `frontend/src/app/` -- replace ad-hoc `container mx-auto px-4` with `<Container>` wrapper -- layout consistency

**Acceptance Criteria:**

- Given the user navigates to any of `/`, `/products`, `/products/[slug]`, `/cart`, `/checkout`, `/checkout/confirmation`, `/account/orders`, `/account/profile`, `/login`, `/register`, `/admin`, `/confusion-resolver`, when the page loads, then the SiteHeader appears at the top and SiteFooter at the bottom.
- Given a guest adds a product to cart, when the request resolves, then the header cart badge increments live without page reload.
- Given the viewport is 375px, when the user taps the hamburger, then the mobile drawer opens and tapping any nav link closes it and navigates.
- Given the current URL is `/products`, when the header renders, then "All Products" appears with `text-emerald-600 font-semibold`.
- Given an authenticated non-admin user, when the account menu opens, then no "Admin" link is visible. Given `is_staff === true`, then "Admin" link is visible and routes to `/admin`.
- Given any rendered page, when DevTools inspects the body, then `font-family` resolves to a Geist variant — never Arial.
- Given the implementation is done, when grepping `frontend/src/components/features/{products,cart}` for `<button` (lowercase), then zero matches remain (excluding props that pass to native elements via primitives).

## Design Notes

**`cn()` helper (golden form, keep tiny):**

```ts
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
```

**Button primitive shape (illustrative — use as template, do not over-engineer):**

```tsx
const variants = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50',
  secondary: 'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50',
  ghost: 'text-zinc-700 hover:bg-zinc-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}
const sizes = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4', lg: 'h-12 px-6 text-base' }
```

**Cart badge SSR guard pattern:** read count inside a `useEffect`-set state — initial render returns the icon with no badge, hydration adds the badge. Prevents Next.js hydration mismatch since Zustand-persisted state isn't available server-side.

**Mobile drawer using `<details>`:** zero JS, accessible by default. The `<summary>` is the hamburger button; the open panel contains nav links. Add `[&[open]>summary>svg]:rotate-90` if a chevron is desired. Close-on-navigate by toggling `open` attribute via `onClick` on links (or accepting that users tap-twice — acceptable for demo).

**Refactor pass discipline:** the goal is *substitution*, not improvement. If a `<button>` used `rounded-lg bg-zinc-900 px-3 py-1.5`, it becomes `<Button variant="primary" size="sm">`. Do not retune spacing, copy, or layout.

## Verification

**Commands:**
- `cd frontend && npm run lint` -- expected: zero errors (warnings acceptable for demo)
- `cd frontend && npx tsc --noEmit` -- expected: zero TypeScript errors
- `cd frontend && npm run build` -- expected: clean Next.js build, no hydration warnings, all 12 routes compile
- `cd frontend && npm run dev` -- start dev server for manual checks below

**Manual checks (must pass before marking done):**
- Visit each of the 12 routes; header + footer visible on all (admin route included).
- 375px viewport: hamburger opens drawer; nav links work; cart badge visible in bar throughout.
- Add an item to cart from `/products`; cart badge increments without reload; badge shows emerald with white digits.
- Log in as non-admin; account menu shows no Admin link. Promote user (or use seeded admin) and confirm Admin link appears.
- Inspect `<body>` in DevTools: `font-family` does not contain "Arial".
- Tab through home → product list → product detail → cart; visible focus state on header links and primary buttons (basic ring is enough).
- Active route in header is bold + emerald on each of `/`, `/products`, `/confusion-resolver`.
- `grep -rn '<button' frontend/src/components/features/{products,cart}/` returns nothing.

## Suggested Review Order

**Global chrome wiring (start here)**

- Entry point: header/main/footer mounted around all routes — read this first to grasp the new layout shape.
  [`layout.tsx:35`](../../frontend/src/app/layout.tsx#L35)

- Sticky chrome with auth-aware nav, click-toggle Goals dropdown (a11y patch), `pathname` null guard.
  [`site-header.tsx:38`](../../frontend/src/components/layout/site-header.tsx#L38)

- Mobile drawer rebuilt as controlled state — backdrop close, `aria-expanded`, label flip.
  [`mobile-nav.tsx:9`](../../frontend/src/components/layout/mobile-nav.tsx#L9)

- Footer: emerald promise band + Shop/Account columns + bottom strip.
  [`site-footer.tsx:1`](../../frontend/src/components/layout/site-footer.tsx#L1)

**Cart-badge live-update path**

- `useSyncExternalStore` over `useCartStore` with a real subscribe; `getServerSnapshot=0` for SSR safety.
  [`cart-badge.tsx:22`](../../frontend/src/components/layout/cart-badge.tsx#L22)

**Auth-aware account menu**

- Renders directly off `accessToken` (auth state isn't persisted, so SSR/first-render match — no mount guard needed).
  [`account-menu.tsx:34`](../../frontend/src/components/layout/account-menu.tsx#L34)

- Admin link gated on `user.is_staff`.
  [`account-menu.tsx:69`](../../frontend/src/components/layout/account-menu.tsx#L69)

**Visual baseline**

- Arial override removed; Geist now resolves through `var(--font-sans)`.
  [`globals.css:30`](../../frontend/src/app/globals.css#L30)

- Brand/success/danger/warning tokens added to the `@theme inline` block.
  [`globals.css:13`](../../frontend/src/app/globals.css#L13)

**Hand-rolled primitives**

- Button: 4 variants × 3 sizes, plus `buttonClasses()` helper for styled `<Link>` use.
  [`button.tsx:7`](../../frontend/src/components/ui/button.tsx#L7)

- Card and Badge follow the same thin-wrapper pattern.
  [`card.tsx:1`](../../frontend/src/components/ui/card.tsx#L1)

- `cn()` helper.
  [`utils.ts:1`](../../frontend/src/lib/utils.ts#L1)

**Confirmation-page hydration fix**

- `sessionStorage` read moved out of the `useState` lazy initializer into a mount effect; placeholder rendered until hydrated.
  [`confirmation/page.tsx:44`](../../frontend/src/app/(shop)/checkout/confirmation/page.tsx#L44)

**Refactor pass (substitution-only — skim, don't audit deeply)**

- Product card now uses `<Card>` + `<Badge>` + `<Button>`; layout/copy unchanged.
  [`product-card.tsx:1`](../../frontend/src/components/features/products/product-card.tsx#L1)

- Cart row + summary use Button variants.
  [`cart-item-row.tsx:1`](../../frontend/src/components/features/cart/cart-item-row.tsx#L1)

**Page wrappers**

- All 12 page-level wrappers replaced ad-hoc `container mx-auto px-4` with `<Container>`.
  [`page.tsx:1`](../../frontend/src/app/page.tsx#L1)

