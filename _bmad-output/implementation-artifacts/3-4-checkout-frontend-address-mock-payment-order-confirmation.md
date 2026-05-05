# Story 3.4: Checkout Frontend — Address, Mock Payment & Order Confirmation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to enter my delivery address, complete a mock payment, and receive an order confirmation — whether I'm a guest or a registered user,
so that I can complete my purchase quickly and confidently.

## Acceptance Criteria

1. **Given** the `/checkout` page, **When** a registered user arrives, **Then** their saved delivery address is pre-filled from their profile; they can edit it before confirming

2. **Given** the `/checkout` page, **When** a guest arrives, **Then** they can enter their name, phone, and delivery address without being forced to create an account

3. **Given** the address step is complete, **When** the user proceeds to payment, **Then** a mock payment form is shown with card number, expiry, and CVV fields — no real payment SDK is connected; any non-empty input passes validation

4. **Given** the mock payment form is submitted with valid-looking input, **When** the form is processed, **Then** `POST /api/v1/orders/` is called; on success the user is redirected to `/checkout/confirmation?order={order_number}`

5. **Given** the `/checkout/confirmation` page, **When** it loads, **Then** the order number, itemized product list, delivery address, subtotal, and "Your order is confirmed" message are displayed

6. **Given** the confirmation page, **When** a guest user is viewing it, **Then** a "Create an account to track your order" prompt is shown; submitting the form registers them and links the existing order to their new account

7. **Given** a checkout API error (e.g., out-of-stock product), **When** the error is returned, **Then** a user-friendly inline message is shown and the user stays on the checkout page with their data preserved

## Tasks / Subtasks

- [ ] Task 1: Extend `frontend/src/types/order.ts` with order response types (AC: 4, 5, 6)
  - [ ] ADD `OrderItemResponse` interface (do NOT remove or rename existing `OrderItem` — it may be used by story 3.5)
  - [ ] ADD `OrderResponse` interface matching the exact `OrderResponseSerializer` shape
  - [ ] ADD `PendingGuestOrder` interface for client-side guest checkout storage

- [ ] Task 2: Add order API functions to `frontend/src/lib/api.ts` (AC: 4)
  - [ ] ADD `ORDER_ENDPOINTS` const object (after `CART_ENDPOINTS`)
  - [ ] ADD `createOrder` async function using `apiFetch` — NOT raw fetch
  - [ ] ADD `loginUser` helper function for the guest auto-login step (if not already present)

- [ ] Task 3: Create `frontend/src/components/features/checkout/checkout-form.tsx` (AC: 1, 2)
  - [ ] `'use client'` directive
  - [ ] Props: `{ isGuest: boolean; defaultAddress?: string | null; onSubmit: (data: CheckoutFormData) => void; isLoading: boolean }`
  - [ ] Registered user: shows only `delivery_address` field, pre-filled with `defaultAddress`
  - [ ] Guest: shows `name`, `phone`, `delivery_address` fields
  - [ ] "Continue to Payment" button — disabled while `isLoading`
  - [ ] All field validation: non-empty strings; `delivery_address` min 5 chars

- [ ] Task 4: Create `frontend/src/components/features/checkout/mock-payment-form.tsx` (AC: 3, 4, 7)
  - [ ] `'use client'` directive
  - [ ] Props: `{ onSubmit: (data: MockPaymentData) => void; onBack: () => void; isLoading: boolean; error?: string | null }`
  - [ ] Fields: `card_number` (text), `expiry` (text, placeholder `MM/YY`), `cvv` (text)
  - [ ] Validation: all three fields must be non-empty — no Luhn check or format check needed
  - [ ] Show `error` prop as an inline error banner (red) if present (AC: 7)
  - [ ] "Place Order" button — disabled while `isLoading`, shows spinner
  - [ ] "← Back" button calls `onBack` to return to address step

- [ ] Task 5: Create `frontend/src/components/features/checkout/order-summary.tsx` (AC: 5)
  - [ ] Props: `{ order: OrderResponse }`
  - [ ] Display: order number, each item (name × qty at price = line_price), delivery address, subtotal
  - [ ] "Your order is confirmed" heading in green

- [ ] Task 6: Create `frontend/src/app/(shop)/checkout/page.tsx` (AC: 1, 2, 3, 4, 7)
  - [ ] `'use client'` — checkout is client-side only per architecture
  - [ ] Local state: `step: 'address' | 'payment'`, `checkoutData: CheckoutFormData | null`, `isLoading: boolean`, `paymentError: string | null`
  - [ ] Read `user` and `isAuthenticated` from `useAuthStore`
  - [ ] Read cart items from `useCartStore` — `serverCart.items` (registered) or `guestItems` (guest)
  - [ ] If cart is empty on mount: redirect to `/cart` (empty cart → cannot checkout)
  - [ ] Step 1 (address): render `<CheckoutForm>` — pre-fill `user.delivery_address` for registered users
  - [ ] Step 2 (payment): render `<MockPaymentForm>` with `onBack` returning to step 1
  - [ ] On payment form submit: call `submitOrder()` (see Dev Notes for full flow)
  - [ ] After success: store order in `sessionStorage` under key `'sports-nutrition-last-order'`, then `router.push('/checkout/confirmation?order=' + order.order_number)`
  - [ ] Call `clearCart()` from cart store after successful order creation

- [ ] Task 7: Create `frontend/src/app/(shop)/checkout/confirmation/page.tsx` (AC: 5, 6)
  - [ ] `'use client'`
  - [ ] Wrap in `<Suspense>` because this page uses `useSearchParams()` — Next.js App Router REQUIRES `Suspense` for `useSearchParams`
  - [ ] Read `order_number` from URL: `const searchParams = useSearchParams(); const orderNumber = searchParams.get('order')`
  - [ ] On mount: load `OrderResponse` from `sessionStorage` key `'sports-nutrition-last-order'`; if missing, show generic "Order `{orderNumber}` confirmed" message
  - [ ] Render `<OrderSummary order={order}>` when order data is available
  - [ ] `isAuthenticated` check via `useAuthStore`:
    - If authenticated: show "Continue Shopping" link + link to `/account/orders` (story 3.5 will implement this page; link is fine now)
    - If not authenticated (guest): show registration prompt (Task 8 component)
  - [ ] Clear `sessionStorage` key after reading (one-time display)

- [ ] Task 8: Create `frontend/src/components/features/checkout/guest-register-prompt.tsx` (AC: 6)
  - [ ] `'use client'`
  - [ ] Props: `{ pendingOrderItems: Array<{product_id: number, quantity: number}>; deliveryAddress: string; subtotal: string }`
  - [ ] Shows: "Create an account to track your order" heading
  - [ ] Fields: `name`, `phone`, `password`
  - [ ] On submit: call `POST /api/v1/auth/register/` → auto-login → `POST /api/v1/orders/` with the pending order payload → set auth in Zustand → update sessionStorage with real `OrderResponse` — the page re-renders without the prompt since `isAuthenticated` is now true
  - [ ] Handle `phone_already_registered` 400 error: show inline message "This phone is already registered — please log in"
  - [ ] After successful registration + order creation: call `clearCart()`

## Dev Notes

### 🚨 Guest Checkout: How `POST /api/v1/orders/` Is Called Without Pre-existing Auth

The backend `OrderCreateView` requires `IsAuthenticated`. Guests must be registered + logged in before calling it. The UX hides this complexity:

**Registered user flow:**
```
CheckoutPage → address form → payment form → POST /api/v1/orders/ → confirmation page
```

**Guest flow — ORDER CREATION IS DEFERRED:**
```
CheckoutPage → address form → payment form → store pendingOrder in sessionStorage → redirect to confirmation
ConfirmationPage → shows pendingOrder from sessionStorage → shows GuestRegisterPrompt
GuestRegisterPrompt → register + auto-login + POST /api/v1/orders/ → update sessionStorage → page re-renders as authenticated user
```

The guest never sees the `POST /api/v1/orders/` happen explicitly — it fires during the registration prompt submission. This satisfies "complete purchase without creating account up-front" (they don't go to `/register` first) while still linking the order to an account.

### 🚨 sessionStorage Schema

**Key:** `'sports-nutrition-last-order'`

For registered users (set on checkout page after POST /api/v1/orders/):
```json
{
  "type": "confirmed",
  "order": { /* full OrderResponse object */ }
}
```

For guests (set on checkout page BEFORE registration):
```json
{
  "type": "pending",
  "pendingOrder": {
    "delivery_address": "123 Tashkent St",
    "items": [{ "product_id": 5, "quantity": 2 }],
    "subtotal": "300000.00"
  },
  "guestData": {
    "name": "Ali",
    "phone": "998901234567"
  }
}
```

After `GuestRegisterPrompt` succeeds, update `sessionStorage` entry to `{ "type": "confirmed", "order": { /* real OrderResponse */ } }`.

### 🚨 `submitOrder()` Implementation in CheckoutPage

```typescript
async function submitOrder(paymentData: MockPaymentData) {
  if (!checkoutData) return
  setIsLoading(true)
  setPaymentError(null)

  const isAuth = useAuthStore.getState().isAuthenticated()
  const { serverCart, guestItems } = useCartStore.getState()

  // Build items payload from cart
  const items: Array<{product_id: number; quantity: number}> = isAuth
    ? (serverCart?.items ?? []).map(i => ({ product_id: i.product.id, quantity: i.quantity }))
    : guestItems.map(i => ({ product_id: i.productId, quantity: i.quantity }))

  if (isAuth) {
    // Registered user: call API directly
    try {
      const order = await createOrder({ delivery_address: checkoutData.delivery_address, items })
      clearCart()
      sessionStorage.setItem('sports-nutrition-last-order', JSON.stringify({ type: 'confirmed', order }))
      router.push(`/checkout/confirmation?order=${order.order_number}`)
    } catch (err: unknown) {
      const apiError = err as ApiError
      if (apiError?.code === 'product_out_of_stock') {
        setPaymentError('One or more items in your cart are out of stock. Please review your cart.')
      } else {
        setPaymentError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  } else {
    // Guest: compute client-side subtotal and defer to confirmation page
    const guestSubtotal = guestItems
      .reduce((sum, i) => sum + parseFloat(i.productPrice) * i.quantity, 0)
      .toFixed(2)
    sessionStorage.setItem('sports-nutrition-last-order', JSON.stringify({
      type: 'pending',
      pendingOrder: { delivery_address: checkoutData.delivery_address, items, subtotal: guestSubtotal },
      guestData: { name: checkoutData.name, phone: checkoutData.phone },
    }))
    // Generate a temporary display order number for the URL
    const tempOrderNumber = `PENDING-${Date.now()}`
    router.push(`/checkout/confirmation?order=${tempOrderNumber}`)
    setIsLoading(false)
  }
}
```

### 🚨 `createOrder` in `lib/api.ts`

```typescript
export const ORDER_ENDPOINTS = {
  ORDERS: '/api/v1/orders/',
} as const

export async function createOrder(payload: {
  delivery_address: string
  items: Array<{ product_id: number; quantity: number }>
}): Promise<OrderResponse> {
  const res = await apiFetch(ORDER_ENDPOINTS.ORDERS, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json()
    throw data  // throw the error object so callers get { error, code, details }
  }
  return res.json() as Promise<OrderResponse>
}
```

### 🚨 New Types to ADD to `frontend/src/types/order.ts`

Append BELOW existing interfaces — do NOT remove `Order` or `OrderItem`:

```typescript
// Matches backend OrderItemResponseSerializer
export interface OrderItemResponse {
  product_id: number
  product_name: string
  product_price: string
  quantity: number
  line_price: string
}

// Matches backend OrderResponseSerializer (POST /api/v1/orders/ response)
export interface OrderResponse {
  order_id: number
  order_number: string
  items: OrderItemResponse[]
  subtotal: string
  delivery_address: string
  status: 'pending' | 'confirmed' | 'dispatched' | 'delivered'
  created_at: string
}

// Client-side pending guest order (not from backend yet)
export interface PendingGuestOrder {
  delivery_address: string
  items: Array<{ product_id: number; quantity: number }>
  subtotal: string
}
```

Import `OrderResponse` in `lib/api.ts`:
```typescript
import type { ..., OrderResponse } from '@/types/order'
```

### 🚨 `useSearchParams()` Requires Suspense in Next.js App Router

The confirmation page uses `useSearchParams()`. In Next.js App Router (Next.js 16), any component that calls `useSearchParams()` must be wrapped in a `<Suspense>` boundary, or the build will fail.

Pattern to use in `confirmation/page.tsx`:

```tsx
import { Suspense } from 'react'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  // ... rest of component
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-12 text-center">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  )
}
```

### 🚨 Registered User: Pre-fill Delivery Address

`user.delivery_address` is already in the Zustand auth store (type: `User.delivery_address: string | null`). Read it directly from the store — do NOT call `GET /api/v1/auth/profile/` in the checkout page (user was loaded at login).

```typescript
const user = useAuthStore((state) => state.user)
// Pass to CheckoutForm:
<CheckoutForm defaultAddress={user?.delivery_address} ... />
```

### 🚨 Guest GuestRegisterPrompt: Register + Auto-Login + Create Order

```typescript
async function handleGuestRegister(formData: { name: string; phone: string; password: string }) {
  setIsLoading(true)
  setError(null)
  try {
    // Step 1: Register
    const regRes = await fetch(apiUrl(AUTH_ENDPOINTS.REGISTER), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formData.name, phone: formData.phone, password: formData.password }),
    })
    if (!regRes.ok) {
      const err = await regRes.json()
      if (err.details?.phone) setError('This phone is already registered — please log in.')
      else setError('Registration failed. Please try again.')
      return
    }

    // Step 2: Login to get token
    const loginRes = await fetch(apiUrl(AUTH_ENDPOINTS.LOGIN), {
      method: 'POST',
      credentials: 'include',  // sets httpOnly refresh_token cookie
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: formData.phone, password: formData.password }),
    })
    if (!loginRes.ok) { setError('Login after registration failed.'); return }
    const loginData = await loginRes.json() as { access_token: string; user: User }
    useAuthStore.getState().setAuth(loginData.access_token, loginData.user)

    // Step 3: Create order using the pending order data
    const order = await createOrder({ delivery_address: props.deliveryAddress, items: props.pendingOrderItems })

    // Step 4: Update sessionStorage with confirmed order
    sessionStorage.setItem('sports-nutrition-last-order', JSON.stringify({ type: 'confirmed', order }))
    
    // Step 5: Clear cart
    useCartStore.getState().clearCart()

    // Component re-renders automatically since isAuthenticated is now true → hides prompt, shows account link
  } catch {
    setError('Something went wrong. Please try again.')
  } finally {
    setIsLoading(false)
  }
}
```

Note: `apiUrl`, `AUTH_ENDPOINTS`, `createOrder`, `useAuthStore`, `useCartStore` are all importable from `@/lib/api` and `@/store/auth`/`@/store/cart`. `User` type from `@/types/user`. The login response shape matches `{ access_token: string; user: { id, name, phone, is_staff, delivery_address } }` — verify against `LoginView` in `backend/accounts/views.py`.

### 🚨 Check Login Response Shape

Looking at `backend/accounts/views.py` `LoginView.post()` — verify it returns `user` data. If it only returns `access_token` (no user object), the `setAuth(token, user)` call needs to either: (a) call `GET /api/v1/auth/profile/` separately to get user data, or (b) pass `null` for user and fetch profile lazily. Check the actual LoginView response — do not assume.

### 🚨 Empty Cart Guard on Checkout Page

If the user navigates directly to `/checkout` with an empty cart, redirect them:
```typescript
useEffect(() => {
  const isAuth = isAuthenticated()
  const isEmpty = isAuth ? (serverCart?.items.length ?? 0) === 0 : guestItems.length === 0
  if (!isEmpty) return  // wait for cart to load
  if (!isLoading) router.replace('/cart')
}, [serverCart, guestItems, isLoading])
```

### 🚨 Cart State on Checkout

The checkout page needs to read cart items to build the order payload. For registered users, `serverCart` must be fetched if null. Call `fetchServerCart()` on mount if `isAuthenticated && !serverCart`.

### 🚨 File Locations and Naming (Architecture Rules)

- All new page files: `frontend/src/app/(shop)/checkout/page.tsx` and `frontend/src/app/(shop)/checkout/confirmation/page.tsx` — these paths already exist in the architecture directory structure (architecture.md lines 443–448)
- All new component files: `frontend/src/components/features/checkout/*.tsx` — the `checkout/` folder has `.gitkeep` placeholder, just add files directly
- File names: `kebab-case.tsx`
- Component names: `PascalCase`
- All API endpoint paths ONLY in `lib/api.ts` — never hardcode in components

### 🚨 Styling Conventions

Match the established Tailwind patterns from cart page and existing components:
- Page wrapper: `className="mx-auto max-w-2xl px-4 py-12"`
- Form inputs: `className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"`
- Primary button: `className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"`
- Error text: `className="text-red-600 text-sm mt-1"`
- Labels: `className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"`

### Previous Story Learnings (from Story 3.3: Checkout & Order Creation Backend)

- `POST /api/v1/orders/` endpoint is fully implemented at `backend/orders/views.py:OrderCreateView`
- Request shape: `{ delivery_address: string, items: [{product_id: int, quantity: int}] }`
- Response 201 shape exactly matches `OrderResponseSerializer` — verified in serializers.py
- `order_id` in response maps to `id` in the DB (source alias in serializer)
- `product_price` and `subtotal` are decimal strings (e.g., `"150000.00"`)
- Stock validation happens inside `transaction.atomic()` — if any item is out of stock, HTTP 400 with `code: "product_out_of_stock"` is returned and no order is created
- Email is sent via console backend for demo — no frontend concern

### Git Intelligence (Recent Commits)

- `a50f7e5` feat: implement checkout and order creation backend — Story 3.3 complete; backend `/api/v1/orders/` is live
- `fbf46d2` feat: Implement Shopping Cart Backend API — Cart endpoints live at `/api/v1/cart/`
- Other commits: frontend patterns (SSR/SSG/client-side), Zustand cart store, TanStack Query usage

### Project Structure Notes

- `frontend/src/app/(shop)/checkout/` and `frontend/src/app/(shop)/checkout/confirmation/` directories need to be CREATED — they don't exist yet (confirmed by directory listing)
- `frontend/src/components/features/checkout/` exists (has `.gitkeep`) — just add component files
- Architecture specifies checkout components: `CheckoutForm`, `MockPaymentForm`, `OrderSummary` (architecture.md line 479)

### Testing Requirements

No test files required for this story (frontend-only, demo project). The dev agent should verify behavior manually by:
1. Checking the checkout page renders correctly for both guest and registered states
2. Verifying the mock payment form shows and submits
3. Confirming the order confirmation page shows the correct data
4. Verifying the guest registration prompt works end-to-end

### References

- Backend order creation endpoint: `backend/orders/views.py:OrderCreateView` (POST /api/v1/orders/)
- Backend order serializers: `backend/orders/serializers.py:OrderResponseSerializer`, `OrderItemResponseSerializer`
- Cart Zustand store: `frontend/src/store/cart.ts` — `clearCart`, `serverCart`, `guestItems`, `fetchServerCart`
- Auth Zustand store: `frontend/src/store/auth.ts` — `user`, `isAuthenticated`, `setAuth`
- API client: `frontend/src/lib/api.ts` — `apiFetch`, `apiUrl`, `AUTH_ENDPOINTS`, `CART_ENDPOINTS`
- Auth helper: `frontend/src/lib/auth.ts` — `refreshAccessToken`
- Order types: `frontend/src/types/order.ts` — existing `GuestCartItem`, `ServerCart`; add `OrderResponse`, `OrderItemResponse`, `PendingGuestOrder`
- User types: `frontend/src/types/user.ts` — `User`, `ApiError`, `LoginResponse`
- Architecture checkout rendering strategy: client-side only [Source: `_bmad-output/planning-artifacts/architecture.md` — Frontend Architecture table]
- Architecture checkout component locations: [Source: `_bmad-output/planning-artifacts/architecture.md` lines 443–448, 479]
- Epic 3 Story 3.4 full AC: [Source: `_bmad-output/planning-artifacts/epics.md` — Story 3.4 section]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
