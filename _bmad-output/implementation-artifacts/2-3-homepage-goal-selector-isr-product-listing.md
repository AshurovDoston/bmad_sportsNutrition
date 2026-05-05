# Story 2.3: Homepage Goal Selector & ISR Product Listing

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to select my fitness goal on the homepage and immediately see a curated product list with delivery timers and stock indicators,
so that I can discover the right products for my goals without browsing an overwhelming catalog.

## Acceptance Criteria

1. **Given** the homepage (`/`), **When** it loads, **Then** a goal selector displays the 4 goal category cards (Muscle Gain, Fat Loss, Endurance, General Health) as the primary entry point.
2. **Given** a user selects a goal, **When** the selection is made, **Then** the user is navigated to `/products?goal={slug}` and the product list is filtered to that goal — rendered via ISR (revalidate: 60s).
3. **Given** the product listing page, **When** it renders, **Then** each product card displays: product name, primary image, price, goal badge, `why_this_works` copy, delivery timer ("Delivers in 2 hours"), and in-stock/out-of-stock indicator.
4. **Given** a product is out of stock, **When** its card renders, **Then** an "Out of Stock" badge is shown and the add-to-cart button is disabled.
5. **Given** the page, **When** a user changes their goal filter, **Then** the product list updates to reflect the new goal without a full page reload.
6. **Given** the product listing page on a 375px mobile viewport, **When** rendered, **Then** all product cards are fully readable and interactive with no horizontal overflow.
7. **Given** all data fetching on the listing page, **When** implemented, **Then** TanStack Query is used for client-side fetching — no raw `fetch` calls inside React components.

## Tasks / Subtasks

- [x] Task 1: Fix critical bugs in `constants.ts` and `types/product.ts` before building anything (AC: 2, 3, 5)
  - [x] Update `frontend/src/lib/constants.ts` — fix ALL 4 goal slugs to use underscores matching the backend exactly: `muscle_gain`, `fat_loss`, `endurance`, `general_health`. Remove the old wrong slugs entirely.
  - [x] Update `frontend/src/types/product.ts` — replace entire file with correct types matching the actual API: `GoalCategory`, `ProductListItem`, `ProductDetailItem`, `PaginatedResponse<T>`, `ProductsQueryParams`
  - [x] Update `frontend/next.config.ts` — add `images.remotePatterns` for `localhost:8000` so `next/image` can load product images from the Django backend

- [x] Task 2: Add product & goal API functions to `lib/api.ts` (AC: 7)
  - [x] Add `PRODUCT_ENDPOINTS` constant with `GOALS`, `PRODUCTS`, `PRODUCT_DETAIL` paths
  - [x] Add `getGoals()` async function — calls `GET /api/v1/goals/`, no auth required, returns `GoalCategory[]`
  - [x] Add `getProducts(params?: ProductsQueryParams)` async function — calls `GET /api/v1/products/` with optional `?goal=` query param, returns `PaginatedResponse<ProductListItem>`
  - [x] Both functions use `apiFetch` (not raw `fetch`) to ensure auth header is included on future authenticated calls

- [x] Task 3: Update `components/providers.tsx` to configure QueryClient with proper stale/cache times (AC: 7)
  - [x] Add `defaultOptions.queries` config: `staleTime: 1000 * 60 * 5` (5 min), `gcTime: 1000 * 60 * 10` (10 min), `retry: 1`, `refetchOnWindowFocus: true`
  - [x] Keep `useState` pattern for creating QueryClient (avoids creating a new instance on every render)

- [x] Task 4: Create `GoalSelector` component (AC: 1, 2)
  - [x] Create `frontend/src/components/features/products/goal-selector.tsx` as a client component (`'use client'`)
  - [x] Render 4 goal cards using `GOAL_CATEGORIES` from `@/lib/constants` — each card shows the `label` (display name)
  - [x] Each card links to `/products?goal={slug}` using Next.js `<Link>` (not a raw `<a>` tag)
  - [x] Apply mobile-first styles: full-width single column on mobile, 2×2 grid on sm+
  - [x] Use `role="button"` or `<Link>` with accessible label per goal name

- [x] Task 5: Replace the homepage placeholder with goal selector (AC: 1, 2)
  - [x] Rewrite `frontend/src/app/page.tsx` — render a hero heading and `<GoalSelector />` component
  - [x] Page is a Server Component (no `'use client'` — the child GoalSelector handles interactivity)
  - [x] Keep the layout simple: centered container, heading, sub-heading, goal cards

- [x] Task 6: Create `ProductCard` component (AC: 3, 4, 6)
  - [x] Create `frontend/src/components/features/products/product-card.tsx` as a client component
  - [x] Display: product name, `next/image` for primary image (fallback to placeholder div if `primary_image_url` is null), price formatted as currency, goal badge (first goal slug from `goal_categories`), `why_this_works` copy, delivery timer using `DELIVERY_TIME_HOURS` from `@/lib/constants`, and in-stock/out-of-stock badge
  - [x] When `is_in_stock` is false: show "Out of Stock" badge (red), disable the add-to-cart button with `disabled` attr and `opacity-50`
  - [x] The add-to-cart button calls `useCartStore().addItem(product.id)` from Zustand (Story 3 will wire up full cart sync)
  - [x] Mobile-first: card fills container width, image aspect ratio preserved, no horizontal overflow

- [x] Task 7: Create `ProductList` client component (AC: 3, 4, 5, 7)
  - [x] Create `frontend/src/components/features/products/product-list.tsx` as a client component (`'use client'`)
  - [x] Use `useSearchParams()` from `next/navigation` to read `?goal=` query param
  - [x] Use `useQuery` from `@tanstack/react-query` with `queryKey: ['products', { goal }]` and `queryFn: () => getProducts({ goal })`
  - [x] Render `isLoading` skeleton state (4 placeholder card divs with `animate-pulse`)
  - [x] Render `isError` error state with message "Could not load products. Please try again."
  - [x] Render product grid: 2 columns on 375px (mobile), 3 on `md:`, 4 on `lg:` — using Tailwind grid
  - [x] Render empty state when `data.results.length === 0`: "No products found — try a different goal or filter"
  - [x] When `goal` changes (user clicks a different goal card), the query key changes and TanStack Query auto-refetches — NO full page reload needed

- [x] Task 8: Create the products listing page with ISR (AC: 2, 5, 6)
  - [x] Create directory `frontend/src/app/(shop)/products/`
  - [x] Create `frontend/src/app/(shop)/products/page.tsx` — Server Component
  - [x] Export `export const revalidate = 60` at the top for ISR (old Next.js model, no `cacheComponents` flag needed)
  - [x] Wrap `<ProductList />` in `<Suspense fallback={<div>Loading...</div>}>` — required because `ProductList` uses `useSearchParams()` which is a runtime API
  - [x] Add a goal selector bar at the top of the listing page (reuse `<GoalSelector />`) so users can change their goal without going back to homepage
  - [x] Page receives no props — all filtering is driven by client-side `useSearchParams`

- [x] Task 9: Write tests (AC: 1, 3, 4, 5, 7)
  - [x] Create `frontend/src/test/goal-selector.test.tsx`:
    - `renders 4 goal cards` — renders `<GoalSelector />` wrapped in QueryClientProvider, asserts 4 links are present
    - `each goal card links to correct URL` — asserts each link has correct `href` with underscore slugs (`/products?goal=muscle_gain`, etc.)
  - [x] Create `frontend/src/test/product-list.test.tsx` using MSW (follow pattern from `login-form.test.tsx`):
    - `renders loading skeleton` — while MSW delays the response, skeleton divs with `animate-pulse` are visible
    - `renders product cards after fetch` — MSW returns 2 mock products; assert product names are rendered
    - `renders out-of-stock badge for unavailable products` — MSW returns a product with `is_in_stock: false`; assert "Out of Stock" is visible and add-to-cart button is disabled
    - `renders empty state when no products match goal` — MSW returns `{ count: 0, results: [] }`; assert empty state message appears

## Dev Notes

### 🚨 CRITICAL BUG — Fix constants.ts First

The FIRST thing the dev agent must do is fix `frontend/src/lib/constants.ts`. The current file has **completely wrong goal slugs** that will break all goal filtering:

**Current (WRONG):**
```typescript
// frontend/src/lib/constants.ts — CURRENTLY WRONG
export const GOAL_CATEGORIES = [
  { slug: 'muscle-gain', label: 'Muscle Gain' },    // WRONG: hyphens
  { slug: 'weight-loss', label: 'Weight Loss' },    // WRONG: wrong slug
  { slug: 'endurance', label: 'Endurance' },        // correct
  { slug: 'recovery', label: 'Recovery' },          // WRONG: wrong slug
]
```

**Required (CORRECT):**
```typescript
// frontend/src/lib/constants.ts — CORRECT
export const DELIVERY_TIME_HOURS = 2

export const GOAL_CATEGORIES = [
  { slug: 'muscle_gain', label: 'Muscle Gain' },
  { slug: 'fat_loss', label: 'Fat Loss' },
  { slug: 'endurance', label: 'Endurance' },
  { slug: 'general_health', label: 'General Health' },
] as const

export type GoalSlug = typeof GOAL_CATEGORIES[number]['slug']
```

The backend uses underscores. These exact slugs are what `GET /api/v1/products/?goal=muscle_gain` expects. Using the wrong slugs returns 0 results.

### 🚨 CRITICAL BUG — Fix types/product.ts First

The current `types/product.ts` has a completely wrong shape that doesn't match the API:

**Current (WRONG):**
```typescript
export interface Product {
  id: number; name: string; slug: string; description: string
  price: string; image: string | null; goal_tags: string[]; is_active: boolean
}
```

**Required (matches `ProductListSerializer` in `backend/products/serializers.py`):**
```typescript
// frontend/src/types/product.ts
export interface GoalCategory {
  id: number
  name: string
  slug: string
  why_it_works: string
}

export interface ProductListItem {
  id: number
  name: string
  slug: string
  price: string
  is_in_stock: boolean
  goal_categories: string[]        // array of goal slugs, e.g. ['muscle_gain', 'endurance']
  primary_image_url: string | null // absolute URL to backend media file
  certificate_url: string | null
  delivery_hours: number
  why_this_works: string
}

export interface ProductDetailItem extends ProductListItem {
  description: string
  nutrition_facts: Record<string, unknown>
  images: { id: number; image_url: string | null; is_primary: boolean }[]
  reviews: {
    id: number
    reviewer_name: string
    rating: number
    review_text: string
    is_verified: boolean
    photo_url: string | null
  }[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ProductsQueryParams {
  goal?: string
  brand?: string
  min_price?: number
  max_price?: number
  page?: number
}
```

### API Functions to Add to `lib/api.ts`

Add the following to `frontend/src/lib/api.ts`:

```typescript
import type { GoalCategory, ProductListItem, ProductDetailItem, PaginatedResponse, ProductsQueryParams } from '@/types/product'

export const PRODUCT_ENDPOINTS = {
  GOALS: '/api/v1/goals/',
  PRODUCTS: '/api/v1/products/',
  PRODUCT_DETAIL: (slug: string) => `/api/v1/products/${slug}/`,
} as const

export async function getGoals(): Promise<GoalCategory[]> {
  const res = await apiFetch(PRODUCT_ENDPOINTS.GOALS)
  if (!res.ok) throw new Error('Failed to fetch goals')
  return res.json() as Promise<GoalCategory[]>
}

export async function getProducts(params?: ProductsQueryParams): Promise<PaginatedResponse<ProductListItem>> {
  const query = new URLSearchParams()
  if (params?.goal) query.set('goal', params.goal)
  if (params?.brand) query.set('brand', params.brand)
  if (params?.min_price != null) query.set('min_price', String(params.min_price))
  if (params?.max_price != null) query.set('max_price', String(params.max_price))
  if (params?.page != null) query.set('page', String(params.page))
  const path = query.toString() ? `${PRODUCT_ENDPOINTS.PRODUCTS}?${query}` : PRODUCT_ENDPOINTS.PRODUCTS
  const res = await apiFetch(path)
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json() as Promise<PaginatedResponse<ProductListItem>>
}
```

### next.config.ts — Image Remote Patterns

The backend serves media files from `http://localhost:8000/media/...`. Next.js `<Image>` blocks unknown hosts by default. Update `frontend/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
```

Without this, any `<Image src={product.primary_image_url} />` will throw an error at runtime.

### ISR in Next.js 16 (Old Model — No `cacheComponents` flag)

This project uses Next.js 16.2.4 **without** `cacheComponents: true` in `next.config.ts`. This means:

- **ISR is implemented via `export const revalidate = 60`** at the route segment level (page/layout file)
- The `use cache` directive and `cacheLife` are NOT needed
- The old `fetch({ next: { revalidate: 60 } })` pattern also works at the individual fetch level
- **Product listing** uses `export const revalidate = 60` at `app/(shop)/products/page.tsx`

```typescript
// app/(shop)/products/page.tsx
export const revalidate = 60  // ISR: rebuild page at most once per 60 seconds

import { Suspense } from 'react'
import { ProductList } from '@/components/features/products/product-list'
import { GoalSelector } from '@/components/features/products/goal-selector'

export default function ProductsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <GoalSelector />
      <Suspense fallback={<div className="animate-pulse">Loading products...</div>}>
        <ProductList />
      </Suspense>
    </main>
  )
}
```

**Why `<Suspense>` is required around `<ProductList />`:**
`ProductList` uses `useSearchParams()` — a runtime API. In Next.js 16, client components using `useSearchParams()` must be wrapped in `<Suspense>` at the server component boundary. Without `<Suspense>`, the page will throw a build error.

### Architecture-Mandated Patterns

1. **No raw `fetch` in React components** — all API calls go through `apiFetch` wrapped in `useQuery`/`useMutation` from TanStack Query. This is a hard requirement from the architecture.

2. **TanStack Query key structure** — use array keys with object params: `['products', { goal }]`. When `goal` changes, a new cache entry is created. The query re-fires automatically.

3. **`useSearchParams` for client-side goal filtering** — the product list reads the current goal from the URL query param. When the user clicks a goal card (which navigates to `?goal=muscle_gain`), the URL changes, `useSearchParams` sees the new value, the query key changes, and TanStack Query fetches the filtered list. No manual re-fetch needed.

4. **Route group `(shop)`** — the architecture defines `app/(shop)/products/page.tsx`. Route groups are created using parentheses in the directory name: `frontend/src/app/(shop)/products/`. The URL remains `/products` — route groups don't affect URL paths.

5. **GoalSelector** — used in two places: the homepage (`app/page.tsx`) and the products listing page (`app/(shop)/products/page.tsx`). Extract it as a reusable component in `features/products/`.

### Delivery Timer Implementation

From `constants.ts`:
```typescript
export const DELIVERY_TIME_HOURS = 2
```

Use in `ProductCard`:
```typescript
import { DELIVERY_TIME_HOURS } from '@/lib/constants'
// Renders:
<span>Delivers in {DELIVERY_TIME_HOURS} hours</span>
```

Do NOT hardcode "2 hours" inline. Always use the constant.

### Mobile Responsive Grid

The product listing must be fully readable at 375px (iPhone SE / most Android phones). Use Tailwind grid:

```typescript
// Product grid — 2 columns on mobile, 3 on md, 4 on lg
<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
  {products.map(p => <ProductCard key={p.id} product={p} />)}
</div>
```

Each card must NOT have a fixed width that causes horizontal overflow. Use `w-full` on cards within the grid.

### GoalSelector Navigation Pattern

Goal cards use Next.js `<Link>` component. Clicking a goal navigates to `/products?goal={slug}`:

```typescript
import Link from 'next/link'
import { GOAL_CATEGORIES } from '@/lib/constants'

export function GoalSelector() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {GOAL_CATEGORIES.map((goal) => (
        <Link
          key={goal.slug}
          href={`/products?goal=${goal.slug}`}
          className="..."
        >
          {goal.label}
        </Link>
      ))}
    </div>
  )
}
```

**Important:** Use `<Link>` from `next/navigation`, NOT an `<a>` tag. This enables client-side navigation without a full page reload.

### What Already Exists — Do NOT Recreate

From Story 2.2 (already merged):
- `backend/products/management/commands/seed_data.py` — seeds 52 products, 4 goals, reviews, images, certificates
- `backend/content/models.py` — `ConfusionEntry` model

From Story 2.1:
- `backend/products/views.py` — `GoalListView`, `ProductListView`, `ProductDetailView`
- `backend/products/urls.py` — all three routes registered
- `backend/products/serializers.py` — `GoalCategorySerializer`, `ProductListSerializer`, `ProductDetailSerializer`
- `backend/products/filters.py` — `ProductFilter` with `goal` (iexact on slug), `brand`, `min_price`, `max_price`

From Stories 1.x:
- `frontend/src/lib/api.ts` — `apiFetch`, `AUTH_ENDPOINTS`, `logoutUser` — **ADD to this file, do NOT rewrite it**
- `frontend/src/store/auth.ts` — `useAuthStore`
- `frontend/src/store/cart.ts` — `useCartStore` with `addItem`, `removeItem`, `clearCart`
- `frontend/src/components/providers.tsx` — `Providers` with `QueryClientProvider`

### Cart Store Integration (for ProductCard add-to-cart button)

Story 3 implements full cart backend sync. For this story, the add-to-cart button only calls `useCartStore().addItem(product.id)` (Zustand guest cart). This is sufficient for Story 2.3 and the demo.

```typescript
import { useCartStore } from '@/store/cart'

// In ProductCard:
const { addItem } = useCartStore()
<button
  onClick={() => addItem(product.id)}
  disabled={!product.is_in_stock}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  {product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
</button>
```

### Testing Pattern

Follow the exact pattern from `frontend/src/test/login-form.test.tsx`:

```typescript
// frontend/src/test/product-list.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductList } from '@/components/features/products/product-list'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: (key: string) => key === 'goal' ? 'muscle_gain' : null }),
}))

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const mockProduct = {
  id: 1, name: 'Gold Standard Whey', slug: 'gold-standard-100-whey',
  price: '29.99', is_in_stock: true, goal_categories: ['muscle_gain'],
  primary_image_url: null, certificate_url: null, delivery_hours: 2,
  why_this_works: 'Whey protein rapidly delivers amino acids.'
}
```

**Important note for `next/navigation` mock:** `useSearchParams` must be mocked because it's a runtime API that doesn't exist in the test environment. Without this mock, tests will fail with an error about `searchParams` context.

### File List Summary

**Files to CREATE:**
- `frontend/src/app/(shop)/products/page.tsx`
- `frontend/src/components/features/products/goal-selector.tsx`
- `frontend/src/components/features/products/product-list.tsx`
- `frontend/src/components/features/products/product-card.tsx`
- `frontend/src/test/goal-selector.test.tsx`
- `frontend/src/test/product-list.test.tsx`

**Files to UPDATE (READ BEFORE MODIFYING):**
- `frontend/src/app/page.tsx` — replace placeholder with hero + GoalSelector
- `frontend/src/lib/api.ts` — append PRODUCT_ENDPOINTS, getGoals(), getProducts() — do NOT remove existing auth functions
- `frontend/src/lib/constants.ts` — fix goal slugs ONLY (keep DELIVERY_TIME_HOURS)
- `frontend/src/types/product.ts` — replace entirely with correct types
- `frontend/src/components/providers.tsx` — add QueryClient defaultOptions
- `frontend/next.config.ts` — add images.remotePatterns for localhost:8000

### What This Story Does NOT Implement

- Product search input (Story 2.5)
- Brand/price filter panel (Story 2.5)
- Pagination UI (Story 2.5)
- Product detail page (Story 2.4)
- Add-to-cart backend sync (Story 3.1)
- Any backend changes — backend is complete (Stories 2.1 + 2.2)
- Confusion Resolver pages (Story 2.6)

### Project Structure Notes

- Route group `(shop)` is a Next.js App Router concept. Create the directory as `frontend/src/app/(shop)/` — the parentheses are literal in the directory name.
- Product feature components go in `frontend/src/components/features/products/` — the `.gitkeep` placeholder is already there, just add files alongside it.
- Do NOT use the `.gitkeep` file name — create real `.tsx` files.
- All test files go in `frontend/src/test/` following the existing pattern.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — Acceptance Criteria verbatim
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — ISR strategy, TanStack Query usage, route structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Routing] — App Router structure, (shop) route group
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Fetching] — No raw fetch, queryKey patterns, QueryClient config
- [Source: backend/products/serializers.py] — ProductListSerializer field list (source of truth for API response shape)
- [Source: backend/products/filters.py] — `goal` filter uses `iexact` on `goal_categories__slug`
- [Source: backend/products/urls.py] — API endpoints: `/api/v1/goals/`, `/api/v1/products/`, `/api/v1/products/{slug}/`
- [Source: frontend/src/lib/api.ts] — existing `apiFetch` function to reuse (do NOT rewrite)
- [Source: frontend/src/lib/constants.ts] — DELIVERY_TIME_HOURS constant (keep, just fix slugs)
- [Source: frontend/src/store/cart.ts] — `useCartStore` with `addItem` for product card button
- [Source: frontend/src/test/login-form.test.tsx] — test pattern: MSW, QueryClient wrapper, vi.mock next/navigation
- [Source: frontend/node_modules/next/dist/docs/01-app/01-getting-started/09-revalidating.md] — Next.js 16 ISR: old model uses `export const revalidate = N`
- [Source: frontend/node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md] — Old model caching (no `cacheComponents` flag)
- [Source: frontend/node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md] — `<Suspense>` required for components using runtime APIs like `useSearchParams`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Fixed critical slug mismatch: old constants used hyphens and wrong names (weight-loss, recovery); replaced with backend-matching underscored slugs (muscle_gain, fat_loss, endurance, general_health).
- Replaced stale Product interface with full API-matching types (GoalCategory, ProductListItem, ProductDetailItem, PaginatedResponse<T>, ProductsQueryParams).
- Added next/image remote pattern for localhost:8000 — required for Django media files.
- Extended api.ts with PRODUCT_ENDPOINTS, getGoals(), getProducts() — all routed through existing apiFetch (no raw fetch).
- Configured QueryClient defaultOptions (staleTime 5min, gcTime 10min, retry 1, refetchOnWindowFocus true).
- GoalSelector is a pure client component using Next.js Link — 2-col mobile, 4-col sm+ grid.
- Homepage replaced: Server Component renders hero text + GoalSelector.
- ProductCard: image with fallback, goal badge, why_this_works, DELIVERY_TIME_HOURS constant, Out of Stock badge + disabled button for is_in_stock=false.
- ProductList: useSearchParams for goal param, useQuery with ['products',{goal}] key, loading skeleton (animate-pulse), error state, empty state, 2/3/4-col responsive grid.
- ProductsPage: route group (shop)/products/page.tsx, export const revalidate=60, GoalSelector bar + Suspense-wrapped ProductList.
- All 26 tests pass (7 test files, 0 regressions). Fixed out-of-stock test to use getAllByText since both badge and button contain the same text.

### File List

- frontend/src/lib/constants.ts (modified)
- frontend/src/types/product.ts (modified)
- frontend/next.config.ts (modified)
- frontend/src/lib/api.ts (modified)
- frontend/src/components/providers.tsx (modified)
- frontend/src/app/page.tsx (modified)
- frontend/src/components/features/products/goal-selector.tsx (created)
- frontend/src/components/features/products/product-card.tsx (created)
- frontend/src/components/features/products/product-list.tsx (created)
- frontend/src/app/(shop)/products/page.tsx (created)
- frontend/src/test/goal-selector.test.tsx (created)
- frontend/src/test/product-list.test.tsx (created)

## Change Log

- Implemented Story 2.3: Homepage Goal Selector & ISR Product Listing (Date: 2026-05-05)
  - Fixed critical goal slug bugs in constants.ts and product types
  - Added product/goal API functions to api.ts
  - Created GoalSelector, ProductCard, ProductList components
  - Created /products route with ISR (revalidate: 60)
  - Replaced homepage placeholder with goal selector
  - Added 6 tests across 2 new test files; 26/26 pass
