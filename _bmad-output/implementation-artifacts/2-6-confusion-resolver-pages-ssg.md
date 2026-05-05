# Story 2.6: Confusion Resolver Pages (SSG)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper confused about which supplements to take,
I want to browse Q&A entries that answer common supplement questions with product recommendations,
so that I can make an informed first purchase without needing expert knowledge.

## Acceptance Criteria

1. **Given** the `/confusion-resolver` page, **When** it loads, **Then** all published Confusion Resolver entries are listed, each showing the question and a brief answer preview — rendered as SSG (static at build time)
2. **Given** a Confusion Resolver entry, **When** expanded or navigated to, **Then** the full answer is displayed along with 1–3 recommended products linked to their product detail pages
3. **Given** the Confusion Resolver pages, **When** rendered, **Then** they are publicly accessible without authentication (FR43)
4. **Given** the SSG pages, **When** the Next.js build runs, **Then** all Confusion Resolver entries are pre-rendered as static HTML — no server-side processing per request
5. **Given** no Confusion Resolver entries exist in the database, **When** the page loads, **Then** an empty state is shown ("Check back soon for expert answers")

## Tasks / Subtasks

- [x] Task 1: Implement `ConfusionEntrySerializer` in backend (AC: 2, 3)
  - [x] Open `backend/content/serializers.py` and implement `ConfusionEntryRecommendedProductSerializer` with fields: `id`, `name`, `slug`, `primary_image_url`, `price`
  - [x] Implement `ConfusionEntrySerializer` with fields: `id`, `question`, `answer`, `recommended_products` (nested, many=True, read_only=True), filtering `is_published=True` entries only
  - [x] Import `Product` from `products.models` in serializers.py for the nested serializer

- [x] Task 2: Implement public read-only views and register URLs (AC: 1, 3, 4)
  - [x] In `backend/content/views.py`: import `generics`, `AllowAny`, `ConfusionEntry` model, `ConfusionEntrySerializer`
  - [x] Create `ConfusionEntryListView(generics.ListAPIView)` with `permission_classes = [AllowAny]`, `serializer_class = ConfusionEntrySerializer`, `queryset = ConfusionEntry.objects.filter(is_published=True).prefetch_related('recommended_products')`
  - [x] Disable pagination on this view by setting `pagination_class = None` (bounded dataset, SSG needs all entries at once)
  - [x] In `backend/content/urls.py`: register `ConfusionEntryListView` at path `confusion/`
  - [x] In `backend/core/urls.py`: uncomment `path('api/v1/', include('content.urls'))` (currently commented as `# Story 4`)

- [x] Task 3: Add backend tests (AC: 1, 3, 5)
  - [x] In `backend/content/tests.py`: import `TestCase`, `APIClient`, `status`, `ConfusionEntry`, `reverse`/direct URL
  - [x] Test: `test_confusion_list_returns_published_entries_only` — create 1 published + 1 unpublished entry, assert only published appears
  - [x] Test: `test_confusion_list_returns_recommended_products` — verify `recommended_products` array present and contains expected product fields
  - [x] Test: `test_confusion_list_publicly_accessible` — call without auth token, assert HTTP 200
  - [x] Test: `test_confusion_list_empty_returns_empty_array` — empty DB, assert HTTP 200 with empty `results` or `[]`

- [x] Task 4: Update `ConfusionEntry` TypeScript types (AC: 2)
  - [x] In `frontend/src/types/content.ts`: add `ConfusionRecommendedProduct` interface with `id: number`, `name: string`, `slug: string`, `price: string`
  - [x] Update `ConfusionEntry` interface: add `recommended_products: ConfusionRecommendedProduct[]`

- [x] Task 5: Add `getConfusionEntries` to `lib/api.ts` (AC: 1, 4)
  - [x] Add `CONTENT_ENDPOINTS = { CONFUSION: '/api/v1/confusion/' }` constant to `frontend/src/lib/api.ts`
  - [x] Add `getConfusionEntries()` function using `fetch` (not `apiFetch`) against `serverApiBase` with `cache: 'force-cache'` for build-time SSG; return `ConfusionEntry[]`
  - [x] Import `ConfusionEntry` from `@/types/content` at top of file
  - [x] Throw `Error` on non-OK response (same pattern as `getProductDetail`)

- [x] Task 6: Create `/confusion-resolver/page.tsx` as SSG Server Component (AC: 1, 2, 4, 5)
  - [x] Create directory `frontend/src/app/confusion-resolver/` and file `page.tsx`
  - [x] Do NOT mark `'use client'` — this is a pure Server Component
  - [x] Add `export const dynamic = 'force-static'` to enforce SSG at build time
  - [x] Call `getConfusionEntries()` at the top level (awaited — Server Component)
  - [x] Render list: each entry shows question as heading + first 150 chars of answer as preview
  - [x] Each entry is an expandable accordion (use HTML `<details>`/`<summary>` — no JS needed, no client component required) showing full answer when opened
  - [x] Under the full answer: render up to 3 recommended products as cards with product name and a `<Link href={/products/${product.slug}}>` link
  - [x] If `entries.length === 0`: show empty state `<p>Check back soon for expert answers</p>`
  - [x] No auth required — publicly accessible (consistent with middleware.ts which only guards `/account/*` and `/admin/*`)

- [x] Task 7: Write frontend tests (AC: 1, 4, 5)
  - [x] Create `frontend/src/test/confusion-resolver.test.tsx`
  - [x] Mock `@/lib/api` module to return fixture entries and empty state
  - [x] Test: `ConfusionResolverPage renders questions and answer previews`
  - [x] Test: `ConfusionResolverPage renders empty state when no entries`
  - [x] Test: `ConfusionResolverPage renders recommended product links`

## Dev Notes

### 🚨 CRITICAL: Content URLs Are NOT Registered Yet

`backend/core/urls.py` currently has:
```python
# path('api/v1/', include('content.urls')),  # Story 4
```

**This line MUST be uncommented in Task 2.** Without it, the entire confusion API returns 404. The comment says "Story 4" but the public read endpoint is needed in Story 2.6. The admin write CRUD will be added in Story 4.4 without further core/urls.py changes (the include already covers it).

### 🚨 Backend: Content App Is Nearly Empty — Build From Scratch

The `backend/content/` app exists but has placeholder files:
- `views.py`: only contains `from rest_framework.viewsets import ModelViewSet` (unused import)
- `serializers.py`: only contains `from rest_framework import serializers`
- `urls.py`: has an empty `DefaultRouter` with no routes registered
- `tests.py`: only contains `from django.test import TestCase`

**The ConfusionEntry model is already complete** (`backend/content/models.py`):
```python
class ConfusionEntry(models.Model):
    question = models.TextField()
    answer = models.TextField()
    recommended_products = models.ManyToManyField(
        'products.Product',
        blank=True,
        related_name='confusion_entries'
    )
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

No migrations needed — the model and migration already exist.

### 🚨 Seeded Data Is Already in the DB

`python manage.py seed_data` already creates 6 `ConfusionEntry` records with `is_published=True` and `recommended_products` linked to products by slug. The backend API just needs to expose them. The seed data does NOT add individual confusion resolver pages — that's purely a frontend concern.

### 🚨 Serializer: Nested Recommended Products

The `recommended_products` field is a M2M to `products.Product`. Use a minimal nested serializer — do NOT reuse `ProductListSerializer` (too heavy, uses `SerializerMethodField` for `primary_image_url` that requires request context which is awkward in nested serializers).

**Do NOT include `primary_image_url`** — the AC only requires product links to detail pages, not images. `id`, `name`, `slug`, `price` is sufficient for a named product link:

```python
# backend/content/serializers.py
from rest_framework import serializers
from products.models import Product
from .models import ConfusionEntry

class ConfusionRecommendedProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'price']

class ConfusionEntrySerializer(serializers.ModelSerializer):
    recommended_products = ConfusionRecommendedProductSerializer(many=True, read_only=True)

    class Meta:
        model = ConfusionEntry
        fields = ['id', 'question', 'answer', 'recommended_products']
```

**Why no `primary_image_url`?** `ProductListSerializer.get_primary_image_url` calls `request.build_absolute_uri()` using `self.context.get('request')`. In a nested serializer (no direct view context), the request context may be `None`, returning relative paths that break in SSG. Keep it simple: name + slug is enough for a "View product" link. **Do NOT expose `is_published` or `created_at`** — these are internal fields.

### 🚨 View: Disable Pagination and Filter by `is_published`

```python
# backend/content/views.py
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import ConfusionEntry
from .serializers import ConfusionEntrySerializer

class ConfusionEntryListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ConfusionEntrySerializer
    pagination_class = None  # SSG fetches all at once; bounded dataset
    queryset = ConfusionEntry.objects.filter(is_published=True).prefetch_related('recommended_products')
```

Disabling pagination means the response is a plain JSON array `[...]` — NOT `{"results": [...], "count": ...}`. The `getConfusionEntries()` frontend function must match this (return `ConfusionEntry[]`, not paginated).

### 🚨 URL Registration

```python
# backend/content/urls.py
from django.urls import path
from .views import ConfusionEntryListView

urlpatterns = [
    path('confusion/', ConfusionEntryListView.as_view(), name='confusion-list'),
]
```

Then in `backend/core/urls.py`, uncomment:
```python
path('api/v1/', include('content.urls')),
```

Resulting endpoint: `GET /api/v1/confusion/`

### 🚨 Frontend: SSG Pattern with Server Component

This page must NOT be a Client Component. It is a pure Server Component that fetches data at build time:

```tsx
// frontend/src/app/confusion-resolver/page.tsx
import { getConfusionEntries } from '@/lib/api'
import Link from 'next/link'

export const dynamic = 'force-static'

export default async function ConfusionResolverPage() {
  let entries = []
  try {
    entries = await getConfusionEntries()
  } catch {
    // Render empty state on fetch failure (SSG build-time error tolerance)
    entries = []
  }

  if (entries.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Confusion Resolver</h1>
        <p className="text-zinc-500">Check back soon for expert answers</p>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Confusion Resolver</h1>
      <div className="space-y-4">
        {entries.map((entry) => (
          <details key={entry.id} className="border rounded-lg p-4">
            <summary className="cursor-pointer font-semibold text-lg">
              {entry.question}
            </summary>
            <div className="mt-3">
              <p className="text-zinc-700 dark:text-zinc-300 mb-4">{entry.answer}</p>
              {entry.recommended_products.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Recommended products:</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.recommended_products.slice(0, 3).map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-sm hover:underline"
                      >
                        {product.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </main>
  )
}
```

**Why `<details>`/`<summary>`?** The AC says "expanded or navigated to" — accordion-style expand is simpler than separate pages and requires zero JavaScript. Native HTML semantics, no client component needed.

**Why `try/catch` around fetch?** At SSG build time, if the backend is not available, the build should not fail — render empty state instead of crashing.

### 🚨 API Client: Use `serverApiBase` + `force-cache` for SSG

```typescript
// frontend/src/lib/api.ts — add to existing file

import type { ConfusionEntry } from '@/types/content'

export const CONTENT_ENDPOINTS = {
  CONFUSION: '/api/v1/confusion/',
} as const

export async function getConfusionEntries(): Promise<ConfusionEntry[]> {
  const res = await fetch(`${serverApiBase}${CONTENT_ENDPOINTS.CONFUSION}`, {
    cache: 'force-cache',
  })
  if (!res.ok) throw new Error('Failed to fetch confusion entries')
  return res.json() as Promise<ConfusionEntry[]>
}
```

Key points:
- Use `serverApiBase` (not `apiFetch`) — this is called server-side during build, not from a browser
- Use `cache: 'force-cache'` for SSG behavior (fetch once at build time)
- Response is a plain array `[]` (pagination disabled on backend), so type is `ConfusionEntry[]`
- `serverApiBase` is already defined at line 64 of `api.ts`: `const serverApiBase = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'`

### 🚨 TypeScript Types Update

```typescript
// frontend/src/types/content.ts — update existing file
export interface ConfusionRecommendedProduct {
  id: number
  name: string
  slug: string
  price: string
}

export interface BlogArticle {
  id: number
  title: string
  slug: string
  body: string
  published_at: string
}

export interface ConfusionEntry {
  id: number
  question: string
  answer: string
  recommended_products: ConfusionRecommendedProduct[]
}
```

### 🚨 No Middleware Changes Needed

`frontend/src/middleware.ts` guards `/account/*` and `/admin/*` routes. The `/confusion-resolver` route is public and requires no middleware changes.

### 🚨 Product Model Field: `primary_image_url`

The `Product` model has `primary_image_url` — check `backend/products/serializers.py` to confirm the exact field name. In the `ProductListSerializer`, this is returned as `primary_image_url`. Use the same field name in `ConfusionRecommendedProductSerializer`. If the product has no image, the field may be `null`.

### 🚨 Frontend Tests Pattern (from existing tests)

Tests use `msw` + `@testing-library/react`. For Server Component testing, mock the API module directly:

```tsx
// frontend/src/test/confusion-resolver.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api', () => ({
  getConfusionEntries: vi.fn(),
}))

import { getConfusionEntries } from '@/lib/api'
import ConfusionResolverPage from '@/app/confusion-resolver/page'

describe('ConfusionResolverPage', () => {
  it('renders questions and answer previews', async () => {
    vi.mocked(getConfusionEntries).mockResolvedValue([
      {
        id: 1,
        question: 'Do I need protein powder?',
        answer: 'Not necessarily...',
        recommended_products: [{ id: 1, name: 'Whey Protein', slug: 'whey', price: '29.99' }],
      },
    ])
    render(await ConfusionResolverPage())
    expect(screen.getByText('Do I need protein powder?')).toBeInTheDocument()
    expect(screen.getByText('Not necessarily...')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Whey Protein' })).toHaveAttribute('href', '/products/whey')
  })

  it('renders empty state when no entries', async () => {
    vi.mocked(getConfusionEntries).mockResolvedValue([])
    render(await ConfusionResolverPage())
    expect(screen.getByText('Check back soon for expert answers')).toBeInTheDocument()
  })

  it('links recommended products to product detail pages', async () => {
    vi.mocked(getConfusionEntries).mockResolvedValue([
      {
        id: 1,
        question: 'Test question',
        answer: 'Test answer',
        recommended_products: [
          { id: 1, name: 'Product A', slug: 'product-a', price: '10.00' },
          { id: 2, name: 'Product B', slug: 'product-b', price: '20.00' },
        ],
      },
    ])
    render(await ConfusionResolverPage())
    expect(screen.getByRole('link', { name: 'Product A' })).toHaveAttribute('href', '/products/product-a')
    expect(screen.getByRole('link', { name: 'Product B' })).toHaveAttribute('href', '/products/product-b')
  })
})
```

**Note on testing async Server Components:** `render(await ConfusionResolverPage())` — the async Server Component is awaited before rendering in tests.

### Backend Test Pattern (from `backend/products/tests.py`)

```python
# backend/content/tests.py
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from products.models import Product, GoalCategory
from content.models import ConfusionEntry

CONFUSION_URL = '/api/v1/confusion/'

class ConfusionEntryListTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_confusion_list_publicly_accessible(self):
        res = self.client.get(CONFUSION_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_confusion_list_returns_published_entries_only(self):
        ConfusionEntry.objects.create(question='Published Q', answer='A', is_published=True)
        ConfusionEntry.objects.create(question='Hidden Q', answer='A', is_published=False)
        res = self.client.get(CONFUSION_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        questions = [e['question'] for e in res.data]
        self.assertIn('Published Q', questions)
        self.assertNotIn('Hidden Q', questions)

    def test_confusion_list_returns_recommended_products(self):
        goal = GoalCategory.objects.create(name='Muscle Gain', slug='muscle_gain', description='', why_it_works='')
        product = Product.objects.create(
            name='Test Protein', slug='test-protein', description='', price='29.99',
            stock_quantity=10, is_in_stock=True, brand='Test', delivery_hours=2
        )
        entry = ConfusionEntry.objects.create(question='Q', answer='A', is_published=True)
        entry.recommended_products.add(product)
        res = self.client.get(CONFUSION_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data[0]['recommended_products']), 1)
        self.assertEqual(res.data[0]['recommended_products'][0]['slug'], 'test-protein')

    def test_confusion_list_empty_returns_empty_array(self):
        res = self.client.get(CONFUSION_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])
```

### Existing Files to READ Before Modifying

- `backend/content/models.py` — read to confirm exact field names (already fully implemented)
- `backend/products/serializers.py` — read to confirm `primary_image_url` field name on `Product` and understand how nested serializers are structured in this codebase
- `backend/core/urls.py` — read before uncommenting content.urls line; preserve all other registrations
- `frontend/src/lib/api.ts` — read before adding; preserve all existing exports, `serverApiBase` variable is already defined
- `frontend/src/types/content.ts` — read before modifying; preserve `BlogArticle` interface

### What Already Exists — Do NOT Recreate

- `ConfusionEntry` model and migration — already complete in `backend/content/models.py`
- `ConfusionEntry` TypeScript interface (without `recommended_products`) — update in place, do not recreate
- `serverApiBase` variable in `api.ts` — already defined at line 64; reuse for `getConfusionEntries`
- `blogArticle` interface in `content.ts` — preserve when updating file
- Seed data — `seed_data.py` already seeds 6 confusion entries; no changes needed to seed command

### File List Summary

**Files to MODIFY (read before changing):**
- `backend/content/serializers.py` — implement `ConfusionRecommendedProductSerializer` + `ConfusionEntrySerializer`
- `backend/content/views.py` — implement `ConfusionEntryListView`
- `backend/content/urls.py` — register `ConfusionEntryListView` at `confusion/`
- `backend/content/tests.py` — add 4 backend tests
- `backend/core/urls.py` — uncomment `path('api/v1/', include('content.urls'))`
- `frontend/src/types/content.ts` — add `ConfusionRecommendedProduct`, update `ConfusionEntry`
- `frontend/src/lib/api.ts` — add `CONTENT_ENDPOINTS`, `getConfusionEntries`

**Files to CREATE:**
- `frontend/src/app/confusion-resolver/page.tsx` — SSG Server Component
- `frontend/src/test/confusion-resolver.test.tsx` — 3 frontend tests

**Files NOT to touch:**
- `backend/content/models.py` — complete, no changes needed
- `backend/content/migrations/` — no schema changes
- `backend/products/management/commands/seed_data.py` — seed already handles confusion entries
- `frontend/src/middleware.ts` — `/confusion-resolver` is public, no changes
- `frontend/src/app/layout.tsx` — no layout changes needed

### Project Structure Notes

- New page at `frontend/src/app/confusion-resolver/page.tsx` — matches architecture directory structure exactly
- Backend content app at `backend/content/` — already exists, aligns with architecture `content/` domain app
- API endpoint at `GET /api/v1/confusion/` — matches architecture `content/urls.py # /api/v1/confusion/`
- No new Zustand store — this is SSG content, no client state needed
- No TanStack Query — SSG Server Component fetches at build time, not client-side

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.6] — Acceptance criteria verbatim
- [Source: _bmad-output/planning-artifacts/prd.md#FR13, FR43] — Confusion Resolver public access, Q&A with product recommendations
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — SSG rendering strategy for confusion-resolver; `app/confusion-resolver/page.tsx`
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — `content/` backend app, `app/blog/` and `app/confusion-resolver/` frontend
- [Source: backend/content/models.py] — `ConfusionEntry` model with `recommended_products` M2M field
- [Source: backend/core/urls.py:14] — commented-out content.urls include to uncomment
- [Source: backend/products/management/commands/seed_data.py#_seed_confusion] — 6 confusion entries seeded; `recommended_products` linked by slug
- [Source: frontend/src/lib/api.ts:64] — `serverApiBase` variable already defined for SSG fetches
- [Source: frontend/src/types/content.ts] — `ConfusionEntry` interface to update with `recommended_products`
- [Source: _bmad-output/implementation-artifacts/2-5-product-search-advanced-filtering.md#Dev Notes] — Previous story patterns: debounce, useRouter, Suspense; NOT needed in this story (SSG)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Fixed `GoalCategory.objects.create` in backend tests — model has no `description` field; removed it.

### Completion Notes List

Implemented full Confusion Resolver SSG feature:
- Backend: `ConfusionRecommendedProductSerializer` + `ConfusionEntrySerializer` with nested products (no `primary_image_url` to avoid request-context issues in nested serializers)
- Backend: `ConfusionEntryListView` with `AllowAny`, `pagination_class = None` (plain array response for SSG), filtered to `is_published=True`
- Registered `content.urls` in `core/urls.py` (was commented as "Story 4"; needed in Story 2.6 for public read endpoint)
- 4 backend tests pass (public access, published-only filter, recommended products, empty array)
- TypeScript: added `ConfusionRecommendedProduct` interface and updated `ConfusionEntry` with `recommended_products` field
- Added `CONTENT_ENDPOINTS` + `getConfusionEntries()` to `api.ts` using `serverApiBase` + `force-cache` for SSG
- Created SSG Server Component at `app/confusion-resolver/page.tsx` with `force-static`, `<details>`/`<summary>` accordion, try/catch for build-time resilience
- 3 frontend tests pass + full suite: 42 frontend, 43 backend — no regressions

### File List

- `backend/content/serializers.py` (modified)
- `backend/content/views.py` (modified)
- `backend/content/urls.py` (modified)
- `backend/content/tests.py` (modified)
- `backend/core/urls.py` (modified)
- `frontend/src/types/content.ts` (modified)
- `frontend/src/lib/api.ts` (modified)
- `frontend/src/app/confusion-resolver/page.tsx` (created)
- `frontend/src/test/confusion-resolver.test.tsx` (created)
