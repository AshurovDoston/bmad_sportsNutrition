# Story 3.5: Order History & Delivery Status

Status: ready-for-dev

## Story

As a registered user,
I want to view all my past orders and track delivery status,
so that I have a complete purchase record and never need to contact support.

## Acceptance Criteria

1. `/account/orders` — logged-in user sees all past orders: order number, date placed, total, current status (`pending / confirmed / dispatched / delivered`).
2. Click an order → `/account/orders/{id}` — full order: itemized products (name × qty + prices), delivery address, current status.
3. Status "dispatched" → visually highlighted on detail page (distinct color from other statuses).
4. `GET /api/v1/orders/` with valid access token → **only** the authenticated user's own orders are returned; never another user's.
5. `GET /api/v1/orders/{id}/` for another user's order → **404** (not 403 — prevents information leakage that the order exists).
6. Unauthenticated user visiting `/account/orders` → Next.js middleware already redirects to `/login` (middleware covers `/account/:path*`; no code change needed).

## Tasks / Subtasks

- [ ] Task 1: Add `GET` handler to `OrderCreateView` in `backend/orders/views.py` (AC: 4)
  - [ ] Add `get(self, request)` method: `Order.objects.filter(user=request.user).order_by('-created_at')` — serialize with `OrderResponseSerializer(orders, many=True)`
  - [ ] Return `Response(data)` with HTTP 200
  - [ ] No URL change needed — `orders/` already maps to `OrderCreateView`

- [ ] Task 2: Create `OrderDetailView` in `backend/orders/views.py` (AC: 5)
  - [ ] New class `OrderDetailView(APIView)` with `permission_classes = [IsAuthenticated]`
  - [ ] `get(self, request, pk)`: use `get_object_or_404(Order, pk=pk, user=request.user)` — this naturally returns 404 for both missing AND wrong-user cases (no info leakage)
  - [ ] Return `Response(OrderResponseSerializer(order).data)`

- [ ] Task 3: Update `backend/orders/urls.py` (AC: 2, 5)
  - [ ] Add `OrderDetailView` to imports
  - [ ] Add `path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail')`

- [ ] Task 4: Write backend tests in `backend/orders/tests.py` (AC: 4, 5)
  - [ ] `test_get_orders_requires_auth` → 401
  - [ ] `test_get_orders_returns_only_own_orders` — create 2 users each with 1 order; user1 sees only user1's order
  - [ ] `test_get_orders_empty_list` → 200 with `[]`
  - [ ] `test_get_order_detail_requires_auth` → 401
  - [ ] `test_get_order_detail_returns_own_order` → 200 with correct fields
  - [ ] `test_get_order_detail_other_users_order_returns_404` — create order for user2, user1 requests it → 404

- [ ] Task 5: Update `frontend/src/lib/api.ts` — add order list/detail functions (AC: 1, 2)
  - [ ] Extend `ORDER_ENDPOINTS` with `ORDER_DETAIL: (id: number) => \`/api/v1/orders/${id}/\``
  - [ ] Add `getOrders(): Promise<OrderResponse[]>` using `apiFetch`
  - [ ] Add `getOrderDetail(id: number): Promise<OrderResponse>` using `apiFetch`

- [ ] Task 6: Create `frontend/src/app/account/orders/page.tsx` — order list page (AC: 1, 6)
  - [ ] `'use client'` directive
  - [ ] TanStack Query: `useQuery({ queryKey: ['orders'], queryFn: getOrders })`
  - [ ] Skeleton on `isLoading`; error message on `isError`
  - [ ] Each order row: order number, formatted date, subtotal, status badge
  - [ ] Each row wraps in `<Link href={/account/orders/${order.order_id}}>` (use `order_id` — numeric DB id)
  - [ ] Empty state: "No orders yet. Start shopping!" with link to `/products`

- [ ] Task 7: Create `frontend/src/app/account/orders/[id]/page.tsx` — order detail page (AC: 2, 3)
  - [ ] `'use client'` directive
  - [ ] Use `useParams()` from `next/navigation` to get `id`; parse with `Number(params.id)`
  - [ ] TanStack Query: `useQuery({ queryKey: ['order', id], queryFn: () => getOrderDetail(id) })`
  - [ ] Display: order number, created_at (formatted), delivery address, subtotal, status badge
  - [ ] Itemized list: `product_name × quantity at product_price = line_price` for each `OrderItemResponse`
  - [ ] Status "dispatched" → amber/yellow visual highlight (see styling note in Dev Notes)
  - [ ] "← Back to Orders" link to `/account/orders`

## Dev Notes

### Backend: Modify `OrderCreateView`, Don't Create a New Class

The existing `path('orders/', OrderCreateView.as_view())` URL already handles `POST`. Simply **add a `get` method** to `OrderCreateView` — DRF's `APIView` dispatches by HTTP method, so adding `get` does not affect existing `post` behavior.

```python
class OrderCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        return Response(OrderResponseSerializer(orders, many=True).data)

    def post(self, request):
        # ... existing post method unchanged ...
```

### Backend: `OrderDetailView` — 404 for Wrong User (AC: 5)

Use `get_object_or_404` with both `pk` and `user` filters. This returns 404 whether the order doesn't exist OR belongs to another user — never leaks that the order exists.

```python
class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        return Response(OrderResponseSerializer(order).data)
```

### Backend: No New Serializer Needed

`OrderResponseSerializer` already returns all required fields: `order_id, order_number, items (OrderItemResponse[]), subtotal, delivery_address, status, created_at`. Use it for both list (`many=True`) and detail (single object). No new serializer.

### Backend: No Migrations Needed

`Order` and `OrderItem` models already have all required fields. `Order.status` already supports `pending / confirmed / dispatched / delivered` via `STATUS_CHOICES`. No migration needed.

### Backend: `urls.py` Update Pattern

```python
from .views import CartView, CartItemCreateView, CartItemUpdateDeleteView, CartMergeView, OrderCreateView, OrderDetailView

urlpatterns = [
    # existing patterns unchanged...
    path('orders/', OrderCreateView.as_view(), name='order-create'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),  # NEW
]
```

### Frontend: Use `useParams()` Hook (Not Prop-Based Params)

For client components (`'use client'`) in Next.js App Router, use `useParams()` hook to read dynamic segments — do NOT try to receive `params` as a function argument or Promise:

```tsx
import { useParams } from 'next/navigation'

export default function OrderDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderDetail(id),
    enabled: !isNaN(id),
  })
  // ...
}
```

### Frontend: `api.ts` — Extend `ORDER_ENDPOINTS` and Add Functions

The existing `ORDER_ENDPOINTS` only has `ORDERS`. **Update** (not replace) the const — preserve the existing `ORDERS` key:

```typescript
export const ORDER_ENDPOINTS = {
  ORDERS: '/api/v1/orders/',
  ORDER_DETAIL: (id: number) => `/api/v1/orders/${id}/`,
} as const

export async function getOrders(): Promise<OrderResponse[]> {
  const res = await apiFetch(ORDER_ENDPOINTS.ORDERS)
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json() as Promise<OrderResponse[]>
}

export async function getOrderDetail(id: number): Promise<OrderResponse> {
  const res = await apiFetch(ORDER_ENDPOINTS.ORDER_DETAIL(id))
  if (!res.ok) throw new Error('Failed to fetch order')
  return res.json() as Promise<OrderResponse>
}
```

`apiFetch` already handles the `Authorization: Bearer` header and 401 retry/redirect. Never use raw `fetch` directly.

### Frontend: `OrderResponse` Type Already Exists — Do Not Redefine

`types/order.ts` already has `OrderResponse` and `OrderItemResponse` (added in Story 3.4). Import them directly:

```typescript
import type { OrderResponse } from '@/types/order'
```

Existing shape:
```typescript
interface OrderItemResponse {
  product_id: number; product_name: string; product_price: string;
  quantity: number; line_price: string;
}
interface OrderResponse {
  order_id: number; order_number: string; items: OrderItemResponse[];
  subtotal: string; delivery_address: string;
  status: 'pending' | 'confirmed' | 'dispatched' | 'delivered';
  created_at: string;
}
```

### Frontend: Status Badge — Visual Differentiation for "dispatched"

Create an inline utility function or a simple `statusBadge(status)` helper inside the component file (no separate file needed for this story):

```tsx
function StatusBadge({ status }: { status: OrderResponse['status'] }) {
  const styles: Record<OrderResponse['status'], string> = {
    pending:    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    confirmed:  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    dispatched: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    delivered:  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}
```

"Dispatched" must be visually distinct (amber) from "delivered" (green) — this is AC3.

### Frontend: Date Formatting

`lib/utils.ts` is currently empty (`export {}`). Add a simple date formatter inline in the component — no need to create a shared util for this story:

```tsx
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}
```

### Frontend: File Locations

- `frontend/src/app/account/orders/page.tsx` — NEW (create directory `account/orders/`)
- `frontend/src/app/account/orders/[id]/page.tsx` — NEW (create directory `account/orders/[id]/`)
- Profile page is at `account/profile/page.tsx` (not in a route group) — follow same pattern

The middleware at `frontend/src/middleware.ts` already covers `matcher: ['/account/:path*', '/admin/:path*']` — `/account/orders` and `/account/orders/[id]` are protected automatically.

### Frontend: Tailwind Styling Conventions (from existing codebase)

Page wrapper: `className="mx-auto max-w-3xl px-4 py-12"`
Section heading: `className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8"`
Link/row hover: `className="block rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"`
Muted text: `className="text-sm text-zinc-500 dark:text-zinc-400"`

### Frontend: TanStack Query — `queryClient` Available via `Providers`

`QueryClientProvider` wraps the entire app via `src/components/providers.tsx`. `useQuery` works anywhere inside the tree. Default `staleTime` is 5 minutes.

### Backend Tests: Existing Test Helpers

Reuse `make_user()` and `make_product()` already defined at the top of `backend/orders/tests.py`. Add new test classes at the bottom. Use `@override_settings(EMAIL_BACKEND='django.core.mail.backends.dummy.EmailBackend')` only if you create orders via POST in setUp — for order-history tests, create `Order` objects directly via `Order.objects.create(...)` to skip email and be faster.

```python
from .models import Order

def make_order(user, address='Tashkent, Test St 1', status='pending'):
    return Order.objects.create(
        user=user, delivery_address=address, subtotal='79.97', status=status
    )
```

### AGENTS.md Notice — Read Next.js Docs Before Writing

`frontend/AGENTS.md` (enforced via `CLAUDE.md`) requires reading `node_modules/next/dist/docs/` before writing any Next.js code. The architecture states Next.js 16.2.10. Verify the correct way to use `useParams()` and `Link` in this version before writing code.

### Previous Story Context (from Story 3.4 Checkout Frontend)

- `createOrder()`, `ORDER_ENDPOINTS.ORDERS`, `loginUser()` are already in `lib/api.ts` — do not duplicate
- `OrderResponse`, `OrderItemResponse`, `PendingGuestOrder` types already in `types/order.ts`
- `useAuthStore` from `@/store/auth` — `isAuthenticated()`, `user`, `accessToken`
- `useCartStore` from `@/store/cart` — NOT needed for this story (order history is backend-only)
- Checkout page pattern: `'use client'`, `useEffect`, `useRouter`, TanStack Query — follow same structure
- `apiFetch` handles 401 auto-refresh and redirect to `/login` on failure

### Git Intelligence

- `009bd03` feat: implement order creation and confirmation flow — Story 3.4 complete; checkout pages + `ORDER_ENDPOINTS.ORDERS` + `createOrder()` in `lib/api.ts` are live
- `a50f7e5` feat: implement checkout and order creation backend — `POST /api/v1/orders/` live; `OrderResponseSerializer` verified working
- `fbf46d2` feat: Shopping Cart Backend API — pattern for `APIView` + `IsAuthenticated` + `get_object_or_404` with user filter established (see `CartItemUpdateDeleteView._get_item`)

## Project Structure Notes

- **Backend:** `backend/orders/views.py` (MODIFY — add `get` to existing class + new class), `backend/orders/urls.py` (MODIFY — add detail route), `backend/orders/tests.py` (MODIFY — add test classes)
- **Frontend:** `frontend/src/lib/api.ts` (MODIFY — extend ORDER_ENDPOINTS, add 2 functions), `frontend/src/app/account/orders/page.tsx` (CREATE — new dir), `frontend/src/app/account/orders/[id]/page.tsx` (CREATE — new dir)
- **No changes needed:** `middleware.ts`, `types/order.ts`, `store/auth.ts`, any existing cart/checkout files
- Naming: files `kebab-case.tsx`; components `PascalCase`; API keys `snake_case`; TS variables `camelCase`

## References

- Backend models: `backend/orders/models.py` — `Order`, `OrderItem` (all fields present, no migration needed)
- Backend serializers: `backend/orders/serializers.py:OrderResponseSerializer` — reuse for list + detail
- Backend views: `backend/orders/views.py:OrderCreateView` — add `get` method here; `get_object_or_404` import already present
- Backend URLs: `backend/orders/urls.py` — add `OrderDetailView` import + route
- Backend tests: `backend/orders/tests.py` — `make_user()`, `make_product()` helpers; follow existing `TestCase + APIClient + force_authenticate` pattern
- Frontend API: `frontend/src/lib/api.ts` — `apiFetch`, `apiUrl`, `ORDER_ENDPOINTS`, `createOrder` already present
- Frontend types: `frontend/src/types/order.ts:OrderResponse`, `OrderItemResponse` — already defined, do NOT redefine
- Frontend auth store: `frontend/src/store/auth.ts` — `useAuthStore`, `isAuthenticated()`, `user`
- Providers: `frontend/src/components/providers.tsx` — `QueryClientProvider` wraps app; `useQuery` available everywhere
- Next.js docs: `node_modules/next/dist/docs/` — read before writing App Router client component code

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
