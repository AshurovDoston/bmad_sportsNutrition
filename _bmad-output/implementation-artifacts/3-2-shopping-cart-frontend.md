# Story 3.2: Shopping Cart Frontend

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to add products to my cart, adjust quantities, and view my cart summary — whether I'm a guest or logged in,
so that I can build my order at my own pace and pick up where I left off.

## Acceptance Criteria

1. **Given** any product card on the listing page or the product detail page, **When** "Add to Cart" is clicked, **Then** the item is added to the Zustand cart store (guest) or POSTed to `/api/v1/cart/items/` (registered user) and a brief confirmation is shown

2. **Given** the `/cart` page, **When** it loads, **Then** all cart items are displayed with product name, image, unit price, quantity selector, line total, and a remove button; the cart subtotal and estimated delivery are shown at the bottom

3. **Given** a quantity selector in the cart, **When** the value is changed, **Then** the quantity is updated in Zustand (guest) or via `PATCH /api/v1/cart/items/{id}/` (registered) and the subtotal recalculates immediately

4. **Given** a remove button on a cart item, **When** clicked, **Then** the item is removed from the Zustand store (guest) or via `DELETE /api/v1/cart/items/{id}/` (registered)

5. **Given** a guest user with items in their Zustand cart, **When** they log in, **Then** `POST /api/v1/cart/merge/` is called automatically, the server returns the merged cart, and the Zustand store is replaced with the merged server cart

6. **Given** a registered user's cart, **When** they close the browser and return later, **Then** their cart items are restored from the server via `GET /api/v1/cart/` on next load

7. **Given** an empty cart, **When** the cart page renders, **Then** an empty state with a "Continue Shopping" link to `/products` is shown

## Tasks / Subtasks

- [x] Task 1: Add cart types to `frontend/src/types/order.ts` (AC: 1, 2, 3, 4, 5, 6)
  - [x] Keep existing `OrderItem` and `Order` interfaces — only APPEND new types
  - [x] Add `GuestCartItem`, `ServerCartItemProduct`, `ServerCartItem`, `ServerCart` (exact definitions in Dev Notes)

- [x] Task 2: Add CART_ENDPOINTS and cart API functions to `frontend/src/lib/api.ts` (AC: 1, 3, 4, 5, 6)
  - [x] Add `import type { ServerCart } from '@/types/order'` to the imports block
  - [x] Add `CART_ENDPOINTS` const after `PRODUCT_ENDPOINTS`
  - [x] Add `getServerCart`, `addServerCartItem`, `updateServerCartItem`, `removeServerCartItem`, `mergeServerCart` functions
  - [x] All cart functions use `apiFetch` (not raw `fetch`) — auth token is sent automatically

- [x] Task 3: Rewrite `frontend/src/store/cart.ts` (AC: 1, 3, 4, 5, 6)
  - [x] Use Zustand v5 double-invocation with persist: `create<CartStore>()(persist(...))`
  - [x] `partialize: (state) => ({ guestItems: state.guestItems })` — only guest items persisted to localStorage
  - [x] `serverCart` and `isLoading` are NOT in partialize — they use initial values on hydration
  - [x] Implement `addItem` with auth-aware dual mode (see full implementation in Dev Notes)
  - [x] Implement guest actions: `updateGuestQuantity`, `removeGuestItem`
  - [x] Implement server actions: `fetchServerCart`, `updateServerQuantity`, `removeServerItem`, `mergeGuestCart`
  - [x] Implement `clearCart` and `itemCount` getter

- [x] Task 4: Update `frontend/src/components/features/products/product-card.tsx` (AC: 1)
  - [x] Change `onClick={() => addItem(product.id)}` → async handler that calls `addItem(product)`
  - [x] Add local `added: boolean` state; set to `true` after `await addItem(product)`, reset after 2 seconds
  - [x] Button text: `added ? 'Added!' : (product.is_in_stock ? 'Add to Cart' : 'Out of Stock')`

- [x] Task 5: Update `frontend/src/components/features/products/product-detail.tsx` (AC: 1)
  - [x] Same signature change: `addItem(product)` not `addItem(product.id)`
  - [x] Same `added` state and 2-second confirmation feedback as product-card

- [x] Task 6: Update `frontend/src/components/features/auth/login-form.tsx` (AC: 5)
  - [x] Import `useCartStore` from `@/store/cart`
  - [x] Destructure `mergeGuestCart` from store inside component
  - [x] Make `onSuccess` handler `async`; call `await mergeGuestCart()` after `setAuth(...)`, before `router.push(next)`

- [x] Task 7: Create `frontend/src/components/features/cart/cart-item-row.tsx` (AC: 2, 3, 4)
  - [x] `'use client'` — has event handlers
  - [x] Props interface defined in Dev Notes
  - [x] Quantity control: `−` button / number display / `+` button (not a raw `<input type="number">`)
  - [x] Disable `−` button when `quantity === 1` — clicking it at 1 calls `onRemove()`
  - [x] Product image: `<Image fill>` inside a relative-positioned container (same pattern as product-card.tsx:20-33)

- [x] Task 8: Create `frontend/src/components/features/cart/cart-summary.tsx` (AC: 2)
  - [x] Props: `subtotal: string`
  - [x] Show subtotal as formatted price
  - [x] Show "Estimated delivery: {DELIVERY_TIME_HOURS} hours" — import `DELIVERY_TIME_HOURS` from `@/lib/constants`
  - [x] "Proceed to Checkout" — `Link` to `/checkout` styled as a primary button

- [x] Task 9: Create `frontend/src/app/(shop)/cart/page.tsx` (AC: 2, 3, 4, 6, 7)
  - [x] `'use client'` (architecture: cart/checkout are client-side only)
  - [x] `useEffect`: if authenticated → call `fetchServerCart()` on mount
  - [x] Registered mode: map over `serverCart.items`, render `CartItemRow`, wire `updateServerQuantity`/`removeServerItem`
  - [x] Guest mode: map over `guestItems`, compute `linePrice` = `(parseFloat(price) * qty).toFixed(2)`, wire `updateGuestQuantity`/`removeGuestItem`
  - [x] Loading state while `isLoading`: show skeleton or spinner
  - [x] Empty state when 0 items and not loading (AC: 7)
  - [x] `CartSummary` at bottom; subtotal = `serverCart.subtotal` (registered) or computed from guestItems (guest)

## Dev Notes

### 🚨 AGENTS.md REQUIREMENT — Read Next.js Docs First
`frontend/CLAUDE.md` points to `frontend/AGENTS.md` which requires: **"Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."** This Next.js version has breaking changes. Specifically check `'use client'` rules and `useEffect` patterns for client-only pages before implementing the cart page.

### 🚨 CRITICAL: `addItem` Signature Change — Two Callers Must Be Updated
Current store signature:
```typescript
addItem: (productId: number, quantity?: number) => void
```
New required signature:
```typescript
addItem: (product: { id: number; name: string; slug: string; price: string; primary_image_url: string | null }, quantity?: number) => Promise<void>
```
Why: guest cart must store product details for display (no additional API calls from cart page).

**Both callers MUST be updated:**
- `frontend/src/components/features/products/product-card.tsx:70` — `addItem(product.id)` → `addItem(product)`
- `frontend/src/components/features/products/product-detail.tsx:109` — `addItem(product.id)` → `addItem(product)`

Both components already have the full product object in scope — no new props needed.

### 🚨 Type Definitions — Append to `frontend/src/types/order.ts`
Do NOT modify existing `OrderItem` or `Order`. Append:
```typescript
export interface GuestCartItem {
  productId: number
  productName: string
  productSlug: string
  productPrice: string         // Decimal string: "29.99" — matches API format
  productImageUrl: string | null
  quantity: number
}

export interface ServerCartItemProduct {
  id: number
  name: string
  slug: string
  price: string
  primary_image_url: string | null
}

export interface ServerCartItem {
  id: number                   // CartItem.id on Django — used for PATCH /cart/items/{id}/
  product: ServerCartItemProduct
  quantity: number
  line_price: string           // Decimal string: "59.98"
}

export interface ServerCart {
  id: number
  items: ServerCartItem[]
  subtotal: string             // Decimal string: "59.98"
}
```

### 🚨 API Functions — Append to `frontend/src/lib/api.ts`
First add to the import block at the top:
```typescript
import type { ServerCart } from '@/types/order'
```
Then add after the existing `PRODUCT_ENDPOINTS` block:
```typescript
export const CART_ENDPOINTS = {
  CART: '/api/v1/cart/',
  ITEMS: '/api/v1/cart/items/',
  ITEM: (id: number) => `/api/v1/cart/items/${id}/`,
  MERGE: '/api/v1/cart/merge/',
} as const

export async function getServerCart(): Promise<ServerCart> {
  const res = await apiFetch(CART_ENDPOINTS.CART)
  if (!res.ok) throw new Error('Failed to fetch cart')
  return res.json() as Promise<ServerCart>
}

export async function addServerCartItem(productId: number, quantity: number): Promise<ServerCart> {
  const res = await apiFetch(CART_ENDPOINTS.ITEMS, {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity }),
  })
  if (!res.ok) throw new Error('Failed to add item')
  return res.json() as Promise<ServerCart>
}

export async function updateServerCartItem(itemId: number, quantity: number): Promise<ServerCart> {
  const res = await apiFetch(CART_ENDPOINTS.ITEM(itemId), {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  })
  if (!res.ok) throw new Error('Failed to update item')
  return res.json() as Promise<ServerCart>
}

export async function removeServerCartItem(itemId: number): Promise<ServerCart> {
  const res = await apiFetch(CART_ENDPOINTS.ITEM(itemId), { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to remove item')
  return res.json() as Promise<ServerCart>
}

export async function mergeServerCart(
  items: Array<{ product_id: number; quantity: number }>
): Promise<ServerCart> {
  const res = await apiFetch(CART_ENDPOINTS.MERGE, {
    method: 'POST',
    body: JSON.stringify(items),
  })
  if (!res.ok) throw new Error('Failed to merge cart')
  return res.json() as Promise<ServerCart>
}
```

### 🚨 Complete Store Rewrite — `frontend/src/store/cart.ts`
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from '@/store/auth'
import {
  getServerCart,
  addServerCartItem,
  updateServerCartItem,
  removeServerCartItem,
  mergeServerCart,
} from '@/lib/api'
import type { GuestCartItem, ServerCart } from '@/types/order'

interface CartStore {
  guestItems: GuestCartItem[]
  serverCart: ServerCart | null
  isLoading: boolean
  addItem: (
    product: { id: number; name: string; slug: string; price: string; primary_image_url: string | null },
    quantity?: number
  ) => Promise<void>
  updateGuestQuantity: (productId: number, quantity: number) => void
  removeGuestItem: (productId: number) => void
  fetchServerCart: () => Promise<void>
  updateServerQuantity: (itemId: number, quantity: number) => Promise<void>
  removeServerItem: (itemId: number) => Promise<void>
  mergeGuestCart: () => Promise<void>
  clearCart: () => void
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      guestItems: [],
      serverCart: null,
      isLoading: false,

      addItem: async (product, quantity = 1) => {
        if (useAuthStore.getState().isAuthenticated()) {
          set({ isLoading: true })
          try {
            const cart = await addServerCartItem(product.id, quantity)
            set({ serverCart: cart })
          } finally {
            set({ isLoading: false })
          }
        } else {
          set((state) => {
            const existing = state.guestItems.find((i) => i.productId === product.id)
            if (existing) {
              return {
                guestItems: state.guestItems.map((i) =>
                  i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
                ),
              }
            }
            return {
              guestItems: [
                ...state.guestItems,
                {
                  productId: product.id,
                  productName: product.name,
                  productSlug: product.slug,
                  productPrice: product.price,
                  productImageUrl: product.primary_image_url,
                  quantity,
                },
              ],
            }
          })
        }
      },

      updateGuestQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeGuestItem(productId)
          return
        }
        set((state) => ({
          guestItems: state.guestItems.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }))
      },

      removeGuestItem: (productId) =>
        set((state) => ({
          guestItems: state.guestItems.filter((i) => i.productId !== productId),
        })),

      fetchServerCart: async () => {
        set({ isLoading: true })
        try {
          const cart = await getServerCart()
          set({ serverCart: cart })
        } finally {
          set({ isLoading: false })
        }
      },

      updateServerQuantity: async (itemId, quantity) => {
        set({ isLoading: true })
        try {
          const cart = await updateServerCartItem(itemId, quantity)
          set({ serverCart: cart })
        } finally {
          set({ isLoading: false })
        }
      },

      removeServerItem: async (itemId) => {
        set({ isLoading: true })
        try {
          const cart = await removeServerCartItem(itemId)
          set({ serverCart: cart })
        } finally {
          set({ isLoading: false })
        }
      },

      mergeGuestCart: async () => {
        const { guestItems } = get()
        const payload = guestItems.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        }))
        try {
          // mergeServerCart([]) is valid — backend returns current server cart unchanged
          const cart = await mergeServerCart(payload)
          set({ serverCart: cart, guestItems: [] })
        } catch {
          // Merge failed — clear guest items; cart page will re-fetch on mount
          set({ guestItems: [] })
        }
      },

      clearCart: () => set({ guestItems: [], serverCart: null }),

      itemCount: () => {
        const { serverCart, guestItems } = get()
        if (serverCart) return serverCart.items.reduce((s, i) => s + i.quantity, 0)
        return guestItems.reduce((s, i) => s + i.quantity, 0)
      },
    }),
    {
      name: 'sports-nutrition-cart',
      partialize: (state) => ({ guestItems: state.guestItems }),
      // Only persist guest items to localStorage.
      // serverCart is always fetched fresh from the API for registered users.
    }
  )
)
```

**Zustand v5 double-invocation pattern:** `create<CartStore>()( persist(...) )` — the outer `()` is required in v5 when using middleware. Missing it causes a TypeScript error.

**Why no `'use client'` in store file:** Store files are JavaScript modules — they don't need the directive. Client components that import the store are already marked `'use client'`. The `persist` middleware handles SSR safely (it checks `typeof window !== 'undefined'` internally).

### 🚨 Login Form — `frontend/src/components/features/auth/login-form.tsx`
Add import (line 7, after existing imports):
```typescript
import { useCartStore } from '@/store/cart'
```
Add inside `LoginForm` component body (after `const { setAuth } = useAuthStore()`):
```typescript
const mergeGuestCart = useCartStore((state) => state.mergeGuestCart)
```
Update `onSuccess` (currently line 31-34):
```typescript
// BEFORE:
onSuccess: (data) => {
  setAuth(data.access_token, null)
  const next = searchParams.get('next') || '/'
  router.push(next)
},

// AFTER:
onSuccess: async (data) => {
  setAuth(data.access_token, null)
  await mergeGuestCart()   // POST guest items → server; replaces serverCart; clears guestItems
  const next = searchParams.get('next') || '/'
  router.push(next)
},
```
**Why await before router.push:** The cart page calls `fetchServerCart()` on mount. If navigation races with the merge, the cart page would show the server cart before guest items are merged.

**Note:** `register-form.tsx` also logs the user in after registration. If a guest registers while having cart items, those won't be merged. This is a known limitation — acceptable for demo scope; address in a future story if needed.

### 🚨 CartItemRow Component — `frontend/src/components/features/cart/cart-item-row.tsx`
```typescript
'use client'

import Image from 'next/image'

interface CartItemRowProps {
  name: string
  imageUrl: string | null
  price: string
  quantity: number
  linePrice: string
  onQuantityChange: (q: number) => void
  onRemove: () => void
}
```
Quantity control pattern (no raw `<input type="number">` — avoids empty/decimal edge cases):
```tsx
<button onClick={() => quantity === 1 ? onRemove() : onQuantityChange(quantity - 1)}>−</button>
<span>{quantity}</span>
<button onClick={() => onQuantityChange(quantity + 1)}>+</button>
```
Image: same `<Image fill className="object-cover">` pattern as `product-card.tsx:22-33`. Container must be `position: relative` with explicit dimensions.

### 🚨 CartSummary Component — `frontend/src/components/features/cart/cart-summary.tsx`
```typescript
import Link from 'next/link'
import { DELIVERY_TIME_HOURS } from '@/lib/constants'

interface CartSummaryProps {
  subtotal: string
}
```
No `'use client'` needed — no hooks or event handlers (Link and static content only).
Content: subtotal display, delivery time, Link to `/checkout`.

### 🚨 Cart Page — `frontend/src/app/(shop)/cart/page.tsx`
```typescript
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { CartItemRow } from '@/components/features/cart/cart-item-row'
import { CartSummary } from '@/components/features/cart/cart-summary'
```
Key logic:
```typescript
const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
const {
  serverCart, guestItems, isLoading,
  fetchServerCart, updateServerQuantity, removeServerItem,
  updateGuestQuantity, removeGuestItem,
} = useCartStore()

useEffect(() => {
  if (isAuthenticated) fetchServerCart()
}, [isAuthenticated]) // fetchServerCart is stable (defined inside persist store)
```
Guest subtotal computation:
```typescript
const guestSubtotal = guestItems
  .reduce((sum, i) => sum + parseFloat(i.productPrice) * i.quantity, 0)
  .toFixed(2)
```
Guest line price per item:
```typescript
linePrice={(parseFloat(item.productPrice) * item.quantity).toFixed(2)}
```

Empty state (when no items and not loading):
```tsx
<div className="py-16 text-center">
  <p className="text-zinc-500 dark:text-zinc-400">Your cart is empty.</p>
  <Link href="/products" className="mt-4 inline-block underline text-zinc-700 dark:text-zinc-300">
    Continue Shopping
  </Link>
</div>
```

### 🚨 Directory Check Before Creating Files
Verify `frontend/src/app/(shop)/` exists before creating cart page (it does — contains `products/`).
Verify `frontend/src/components/features/cart/` does NOT exist — must create the directory.

### 🚨 No Header / Cart Badge
The root `layout.tsx` has no Header component. Do NOT create one or add a cart badge counter in this story. The `itemCount()` getter is provided on the store for future use (Story 4+ or a separate layout story).

### Backend API Reference (All Implemented in Story 3.1)
```
GET  /api/v1/cart/                    → ServerCart
POST /api/v1/cart/items/              body: {product_id, quantity} → ServerCart
PATCH /api/v1/cart/items/{id}/        body: {quantity} → ServerCart
DELETE /api/v1/cart/items/{id}/       → ServerCart
POST /api/v1/cart/merge/              body: [{product_id, quantity}, ...] → ServerCart
```
All endpoints require `Authorization: Bearer <token>` — `apiFetch` handles this automatically.
Empty merge body `[]` is valid — backend returns current cart unchanged.

### Project Structure Notes
```
frontend/src/
  types/order.ts                        UPDATE — append 4 new interfaces
  lib/api.ts                            UPDATE — append CART_ENDPOINTS + 5 functions
  store/cart.ts                         UPDATE — complete rewrite
  components/features/products/
    product-card.tsx                    UPDATE — addItem signature + added feedback
    product-detail.tsx                  UPDATE — same
  components/features/auth/
    login-form.tsx                      UPDATE — mergeGuestCart on login
  components/features/cart/            CREATE directory
    cart-item-row.tsx                   CREATE
    cart-summary.tsx                    CREATE
  app/(shop)/cart/
    page.tsx                            CREATE
```

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — Acceptance criteria verbatim
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — TanStack Query + Zustand; Cart = client-side only
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — Guest cart = Zustand + localStorage; merge on login
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Auth token in Zustand memory; cart merge flow
- [Source: _bmad-output/planning-artifacts/architecture.md#Gap Analysis] — Guest cart uses Zustand + localStorage (NOT Django sessions)
- [Source: _bmad-output/implementation-artifacts/3-1-shopping-cart-backend-api.md#Dev Notes] — API response shapes, URL patterns, auth model
- [Source: frontend/src/store/cart.ts:1-27] — Current store; full rewrite required
- [Source: frontend/src/store/auth.ts] — `isAuthenticated()` returns `accessToken !== null`; `setAuth` is synchronous
- [Source: frontend/src/lib/api.ts:20-45] — `apiFetch` attaches Bearer token; handles 401 refresh
- [Source: frontend/src/lib/api.ts:6-18] — Existing AUTH_ENDPOINTS and PRODUCT_ENDPOINTS pattern to follow
- [Source: frontend/src/components/features/products/product-card.tsx:13-79] — Full component; addItem call at line 70
- [Source: frontend/src/components/features/products/product-detail.tsx:20-159] — Full component; addItem call at line 109; Image pattern at lines 29-64
- [Source: frontend/src/components/features/auth/login-form.tsx:19-48] — Mutation; onSuccess at line 31
- [Source: frontend/src/lib/constants.ts] — `DELIVERY_TIME_HOURS = 2`
- [Source: frontend/src/types/product.ts] — `ProductListItem` has `id, name, slug, price, primary_image_url` — matches addItem signature
- [Source: frontend/AGENTS.md] — Read `node_modules/next/dist/docs/` before writing Next.js code
- [Source: frontend/package.json] — zustand ^5.0.13 | @tanstack/react-query ^5.100.9 | next 16.2.4

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Implemented full shopping cart frontend with dual guest/registered user mode
- Rewrote `store/cart.ts` with Zustand v5 persist middleware — only `guestItems` are persisted to localStorage; `serverCart` is always fetched fresh
- `addItem` now accepts a full product object (not just id) so guest cart can display product details without additional API calls
- Both `product-card.tsx` and `product-detail.tsx` updated to new async `addItem(product)` signature with 2-second "Added!" confirmation feedback
- Login flow now calls `mergeGuestCart()` before navigating — ensures server cart is populated before cart page mounts
- `CartItemRow` uses button-based quantity control (not `<input type="number">`) to avoid empty/decimal edge cases; decrementing at qty=1 removes the item
- `CartSummary` is a server-renderable component (no `'use client'`); `CartPage` is client-only per architecture requirements
- All 42 pre-existing tests pass with no regressions; TypeScript clean except pre-existing errors in `search-filter.test.tsx`

### File List

- frontend/src/types/order.ts
- frontend/src/lib/api.ts
- frontend/src/store/cart.ts
- frontend/src/components/features/products/product-card.tsx
- frontend/src/components/features/products/product-detail.tsx
- frontend/src/components/features/auth/login-form.tsx
- frontend/src/components/features/cart/cart-item-row.tsx (created)
- frontend/src/components/features/cart/cart-summary.tsx (created)
- frontend/src/app/(shop)/cart/page.tsx (created)

## Change Log

- 2026-05-05: Story 3.2 created — comprehensive shopping cart frontend implementation guide
- 2026-05-05: Story 3.2 implemented — shopping cart frontend complete; all 9 tasks done; status → review
