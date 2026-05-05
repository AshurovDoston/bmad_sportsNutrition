# Story 2.4: Product Detail Page (SSR)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to view a full product detail page with description, nutrition facts, authenticity certificate, and verified reviews,
so that I can make a confident, informed purchase decision.

## Acceptance Criteria

1. **Given** a product slug, **When** `/products/{slug}` is loaded, **Then** the page renders server-side (SSR) with full product data: name, images, price, stock status, description, nutrition facts, goal tags, and `why_this_works` copy
2. **Given** the product detail page, **When** it renders, **Then** the authenticity certificate is displayed as a viewable/downloadable link (PDF or image) with a clear "Verified Certificate" label
3. **Given** the product detail page, **When** it renders, **Then** a delivery timer shows "Delivers in 2 hours" using the `DELIVERY_TIME_HOURS` constant from `lib/constants.ts`
4. **Given** the product detail page, **When** it renders, **Then** verified purchase reviews are listed showing reviewer name, star rating (1–5), and review text
5. **Given** a product slug that does not exist, **When** the page is requested, **Then** a 404 page is returned (Next.js `notFound()`)
6. **Given** the product detail page, **When** viewed on mobile (375px), **Then** the certificate link, nutrition facts, reviews, and all CTAs are fully accessible and readable

## Tasks / Subtasks

- [x] Task 1: Add `getProductDetail` server-safe fetch function to `lib/api.ts` (AC: 1, 5)
  - [x] Import `ProductDetailItem` from `@/types/product` (already exported — do NOT redefine)
  - [x] Add `getProductDetail(slug: string)` that uses raw `fetch` (NOT `apiFetch`) with `{ cache: 'no-store' }`
  - [x] Throw `new Error('NOT_FOUND')` on HTTP 404; throw `new Error('Failed to fetch product detail')` on other non-ok status
  - [x] `PRODUCT_ENDPOINTS.PRODUCT_DETAIL(slug)` is already defined in `api.ts` — reuse it
  - [x] Function signature: `export async function getProductDetail(slug: string): Promise<ProductDetailItem>`

- [x] Task 2: Create `ProductDetailView` client component (AC: 1, 2, 3, 4, 6)
  - [x] Create `frontend/src/components/features/products/product-detail.tsx`
  - [x] Mark as `'use client'` — it needs `useCartStore` for the add-to-cart button
  - [x] Accept prop `product: ProductDetailItem` — import type from `@/types/product`
  - [x] Render primary image using `<Image>` from `next/image` with fallback div (follow `product-card.tsx` pattern exactly)
  - [x] Render all images in `product.images` array as a gallery (use `image_url` field)
  - [x] Render: name, price (`$${product.price}`), stock badge, goal tags (map `product.goal_categories` — replace `_` with space), `why_this_works` copy
  - [x] Render description in a `<p>` or `<div>` with `whitespace-pre-line` class
  - [x] Render delivery timer: `Delivers in {DELIVERY_TIME_HOURS} hours` — import from `@/lib/constants`
  - [x] Render certificate: if `product.certificate_url` is non-null, render `<a href={product.certificate_url} target="_blank" rel="noopener noreferrer">View Verified Certificate</a>` with a clear label; if null, show nothing (don't show a broken link)
  - [x] Render nutrition facts: `Object.entries(product.nutrition_facts)` as a two-column key/value list; cast each value with `String(val)`; handle empty object gracefully
  - [x] Render reviews: map `product.reviews`; each review shows `reviewer_name`, star rating (`★` × rating + `☆` × (5 − rating)), `review_text`, and `is_verified` badge ("Verified Purchase") when true
  - [x] Add-to-cart button: `useCartStore().addItem(product.id)` — disabled and `opacity-50 cursor-not-allowed` when `!product.is_in_stock`
  - [x] Mobile-first layout: single column on mobile, two columns on `md:` (image left, details right)
  - [x] Do NOT use raw `fetch` in this component — it is a client component

- [x] Task 3: Create the SSR product detail page (AC: 1, 5)
  - [x] Create directory `frontend/src/app/(shop)/products/[slug]/`
  - [x] Create `frontend/src/app/(shop)/products/[slug]/page.tsx` — **Server Component** (no `'use client'`)
  - [x] `params` is a Promise in Next.js 16: `params: Promise<{ slug: string }>` — MUST `await params`
  - [x] Call `getProductDetail(slug)` — wrap in try/catch; on `'NOT_FOUND'` error call `notFound()` from `next/navigation`
  - [x] On other errors throw so Next.js renders the default error boundary
  - [x] No `export const revalidate` needed — using `{ cache: 'no-store' }` in the fetch makes the page SSR automatically
  - [x] Render `<ProductDetailView product={product} />` — pass the fetched `ProductDetailItem`
  - [x] Add a `<Link href="/products">← Back to Products</Link>` at the top for navigation

- [x] Task 4: Write tests for `ProductDetailView` (AC: 1, 2, 3, 4, 6)
  - [x] Create `frontend/src/test/product-detail.test.tsx`
  - [x] Mock `next/navigation`: `vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))`
  - [x] Mock `next/image`: `vi.mock('next/image', () => ({ default: (props: Record<string, unknown>) => <img {...props} alt={String(props.alt ?? '')} /> }))`
  - [x] No MSW needed — pass mock `ProductDetailItem` as prop directly to `<ProductDetailView>`
  - [x] No `QueryClientProvider` wrapper needed — component doesn't use TanStack Query
  - [x] Test: `renders product name, price, and description`
  - [x] Test: `renders "View Verified Certificate" link when certificate_url is present`
  - [x] Test: `renders nothing for certificate when certificate_url is null`
  - [x] Test: `renders delivery timer using DELIVERY_TIME_HOURS constant`
  - [x] Test: `renders reviews with reviewer name and stars`
  - [x] Test: `disables add-to-cart button and shows out-of-stock styling when is_in_stock is false`
  - [x] Test: `renders nutrition facts key-value pairs`

## Dev Notes

### 🚨 SSR in Next.js 16 App Router (Old Model — No `cacheComponents` flag)

This project does NOT use `cacheComponents: true` in `next.config.ts`. SSR is achieved by using `fetch` with `{ cache: 'no-store' }` inside a Server Component:

```typescript
// fetch with cache: 'no-store' makes the page dynamic (SSR) automatically
const res = await fetch(url, { cache: 'no-store' })
```

- **Do NOT** export `revalidate = 60` on this page (that's ISR — product listing only)
- **Do NOT** export `dynamic = 'force-dynamic'` explicitly — the `cache: 'no-store'` fetch achieves SSR
- The page WILL re-fetch product data on every request, giving fresh stock/price data

### 🚨 params IS A PROMISE — Must Await

In Next.js 16 App Router, `params` is a Promise, not a plain object:

```typescript
// CORRECT
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // ...
}
```

**WRONG (old Next.js 14 pattern — will break in this version):**
```typescript
// WRONG — params is not synchronous in Next.js 16
export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const slug = params.slug // This will not work correctly
}
```

### 🚨 Server vs Client Component Split

The page **must** be split into two components:

1. **`page.tsx` (Server Component)** — fetches data server-side, handles 404, passes data down
2. **`product-detail.tsx` (Client Component)** — handles all interactivity (add-to-cart via Zustand)

Why the split: `useCartStore` from Zustand is a React hook — hooks cannot be used in Server Components. The fetch must be server-side for SSR. The add-to-cart button must be client-side.

### 🚨 Use Raw `fetch` in `getProductDetail` — NOT `apiFetch`

`apiFetch` (from `lib/api.ts`) contains client-only code:
- `window.location.href = '/login'` — throws on the server
- `useAuthStore.getState()` — works on server but not intended for server use

Product detail API is **public** (no auth required — see Story 2.1 AC). Use raw `fetch`:

```typescript
export async function getProductDetail(slug: string): Promise<ProductDetailItem> {
  const res = await fetch(apiUrl(PRODUCT_ENDPOINTS.PRODUCT_DETAIL(slug)), {
    cache: 'no-store',
  })
  if (res.status === 404) throw new Error('NOT_FOUND')
  if (!res.ok) throw new Error('Failed to fetch product detail')
  return res.json() as Promise<ProductDetailItem>
}
```

Add this to `lib/api.ts` after the existing `getProducts` function. Import `ProductDetailItem` from `@/types/product` (already used in this file).

### 🚨 notFound() Pattern for 404

```typescript
import { notFound } from 'next/navigation'

// In page.tsx:
try {
  product = await getProductDetail(slug)
} catch (err) {
  if (err instanceof Error && err.message === 'NOT_FOUND') {
    notFound()
  }
  throw err // let Next.js error boundary handle other errors
}
```

`notFound()` throws a Next.js internal error that renders the closest `not-found.tsx` or the default 404 page. It **must** be called before any JSX is returned.

### 🚨 Image Handling — `next.config.ts` Has `unoptimized: true`

The current `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
}
```

**`unoptimized: true` means `<Image>` from `next/image` works with ANY URL without configuring `remotePatterns`.** Use `<Image>` exactly as in `product-card.tsx`:

```tsx
import Image from 'next/image'

{product.primary_image_url ? (
  <Image
    src={product.primary_image_url}
    alt={product.name}
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, 50vw"
  />
) : (
  <div className="flex h-full w-full items-center justify-center text-zinc-400 text-sm">
    No image
  </div>
)}
```

For the images gallery (from `product.images`), use the `image_url` field (not `primary_image_url`).

### Architecture-Mandated Patterns

1. **Route path**: Architecture specifies `app/(shop)/products/[slug]/page.tsx` — the URL will be `/products/{slug}` (route group doesn't appear in URL)

2. **`useCartStore().addItem(product.id)`** — this is the correct pattern, same as `product-card.tsx`. Story 3 wires up full backend cart sync.

3. **No hardcoded URLs** — use `PRODUCT_ENDPOINTS.PRODUCT_DETAIL(slug)` and `apiUrl()` from `lib/api.ts`

4. **snake_case throughout** — TypeScript interfaces already use snake_case matching the API (`is_in_stock`, `goal_categories`, etc.)

5. **"Verified Purchase" badge**: Only show when `review.is_verified === true`

### API Response Shape — ProductDetailItem (verified from backend)

`GET /api/v1/products/{slug}/` returns `ProductDetailSerializer` which extends `ProductListSerializer`:

```typescript
// Already in frontend/src/types/product.ts — do NOT redefine
export interface ProductDetailItem extends ProductListItem {
  description: string
  nutrition_facts: Record<string, unknown>  // JSON field from Django model
  images: { id: number; image_url: string | null; is_primary: boolean }[]
  reviews: {
    id: number
    reviewer_name: string
    rating: number         // 1–5 integer
    review_text: string
    is_verified: boolean
    photo_url: string | null
  }[]
}
```

`nutrition_facts` is stored as JSON in PostgreSQL. From `seed_data.py`, it contains nutrition facts like:
```json
{ "Protein": "25g per serving", "Calories": "130 kcal", "Carbohydrates": "3g", "Fat": "2.5g" }
```
Render with `Object.entries()` — handle the case where `nutrition_facts` is `{}` (empty object).

### Nutrition Facts Rendering

```tsx
{Object.keys(product.nutrition_facts).length > 0 && (
  <section>
    <h3>Nutrition Facts</h3>
    <dl>
      {Object.entries(product.nutrition_facts).map(([key, val]) => (
        <div key={key} className="flex justify-between border-b py-1">
          <dt className="font-medium">{key}</dt>
          <dd className="text-right">{String(val)}</dd>
        </div>
      ))}
    </dl>
  </section>
)}
```

### Star Rating Rendering

```tsx
// Unicode stars — accessible, no extra dependencies
function StarRating({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="text-amber-400">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}
```

### Goal Tag Display

`product.goal_categories` is an array of slug strings (e.g., `['muscle_gain', 'fat_loss']`). Display as badges:
```tsx
{product.goal_categories.map((slug) => (
  <span key={slug} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
    {slug.replace(/_/g, ' ')}
  </span>
))}
```
Same formatting as `product-card.tsx` — `.replace(/_/g, ' ')` converts `muscle_gain` → `muscle gain`.

### Mobile Layout (375px) — Required

Use Tailwind responsive grid for the detail layout:
```tsx
// Single column mobile, two-column md+
<div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-1 gap-8 md:grid-cols-2">
  {/* Left: images */}
  <div>...</div>
  {/* Right: details + add-to-cart */}
  <div>...</div>
</div>
```

All sections (certificate, nutrition facts, reviews) must stack vertically on mobile with `w-full`. No fixed widths that cause horizontal overflow.

### What Already Exists — Do NOT Recreate

- `frontend/src/types/product.ts` — `ProductDetailItem` already correctly defined (includes `description`, `nutrition_facts`, `images`, `reviews`)
- `frontend/src/lib/api.ts` — `PRODUCT_ENDPOINTS.PRODUCT_DETAIL(slug)` and `apiUrl()` already there; ADD `getProductDetail` without removing anything
- `frontend/src/lib/constants.ts` — `DELIVERY_TIME_HOURS = 2` — import, don't hardcode
- `frontend/src/store/cart.ts` — `useCartStore` with `addItem(productId, quantity?)` — same as in `product-card.tsx`
- `frontend/src/components/features/products/product-card.tsx` — reference for `<Image>` pattern, stock badge, add-to-cart button, goal badge, `DELIVERY_TIME_HOURS` usage
- `frontend/src/app/(shop)/products/page.tsx` — reference for route group usage in `(shop)`
- `frontend/src/app/(shop)/` directory — already exists, just create `products/[slug]/` inside it

Backend API endpoints are complete:
- `GET /api/v1/products/{slug}/` — returns `ProductDetailSerializer` (all fields including `description`, `nutrition_facts`, `images`, `reviews`)
- Public — no auth required
- Returns HTTP 404 for unknown slugs

### Testing Notes

**`ProductDetailView` is a client component — test it, not the server page.**

The server `page.tsx` calls `getProductDetail` and calls `notFound()` — these are hard to unit test in Vitest. Focus tests on `ProductDetailView`:

```typescript
// frontend/src/test/product-detail.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductDetailView } from '@/components/features/products/product-detail'
import type { ProductDetailItem } from '@/types/product'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={String(props.alt ?? '')} src={String(props.src ?? '')} />
  ),
}))

const mockProduct: ProductDetailItem = {
  id: 1,
  name: 'Gold Standard Whey',
  slug: 'gold-standard-whey',
  price: '29.99',
  is_in_stock: true,
  goal_categories: ['muscle_gain'],
  primary_image_url: null,
  certificate_url: 'http://localhost:8000/media/cert.pdf',
  delivery_hours: 2,
  why_this_works: 'Whey protein rapidly delivers amino acids.',
  description: 'A premium whey protein supplement.',
  nutrition_facts: { Protein: '25g', Calories: '130 kcal' },
  images: [],
  reviews: [
    { id: 1, reviewer_name: 'Aziz K.', rating: 5, review_text: 'Great product!', is_verified: true, photo_url: null },
  ],
}
```

**No `QueryClientProvider` needed** — `ProductDetailView` does not use TanStack Query (data comes as a prop from the server page).

**Zustand stores work in Vitest** — `useCartStore` will work without mocking; just import and use.

### What This Story Does NOT Implement

- Product search / filtering (Story 2.5)
- Confusion Resolver (Story 2.6)
- Cart backend sync on add-to-cart (Story 3.1 — Zustand guest cart only for now)
- Admin product edit (Story 4.1/4.2)
- Any backend changes — backend is already complete (Story 2.1)

### File List Summary

**Files to CREATE:**
- `frontend/src/app/(shop)/products/[slug]/page.tsx`
- `frontend/src/components/features/products/product-detail.tsx`
- `frontend/src/test/product-detail.test.tsx`

**Files to UPDATE (READ BEFORE MODIFYING):**
- `frontend/src/lib/api.ts` — APPEND `getProductDetail` function and add `ProductDetailItem` to the import from `@/types/product`; do NOT remove or modify existing functions

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — Acceptance criteria verbatim
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — SSR for product detail, TanStack Query usage, rendering strategy table
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — `app/(shop)/products/[slug]/` directory structure
- [Source: backend/products/serializers.py] — `ProductDetailSerializer` fields: description, nutrition_facts, images, reviews
- [Source: frontend/src/types/product.ts] — `ProductDetailItem` type (do not redefine)
- [Source: frontend/src/lib/api.ts] — existing `apiUrl`, `PRODUCT_ENDPOINTS`, `apiFetch` (don't use apiFetch server-side)
- [Source: frontend/src/lib/constants.ts] — `DELIVERY_TIME_HOURS = 2`
- [Source: frontend/src/store/cart.ts] — `useCartStore` with `addItem(productId, quantity?)`
- [Source: frontend/src/components/features/products/product-card.tsx] — Image pattern, stock badge, goal badge, add-to-cart button pattern
- [Source: frontend/src/app/(shop)/products/page.tsx] — route group pattern, ISR (revalidate) — product detail does NOT use revalidate
- [Source: frontend/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md] — `params: Promise<{ slug: string }>` must be awaited
- [Source: frontend/node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md] — `cache: 'no-store'` makes page dynamic (SSR) without `dynamic = 'force-dynamic'`
- [Source: frontend/next.config.ts] — `images: { unoptimized: true }` — no remotePatterns needed, any URL works with `<Image>`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implemented `getProductDetail(slug)` using raw `fetch` with `cache: 'no-store'` (not `apiFetch`) — required because `apiFetch` contains client-only code (`window.location.href`)
- Created `ProductDetailView` client component with full product detail display: images gallery, goal tags, price, stock badge, delivery timer, certificate link, nutrition facts table, and reviews with star ratings
- Server page `app/(shop)/products/[slug]/page.tsx` awaits `params` as Promise (Next.js 16 requirement) and calls `notFound()` on 404
- All 7 tests pass; full suite of 33 tests passes with no regressions; TypeScript reports no errors

### File List

- `frontend/src/lib/api.ts` (modified — added `ProductDetailItem` import and `getProductDetail` function)
- `frontend/src/components/features/products/product-detail.tsx` (created)
- `frontend/src/app/(shop)/products/[slug]/page.tsx` (created)
- `frontend/src/test/product-detail.test.tsx` (created)

## Change Log

- 2026-05-05: Implemented Story 2.4 — Product Detail Page (SSR). Created SSR page with server/client component split, `getProductDetail` API function, `ProductDetailView` component with full product detail rendering, and 7 unit tests. All tests pass.
