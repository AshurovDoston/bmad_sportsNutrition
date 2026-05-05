# Story 2.5: Product Search & Advanced Filtering

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to search for products by name or brand and filter by brand and price range,
so that I can find exactly what I'm looking for without scrolling through the full catalog.

## Acceptance Criteria

1. **Given** the product listing page, **When** a user types in the search bar, **Then** the product list updates to show only products whose name or brand matches the query (calls `GET /api/v1/products/?search={query}`)
2. **Given** the filter panel, **When** a user enters a brand and/or price range, **Then** the product list updates to reflect all active filters simultaneously (multi-filter support; goal filter from GoalSelector continues to work alongside)
3. **Given** active filters or search, **When** the user clicks "Clear all filters", **Then** the unfiltered product list is restored (goal filter preserved)
4. **Given** a search or filter that returns no results, **When** the list renders, **Then** an empty state message is shown ("No products found — try a different goal or filter")
5. **Given** filter state, **When** the user changes goal from the goal selector, **Then** search, brand, and price filters reset and the new goal filter is applied
6. **Given** the search input, **When** the user types, **Then** requests are debounced (300ms minimum) to avoid excessive API calls

## Tasks / Subtasks

- [x] Task 1: Add `SearchFilter` to backend `ProductListView` (AC: 1)
  - [x] Import `SearchFilter` from `rest_framework.filters` in `backend/products/views.py`
  - [x] Add `SearchFilter` to `ProductListView.filter_backends` list (alongside existing `DjangoFilterBackend`)
  - [x] Add `search_fields = ['name', 'brand']` to `ProductListView`
  - [x] Add backend test: `test_search_by_name_returns_matching_products` in `backend/products/tests.py`
  - [x] Add backend test: `test_search_by_brand_returns_matching_products` in `backend/products/tests.py`

- [x] Task 2: Update frontend types and API function (AC: 1, 2)
  - [x] Add `search?: string` to `ProductsQueryParams` in `frontend/src/types/product.ts`
  - [x] Add `search` param to `getProducts` URL builder in `frontend/src/lib/api.ts` (after the existing `goal` param, before `brand`)

- [x] Task 3: Create `SearchBar` client component (AC: 1, 6)
  - [x] Create `frontend/src/components/features/products/search-bar.tsx`
  - [x] Mark `'use client'`
  - [x] Read `search` param from `useSearchParams()`; initialize input state from it
  - [x] Use `useEffect` + `setTimeout`/`clearTimeout` to debounce 300ms before updating URL
  - [x] Use `useRouter` + `usePathname` + `useSearchParams` to update `?search=` in URL via `router.replace`
  - [x] Preserve all other current URL params when updating search
  - [x] Clear search from URL when input is empty (delete the `search` key)
  - [x] Include a clear button (×) inside the input when there is a value

- [x] Task 4: Create `FilterPanel` client component (AC: 2, 3, 5)
  - [x] Create `frontend/src/components/features/products/filter-panel.tsx`
  - [x] Mark `'use client'`
  - [x] Brand: text input, debounced 300ms, updates `?brand=` in URL (same debounce pattern as SearchBar)
  - [x] Min price: number input, updates `?min_price=` in URL on blur or change
  - [x] Max price: number input, updates `?max_price=` in URL on blur or change
  - [x] "Clear filters" button: removes `search`, `brand`, `min_price`, `max_price` from URL while preserving `?goal=`
  - [x] Show "Clear filters" button only when at least one of search/brand/min_price/max_price is active
  - [x] Each input should read its initial value from URL params on mount

- [x] Task 5: Update `ProductList` to pass all filter params to API (AC: 1, 2, 4)
  - [x] Read `search`, `brand`, `min_price`, `max_price` from `useSearchParams()` (in addition to existing `goal`)
  - [x] Pass all params to `getProducts(...)` and include them in the TanStack Query `queryKey`
  - [x] Existing empty state message already matches AC: "No products found — try a different goal or filter"

- [x] Task 6: Update `ProductsPage` to include `SearchBar` and `FilterPanel` (AC: 1, 2, 3)
  - [x] Add `<SearchBar />` between `<GoalSelector />` and `<ProductList />` in `frontend/src/app/(shop)/products/page.tsx`
  - [x] Add `<FilterPanel />` below `<SearchBar />`
  - [x] Both components must be inside the existing `<Suspense>` boundary (or add their own) because they use `useSearchParams()`
  - [x] Keep `export const revalidate = 60` — the ISR is on the page shell only; data fetching is client-side

- [x] Task 7: Write frontend tests (AC: 1, 2, 3, 4, 6)
  - [x] Create `frontend/src/test/search-filter.test.tsx`
  - [x] Test: `SearchBar renders with empty input when no search param`
  - [x] Test: `SearchBar initializes from URL search param`
  - [x] Test: `FilterPanel shows clear button only when filters are active`
  - [x] Test: `ProductList passes search param to getProducts query`
  - [x] Test: `ProductList passes brand and price params to getProducts query`

## Dev Notes

### 🚨 Backend: DRF SearchFilter — Correct Import and Usage

```python
# backend/products/views.py — add SearchFilter
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

class ProductListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]   # ADD SearchFilter
    filterset_class = ProductFilter
    search_fields = ['name', 'brand']                        # ADD this line

    def get_queryset(self): ...  # unchanged
    def get_serializer_context(self): ...  # unchanged
```

DRF `SearchFilter` uses the `?search=query` parameter. It applies `icontains` on each `search_fields` entry with OR semantics: a product matches if `name` OR `brand` contains the query (case-insensitive). **Do NOT modify `filters.py`** — `DjangoFilterBackend` + `ProductFilter` handles goal/brand/price; `SearchFilter` handles text search.

### 🚨 Frontend: URL Param Pattern — useRouter + useSearchParams + usePathname

**This is the established pattern** for all param updates. Do NOT use `window.history.pushState` or `next/router` (pages router).

```tsx
'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

function updateParam(key: string, value: string | null) {
  const params = new URLSearchParams(searchParams.toString())
  if (value) {
    params.set(key, value)
  } else {
    params.delete(key)
  }
  router.replace(`${pathname}?${params.toString()}`, { scroll: false })
}
```

Use `router.replace` (not `push`) so the user doesn't get a history entry per keystroke.

### 🚨 Debounce Pattern — No External Library Needed

```tsx
const [inputValue, setInputValue] = useState(searchParams.get('search') ?? '')

useEffect(() => {
  const timer = setTimeout(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (inputValue) {
      params.set('search', inputValue)
    } else {
      params.delete('search')
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, 300)
  return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [inputValue])
```

The `searchParams` object must NOT be in the `useEffect` deps — adding it causes infinite re-render loops. The pattern above is correct and intentional.

### 🚨 useSearchParams() Requires Suspense Boundary

Components using `useSearchParams()` must be wrapped in `<Suspense>`. The products page already has one wrapping `<ProductList />`. `<SearchBar />` and `<FilterPanel />` also use `useSearchParams()`, so they must be inside a `<Suspense>` boundary too.

**Recommended approach** — wrap all three in a single Suspense:

```tsx
// frontend/src/app/(shop)/products/page.tsx
export default function ProductsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">Products</h1>
      <div className="mb-8">
        <GoalSelector />
      </div>
      <Suspense fallback={<div className="animate-pulse text-zinc-400">Loading...</div>}>
        <SearchBar />
        <FilterPanel />
        <ProductList />
      </Suspense>
    </main>
  )
}
```

### 🚨 ProductList Changes — Read All Filter Params

```tsx
// frontend/src/components/features/products/product-list.tsx
const goal = searchParams.get('goal') ?? undefined
const search = searchParams.get('search') ?? undefined
const brand = searchParams.get('brand') ?? undefined
const minPrice = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined
const maxPrice = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined

const { data, isLoading, isError } = useQuery({
  queryKey: ['products', { goal, search, brand, minPrice, maxPrice }],
  queryFn: () => getProducts({ goal, search, brand, min_price: minPrice, max_price: maxPrice }),
})
```

All 5 params must be in `queryKey` — TanStack Query re-fetches when any key changes.

### 🚨 getProducts — Add search Param

```typescript
// frontend/src/lib/api.ts — update getProducts
export async function getProducts(params?: ProductsQueryParams): Promise<PaginatedResponse<ProductListItem>> {
  const query = new URLSearchParams()
  if (params?.goal) query.set('goal', params.goal)
  if (params?.search) query.set('search', params.search)   // ADD THIS LINE
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

`getProducts` uses `apiFetch` (NOT raw `fetch`) — correct for client components. Do NOT change to raw `fetch`.

### 🚨 "Category" in Story = Goal Category

The PRD says "filter by goal, brand, category, and price range" — there is NO separate `category` field on the `Product` model. Goal categories ARE the categories. Goal filtering is handled by the existing `GoalSelector` component + `?goal=` param. The FilterPanel only needs brand + price range.

### 🚨 GoalSelector Behavior — AC 5

When the user changes goal via `GoalSelector`, it navigates to `/products?goal={slug}`, replacing ALL URL params. This satisfies AC 5 (brand and price reset on goal change) and is the existing behavior — **do NOT modify `GoalSelector`**.

### 🚨 Clear Filters — Preserve Goal

The "Clear filters" button should remove `search`, `brand`, `min_price`, `max_price` but preserve `?goal=`:

```tsx
function handleClearFilters() {
  const goal = searchParams.get('goal')
  if (goal) {
    router.replace(`${pathname}?goal=${goal}`, { scroll: false })
  } else {
    router.replace(pathname, { scroll: false })
  }
}
```

Show this button only when at least one filter is active:
```tsx
const hasActiveFilters = !!(
  searchParams.get('search') ||
  searchParams.get('brand') ||
  searchParams.get('min_price') ||
  searchParams.get('max_price')
)
```

### Existing Files to READ Before Modifying

- `backend/products/views.py` — read before adding SearchFilter; must preserve `get_queryset` and `get_serializer_context` methods
- `frontend/src/lib/api.ts` — read before modifying; preserve `getProductDetail`, `getGoals`, `apiFetch`, all constants
- `frontend/src/types/product.ts` — read before modifying; add `search` to `ProductsQueryParams` only
- `frontend/src/components/features/products/product-list.tsx` — read before modifying; add new params while preserving existing goal logic and UI states
- `frontend/src/app/(shop)/products/page.tsx` — read before modifying; preserve ISR, heading, GoalSelector

### What Already Exists — Do NOT Recreate

- `ProductFilter` in `backend/products/filters.py` — already has `goal`, `brand`, `min_price`, `max_price` — do NOT touch
- `getProducts` in `frontend/src/lib/api.ts` — already builds multi-param query string; just add `search` param
- `ProductsQueryParams` in `frontend/src/types/product.ts` — already has `goal`, `brand`, `min_price`, `max_price`; add `search` only
- Empty state message in `ProductList` already says "No products found — try a different goal or filter" — matches AC 4 exactly
- `useSearchParams` import already in `product-list.tsx` — no need to add

### Backend Test Pattern (from `backend/products/tests.py`)

```python
def test_search_by_name_returns_matching_products(self):
    make_product(name='Gold Standard Whey', slug='gold-whey', brand='Optimum')
    make_product(name='Creatine Monohydrate', slug='creatine', brand='MuscleTech')
    res = self.client.get(PRODUCTS_URL, {'search': 'Whey'})
    self.assertEqual(res.status_code, status.HTTP_200_OK)
    names = [p['name'] for p in res.data['results']]
    self.assertIn('Gold Standard Whey', names)
    self.assertNotIn('Creatine Monohydrate', names)

def test_search_by_brand_returns_matching_products(self):
    make_product(name='Gold Standard Whey', slug='gold-whey', brand='Optimum')
    make_product(name='Creatine Monohydrate', slug='creatine', brand='MuscleTech')
    res = self.client.get(PRODUCTS_URL, {'search': 'MuscleTech'})
    self.assertEqual(res.status_code, status.HTTP_200_OK)
    names = [p['name'] for p in res.data['results']]
    self.assertIn('Creatine Monohydrate', names)
    self.assertNotIn('Gold Standard Whey', names)
```

These tests go inside an existing test class (e.g., `ProductListTests`) or a new `ProductSearchTests` class. Follow the existing pattern: `self.client = APIClient()`.

### Frontend Test Pattern (from `frontend/src/test/product-list.test.tsx`)

Tests use `msw` + `@testing-library/react` + `QueryClientProvider`. The `useSearchParams` mock in `product-list.test.tsx` returns a specific value — update it or add new test files that provide different mock values for search/filter params.

For `SearchBar` and `FilterPanel` tests:
```tsx
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/products',
  useSearchParams: () => new URLSearchParams('search=whey'),
}))
```

### File List Summary

**Files to MODIFY (read before changing):**
- `backend/products/views.py` — add `SearchFilter` to `filter_backends`, add `search_fields`
- `backend/products/tests.py` — add search tests to `ProductListTests` class or new class
- `frontend/src/types/product.ts` — add `search?: string` to `ProductsQueryParams`
- `frontend/src/lib/api.ts` — add `search` param to `getProducts`
- `frontend/src/components/features/products/product-list.tsx` — read all filter params from URL
- `frontend/src/app/(shop)/products/page.tsx` — add SearchBar, FilterPanel inside Suspense

**Files to CREATE:**
- `frontend/src/components/features/products/search-bar.tsx`
- `frontend/src/components/features/products/filter-panel.tsx`
- `frontend/src/test/search-filter.test.tsx`

**Files NOT to touch:**
- `backend/products/filters.py` — `ProductFilter` is complete; no changes needed
- `backend/products/models.py` — no schema changes needed
- `frontend/src/components/features/products/goal-selector.tsx` — do NOT modify
- `frontend/src/components/features/products/product-card.tsx` — do NOT modify

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5] — Acceptance criteria verbatim
- [Source: _bmad-output/planning-artifacts/prd.md#FR5, FR6] — "filter by goal, brand, category, price range" and "search by name or brand"
- [Source: backend/products/views.py] — existing `ProductListView` with `DjangoFilterBackend` only
- [Source: backend/products/filters.py] — existing `ProductFilter` (goal, brand, min_price, max_price)
- [Source: frontend/src/lib/api.ts] — existing `getProducts` and `ProductsQueryParams`
- [Source: frontend/src/types/product.ts] — `ProductsQueryParams` interface
- [Source: frontend/src/components/features/products/product-list.tsx] — existing TanStack Query + searchParams pattern
- [Source: frontend/src/app/(shop)/products/page.tsx] — ISR page with GoalSelector + ProductList
- [Source: frontend/src/test/product-list.test.tsx] — msw + testing-library test pattern

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Task 1: Added `SearchFilter` to `ProductListView.filter_backends` with `search_fields = ['name', 'brand']`. DRF SearchFilter uses `?search=` with `icontains` OR semantics. 2 backend tests added; all 25 backend tests pass.
- Task 2: Added `search?: string` to `ProductsQueryParams` and `query.set('search', ...)` to `getProducts` between `goal` and `brand` params.
- Task 3: Created `SearchBar` with debounced (300ms) URL updates via `useRouter.replace`. Initializes from `?search=` param, preserves all other params, includes clear (×) button when input has value.
- Task 4: Created `FilterPanel` with brand (debounced), min/max price inputs. "Clear filters" button removes search/brand/min_price/max_price while preserving `?goal=`. Button only shown when at least one filter is active.
- Task 5: Updated `ProductList` to read all 5 params (goal, search, brand, min_price, max_price) and pass them to both `getProducts()` and the TanStack Query `queryKey`.
- Task 6: Updated `ProductsPage` to import and render `<SearchBar />` and `<FilterPanel />` inside the single `<Suspense>` boundary alongside `<ProductList />`.
- Task 7: Created `search-filter.test.tsx` with 6 tests covering SearchBar init, FilterPanel clear button visibility, and ProductList param passing. All 39 frontend tests pass.

### File List

**Modified:**
- `backend/products/views.py`
- `backend/products/tests.py`
- `frontend/src/types/product.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/components/features/products/product-list.tsx`
- `frontend/src/app/(shop)/products/page.tsx`

**Created:**
- `frontend/src/components/features/products/search-bar.tsx`
- `frontend/src/components/features/products/filter-panel.tsx`
- `frontend/src/test/search-filter.test.tsx`

## Change Log

- 2026-05-05: Implemented Story 2.5 — Product Search & Advanced Filtering. Added DRF SearchFilter to backend, created SearchBar and FilterPanel client components with 300ms debounce, updated ProductList and ProductsPage, added 9 backend + 6 frontend tests. All ACs satisfied.
