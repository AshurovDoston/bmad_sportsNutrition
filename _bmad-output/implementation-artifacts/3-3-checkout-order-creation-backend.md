# Story 3.3: Checkout & Order Creation Backend

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want my order to be created atomically on the server with an email confirmation sent,
so that my purchase is reliably recorded and I receive immediate proof of my order.

## Acceptance Criteria

1. **Given** a valid cart payload and delivery address, **When** `POST /api/v1/orders/` is called, **Then** an Order and OrderItems are created in a single database transaction — partial order creation is not possible

2. **Given** a successful order creation, **When** the endpoint returns, **Then** HTTP 201 is returned with `{order_id, order_number, items, subtotal, delivery_address, status: "pending", created_at}`

3. **Given** a successful order, **When** creation completes, **Then** stock quantities for all ordered products are decremented atomically within the same transaction

4. **Given** a product in the order that has gone out of stock between cart and checkout, **When** the order endpoint is called, **Then** HTTP 400 is returned with `code: "product_out_of_stock"` and no order is created

5. **Given** a successful order, **When** it is created, **Then** a confirmation email is sent via `django.core.mail.backends.console.EmailBackend` for demo; the production email backend setting is documented in `backend/.env.example`

6. **Given** an unauthenticated request to `POST /api/v1/orders/`, **When** it is received, **Then** HTTP 401 is returned

## Tasks / Subtasks

- [x] Task 1: Add `Order` and `OrderItem` models to `backend/orders/models.py` (AC: 1, 2, 3, 4, 5)
  - [x] Add `import uuid` at the top of models.py
  - [x] Add `generate_order_number()` helper function (see exact implementation in Dev Notes)
  - [x] Add `Order` model with fields: `user`, `order_number`, `delivery_address`, `status`, `subtotal`, `created_at` (see full spec in Dev Notes)
  - [x] Add `OrderItem` model with fields: `order`, `product`, `product_name`, `product_price`, `quantity` (see full spec in Dev Notes)
  - [x] Do NOT modify existing `Cart` or `CartItem` models — only append new models

- [x] Task 2: Create and run migration (AC: 1)
  - [x] Run `python manage.py makemigrations orders` inside the backend Docker container to generate `0002_order_orderitem.py`
  - [x] Run `python manage.py migrate` to apply it
  - [x] Verify migration is clean with no conflicts

- [x] Task 3: Add Order serializers to `backend/orders/serializers.py` (AC: 2)
  - [x] Add `OrderItemCreateSerializer` for request input validation (see Dev Notes for exact definition)
  - [x] Add `OrderCreateSerializer` wrapping delivery_address + items list (see Dev Notes)
  - [x] Add `OrderItemResponseSerializer` for the response shape (see Dev Notes)
  - [x] Add `OrderResponseSerializer` matching exactly `{order_id, order_number, items, subtotal, delivery_address, status, created_at}` (see Dev Notes)
  - [x] Do NOT modify existing `CartSerializer`, `CartItemSerializer`, `CartItemProductSerializer`, or `CartMergeItemSerializer`

- [x] Task 4: Add `OrderCreateView` to `backend/orders/views.py` (AC: 1, 2, 3, 4, 5, 6)
  - [x] Add imports: `transaction`, `send_mail`, `uuid` at the top (see Dev Notes for exact import block)
  - [x] Implement `OrderCreateView(APIView)` with `permission_classes = [IsAuthenticated]`
  - [x] Use `transaction.atomic()` to wrap entire order creation
  - [x] Use `select_for_update()` on Product queryset to prevent race conditions (AC: 3, 4)
  - [x] Validate each product exists and `is_in_stock` — return 400 with `code: "product_out_of_stock"` on failure (AC: 4)
  - [x] Compute `subtotal` as sum of `product.price × quantity` for all items
  - [x] Create `Order` with `generate_order_number()`
  - [x] Create `OrderItem` for each item (snapshotting `product_name` and `product_price`)
  - [x] Decrement `product.stock_quantity` and set `is_in_stock = False` when it reaches 0 (AC: 3)
  - [x] Send confirmation email OUTSIDE the transaction (see Dev Notes for email content and `send_mail` call)
  - [x] Return `OrderResponseSerializer` with `status=201` (AC: 2)

- [x] Task 5: Register the new URL in `backend/orders/urls.py` (AC: 6)
  - [x] Add `from .views import ..., OrderCreateView`
  - [x] Add `path('orders/', OrderCreateView.as_view(), name='order-create')` to `urlpatterns`
  - [x] Verify the existing cart URLs are untouched

- [x] Task 6: Update `backend/.env.example` to document email backend (AC: 5)
  - [x] Add a comment block documenting `EMAIL_BACKEND` options (see Dev Notes for exact text)

- [x] Task 7: Write tests in `backend/orders/tests.py` (AC: 1, 2, 3, 4, 6)
  - [x] Add `ORDERS_URL = '/api/v1/orders/'` constant alongside existing URL constants
  - [x] Add `OrderAuthTests` class — unauthenticated POST returns 401 (AC: 6)
  - [x] Add `OrderCreateTests` class — successful creation, correct response shape, stock decremented (AC: 1, 2, 3)
  - [x] Add `OrderOutOfStockTests` class — out-of-stock product returns 400, no order created (AC: 4)
  - [x] Add `OrderAtomicTests` class — transaction rollback on partial failure (AC: 1)
  - [x] Use `@override_settings(EMAIL_BACKEND='django.core.mail.backends.dummy.EmailBackend')` on test class to suppress console output (see Dev Notes)
  - [x] Reuse existing `make_user()` and `make_product()` helper functions — do NOT redefine them

## Dev Notes

### 🚨 CRITICAL: Do NOT Modify Existing Models or Serializers
`backend/orders/models.py` currently has `Cart` and `CartItem`. **Append** `Order` and `OrderItem` after them. The existing migration `0001_initial.py` covers only Cart/CartItem. A new `0002_order_orderitem.py` migration will be auto-generated.

### 🚨 Order Number Generation
```python
import uuid

def generate_order_number() -> str:
    return f"ORD-{uuid.uuid4().hex[:8].upper()}"
```
This produces values like `ORD-A3B4C5D6`. Combined with the database `unique=True` constraint, collision probability is negligible at demo scale. No retry logic needed.

### 🚨 Complete Model Definitions — Append After CartItem in `backend/orders/models.py`

```python
def generate_order_number():
    return f"ORD-{uuid.uuid4().hex[:8].upper()}"


class Order(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_DISPATCHED = 'dispatched'
    STATUS_DELIVERED = 'delivered'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_CONFIRMED, 'Confirmed'),
        (STATUS_DISPATCHED, 'Dispatched'),
        (STATUS_DELIVERED, 'Delivered'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='orders'
    )
    order_number = models.CharField(max_length=20, unique=True, default=generate_order_number)
    delivery_address = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.order_number}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=200)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.product_name} × {self.quantity}"
```

**Why `ForeignKey` not `OneToOneField` for `user`:** A user can have multiple orders (order history in Story 3.5).

**Why `product_name` / `product_price` snapshots on OrderItem:** Products can be renamed or repriced after order creation. Snapshots preserve what the customer actually paid.

**Why `ForeignKey(Product, PROTECT)` on OrderItem:** Prevents accidental product deletion if orders reference it. Admin would need to resolve orders first.

**Why `default=generate_order_number` on `order_number`:** Django calls the callable per-instance at creation time. This is cleaner than setting it in the view.

### 🚨 New Serializers — Append to `backend/orders/serializers.py`

```python
class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    delivery_address = serializers.CharField(min_length=5)
    items = OrderItemCreateSerializer(many=True, min_length=1)


class OrderItemResponseSerializer(serializers.ModelSerializer):
    line_price = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['product_id', 'product_name', 'product_price', 'quantity', 'line_price']

    def get_line_price(self, obj):
        return str(obj.product_price * obj.quantity)


class OrderResponseSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='id')
    items = OrderItemResponseSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['order_id', 'order_number', 'items', 'subtotal', 'delivery_address', 'status', 'created_at']

    def get_subtotal(self, obj):
        return str(obj.subtotal)
```

**Why `source='id'` for `order_id`:** The AC specifies `order_id` in the response but the model field is `id`. This remapping satisfies the contract without renaming the field.

**Why `min_length=1` on items list:** An order with no items is meaningless; reject it early at serializer validation.

### 🚨 Complete `OrderCreateView` — Append to `backend/orders/views.py`

First, add these imports to the existing imports block at the top of `views.py`:
```python
from django.db import transaction
from django.core.mail import send_mail
from .models import Cart, CartItem, Order, OrderItem
from .serializers import CartSerializer, CartMergeItemSerializer, OrderCreateSerializer, OrderResponseSerializer
```

Then add the view class (append after `CartMergeView`):
```python
class OrderCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        delivery_address = serializer.validated_data['delivery_address']
        items_data = serializer.validated_data['items']
        product_ids = [item['product_id'] for item in items_data]

        with transaction.atomic():
            # SELECT FOR UPDATE prevents race conditions between concurrent checkouts
            products = {
                p.id: p
                for p in Product.objects.select_for_update().filter(id__in=product_ids)
            }

            # Validate all products exist
            for item in items_data:
                if item['product_id'] not in products:
                    return Response(
                        {'error': 'Product not found', 'code': 'product_not_found', 'details': {}},
                        status=status.HTTP_404_NOT_FOUND,
                    )

            # Validate stock for all items before creating anything (AC: 4)
            for item in items_data:
                product = products[item['product_id']]
                if not product.is_in_stock or product.stock_quantity < item['quantity']:
                    return Response(
                        {'error': 'Product is out of stock', 'code': 'product_out_of_stock', 'details': {}},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Compute subtotal
            subtotal = sum(
                products[item['product_id']].price * item['quantity']
                for item in items_data
            )

            # Create Order (AC: 1)
            order = Order.objects.create(
                user=request.user,
                delivery_address=delivery_address,
                subtotal=subtotal,
            )

            # Create OrderItems and decrement stock (AC: 3)
            for item in items_data:
                product = products[item['product_id']]
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    product_price=product.price,
                    quantity=item['quantity'],
                )
                product.stock_quantity = max(0, product.stock_quantity - item['quantity'])
                if product.stock_quantity == 0:
                    product.is_in_stock = False
                product.save(update_fields=['stock_quantity', 'is_in_stock'])

        # Send email outside transaction — email failure must not rollback order (AC: 5)
        _send_order_confirmation(order, request.user)

        return Response(
            OrderResponseSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


def _send_order_confirmation(order, user):
    item_lines = '\n'.join(
        f"  {item.product_name} × {item.quantity} — {item.product_price} UZS each"
        for item in order.items.all()
    )
    send_mail(
        subject=f"Order Confirmed: {order.order_number}",
        message=(
            f"Dear {user.name},\n\n"
            f"Your order {order.order_number} has been confirmed.\n\n"
            f"Items:\n{item_lines}\n\n"
            f"Subtotal: {order.subtotal} UZS\n"
            f"Delivery to: {order.delivery_address}\n\n"
            f"Thank you for shopping with us!"
        ),
        from_email='noreply@sportsnutrition.uz',
        recipient_list=[f"{user.phone}@demo.sportsnutrition.uz"],
        fail_silently=True,
    )
```

**Why `fail_silently=True` on `send_mail`:** This is a demo console email — any failure (misconfiguration, etc.) must never crash order creation. The order is already committed at this point.

**Why stock validation runs before order creation:** If we created the order first and then found a product out of stock, we'd need to roll back. Validating first is both cleaner and more explicit.

**Why `max(0, stock_quantity - quantity)`:** Guards against going negative if stock_quantity is already 0 but `is_in_stock` was True (data integrity edge case).

### 🚨 URL Registration — `backend/orders/urls.py`

```python
from django.urls import path
from .views import CartView, CartItemCreateView, CartItemUpdateDeleteView, CartMergeView, OrderCreateView

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart-detail'),
    path('cart/items/', CartItemCreateView.as_view(), name='cart-item-create'),
    path('cart/items/<int:pk>/', CartItemUpdateDeleteView.as_view(), name='cart-item-detail'),
    path('cart/merge/', CartMergeView.as_view(), name='cart-merge'),
    path('orders/', OrderCreateView.as_view(), name='order-create'),
]
```

The main `core/urls.py` already includes `orders.urls` at `api/v1/` prefix — no changes needed there.

### 🚨 `.env.example` Addition

Append to `backend/.env.example`:
```
# Email (demo: console prints to stdout; prod: django-anymail with SendGrid or Mailgun)
# EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend  (already set in dev.py)
# EMAIL_BACKEND=anymail.backends.sendgrid.EmailBackend  (production)
# SENDGRID_API_KEY=your-key-here
```

**Note:** `EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'` is already set in `backend/core/settings/dev.py` (confirmed). No changes to settings files are needed for this story.

### 🚨 Tests — Complete Test Classes for `backend/orders/tests.py`

Append these classes after the existing `CartMergeTests` class. Do NOT rewrite existing tests.

```python
from django.test import override_settings

ORDERS_URL = '/api/v1/orders/'


@override_settings(EMAIL_BACKEND='django.core.mail.backends.dummy.EmailBackend')
class OrderAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_post_order_requires_auth(self):
        res = self.client.post(ORDERS_URL, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


@override_settings(EMAIL_BACKEND='django.core.mail.backends.dummy.EmailBackend')
class OrderCreateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.p1 = make_product(name='Whey', slug='whey-order', price='29.99', stock_quantity=10)
        self.p2 = make_product(name='Creatine', slug='creatine-order', price='19.99', stock_quantity=5)

    def _payload(self, items=None, address='Tashkent, Test Street 1'):
        return {
            'delivery_address': address,
            'items': items or [
                {'product_id': self.p1.id, 'quantity': 2},
                {'product_id': self.p2.id, 'quantity': 1},
            ],
        }

    def test_create_order_returns_201(self):
        res = self.client.post(ORDERS_URL, self._payload(), format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_response_contains_required_fields(self):
        res = self.client.post(ORDERS_URL, self._payload(), format='json')
        for field in ['order_id', 'order_number', 'items', 'subtotal', 'delivery_address', 'status', 'created_at']:
            self.assertIn(field, res.data)

    def test_order_status_is_pending(self):
        res = self.client.post(ORDERS_URL, self._payload(), format='json')
        self.assertEqual(res.data['status'], 'pending')

    def test_order_number_format(self):
        res = self.client.post(ORDERS_URL, self._payload(), format='json')
        self.assertTrue(res.data['order_number'].startswith('ORD-'))

    def test_order_and_items_persisted(self):
        res = self.client.post(ORDERS_URL, self._payload(), format='json')
        from .models import Order, OrderItem
        self.assertTrue(Order.objects.filter(id=res.data['order_id']).exists())
        self.assertEqual(OrderItem.objects.filter(order_id=res.data['order_id']).count(), 2)

    def test_stock_decremented(self):
        self.client.post(ORDERS_URL, self._payload(), format='json')
        self.p1.refresh_from_db()
        self.p2.refresh_from_db()
        self.assertEqual(self.p1.stock_quantity, 8)  # 10 - 2
        self.assertEqual(self.p2.stock_quantity, 4)  # 5 - 1

    def test_stock_hits_zero_marks_out_of_stock(self):
        p = make_product(name='LowStock', slug='low-stock', price='9.99', stock_quantity=1)
        payload = {'delivery_address': 'Addr', 'items': [{'product_id': p.id, 'quantity': 1}]}
        self.client.post(ORDERS_URL, payload, format='json')
        p.refresh_from_db()
        self.assertEqual(p.stock_quantity, 0)
        self.assertFalse(p.is_in_stock)

    def test_subtotal_correct(self):
        res = self.client.post(ORDERS_URL, self._payload(), format='json')
        # p1: 29.99 × 2 = 59.98; p2: 19.99 × 1 = 19.99; total = 79.97
        self.assertEqual(res.data['subtotal'], '79.97')


@override_settings(EMAIL_BACKEND='django.core.mail.backends.dummy.EmailBackend')
class OrderOutOfStockTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_out_of_stock_returns_400(self):
        oos = make_product(name='OOS', slug='oos-order', in_stock=False, stock_quantity=0)
        payload = {'delivery_address': 'Addr', 'items': [{'product_id': oos.id, 'quantity': 1}]}
        res = self.client.post(ORDERS_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data['code'], 'product_out_of_stock')

    def test_out_of_stock_no_order_created(self):
        from .models import Order
        oos = make_product(name='OOS2', slug='oos-order2', in_stock=False, stock_quantity=0)
        payload = {'delivery_address': 'Addr', 'items': [{'product_id': oos.id, 'quantity': 1}]}
        self.client.post(ORDERS_URL, payload, format='json')
        self.assertEqual(Order.objects.count(), 0)

    def test_quantity_exceeds_stock_returns_400(self):
        p = make_product(name='Partial', slug='partial-stock', price='9.99', stock_quantity=2)
        payload = {'delivery_address': 'Addr', 'items': [{'product_id': p.id, 'quantity': 5}]}
        res = self.client.post(ORDERS_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data['code'], 'product_out_of_stock')


@override_settings(EMAIL_BACKEND='django.core.mail.backends.dummy.EmailBackend')
class OrderAtomicTests(TestCase):
    """Verifies the transaction is all-or-nothing — partial order creation is impossible."""

    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_no_partial_order_if_second_item_out_of_stock(self):
        from .models import Order
        good = make_product(name='Good', slug='good-atomic', price='9.99', stock_quantity=5)
        oos = make_product(name='OOS', slug='oos-atomic', in_stock=False, stock_quantity=0)
        payload = {
            'delivery_address': 'Addr',
            'items': [
                {'product_id': good.id, 'quantity': 1},
                {'product_id': oos.id, 'quantity': 1},
            ],
        }
        res = self.client.post(ORDERS_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)
        good.refresh_from_db()
        self.assertEqual(good.stock_quantity, 5)  # not decremented
```

**Why `@override_settings(EMAIL_BACKEND='dummy')`:** The default dev setting uses `console.EmailBackend` which prints to stdout during tests. Overriding with `dummy.EmailBackend` silences output without affecting logic.

**Why the atomic test checks `good.stock_quantity == 5`:** Because validation happens before any mutations (all products are checked first), the good product's stock should never be touched when another item fails.

### Backend API Contract (Story 3.3)

```
POST /api/v1/orders/
  Auth: Bearer <token> required
  Request body:
    {
      "delivery_address": "Tashkent, Yunusabad, 15 Amir Temur Ave",
      "items": [
        {"product_id": 1, "quantity": 2},
        {"product_id": 3, "quantity": 1}
      ]
    }

  Response 201:
    {
      "order_id": 42,
      "order_number": "ORD-A3B4C5D6",
      "items": [
        {
          "product_id": 1,
          "product_name": "Gold Standard Whey",
          "product_price": "29.99",
          "quantity": 2,
          "line_price": "59.98"
        }
      ],
      "subtotal": "79.97",
      "delivery_address": "Tashkent, Yunusabad, 15 Amir Temur Ave",
      "status": "pending",
      "created_at": "2026-05-05T12:30:00+05:00"
    }

  Response 400 (out of stock):
    {"error": "Product is out of stock", "code": "product_out_of_stock", "details": {}}

  Response 401:
    {"detail": "Authentication credentials were not provided."}
```

### Project Structure Notes

**Files to APPEND to (not replace):**
```
backend/orders/
  models.py        APPEND — add Order + OrderItem after CartItem
  serializers.py   APPEND — add 4 new serializer classes
  views.py         APPEND — add OrderCreateView + _send_order_confirmation helper
  urls.py          UPDATE — add one new URL pattern; existing 4 patterns unchanged
  tests.py         APPEND — add 4 new test classes after CartMergeTests
  migrations/
    0002_order_orderitem.py  NEW — auto-generated via makemigrations
```

**Files to update (minor):**
```
backend/.env.example   APPEND — document EMAIL_BACKEND options
```

**Files NOT touched:**
```
backend/core/urls.py           Already includes orders.urls at api/v1/
backend/core/settings/dev.py   EMAIL_BACKEND already set to console.EmailBackend
backend/core/settings/base.py  No changes needed
```

**Architecture compliance:**
- All new endpoints use `/api/v1/` prefix (via `core/urls.py` include) ✓
- All response JSON uses `snake_case` keys ✓
- `IsAuthenticated` on all new endpoints ✓
- Decimal fields as `str` in responses (consistent with Cart serializers) ✓
- Error format: `{error, code, details}` — same as cart `product_out_of_stock` pattern ✓

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3] — Acceptance criteria verbatim
- [Source: _bmad-output/planning-artifacts/architecture.md#FR28] — Email confirmation: console backend for demo; django-anymail for prod
- [Source: _bmad-output/planning-artifacts/architecture.md#Checkout & Payment] — "Order creation transaction; email confirmation"
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — `orders/models.py: Cart, CartItem, Order, OrderItem`
- [Source: backend/orders/models.py] — Existing Cart + CartItem models; append-only
- [Source: backend/orders/serializers.py] — Error format `{error, code, details}` pattern used by CartItemCreateView
- [Source: backend/orders/views.py] — `_cart_response` helper pattern; APIView style; `get_or_create` pattern
- [Source: backend/orders/tests.py] — `make_user()`, `make_product()` helpers; test structure to follow
- [Source: backend/orders/urls.py] — Existing 4 URL patterns; append one more
- [Source: backend/core/urls.py:13] — `path('api/v1/', include('orders.urls'))` already active
- [Source: backend/core/settings/dev.py] — `EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'` already set
- [Source: backend/accounts/models.py] — CustomUser has `name`, `phone` (no email field) — use phone as email placeholder
- [Source: backend/products/models.py:19-20] — `stock_quantity` (PositiveIntegerField) + `is_in_stock` (BooleanField) to update
- [Source: backend/.env.example] — Document EMAIL_BACKEND options here
- [Source: _bmad-output/implementation-artifacts/3-1-shopping-cart-backend-api.md] — Precedent: same app, same patterns, same test helpers

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

Implemented full checkout & order creation backend. All 6 ACs satisfied:
- Order + OrderItem models appended to models.py (AC 1, 2, 3, 4, 5)
- Migration 0002_order_orderitem generated and applied cleanly
- 4 serializer classes appended to serializers.py (AC 2)
- OrderCreateView with atomic transaction, select_for_update, stock decrement, and console email appended to views.py (AC 1–5)
- URL registered at POST /api/v1/orders/ (AC 6)
- .env.example updated with EMAIL_BACKEND documentation (AC 5)
- 13 new tests across 4 classes; all 32 tests pass with zero regressions
- Fixed story test bug: delivery_address 'Addr' (4 chars) fails min_length=5; corrected to 'Addr1'

### File List

- backend/orders/models.py
- backend/orders/serializers.py
- backend/orders/views.py
- backend/orders/urls.py
- backend/orders/tests.py
- backend/orders/migrations/0002_order_orderitem.py
- backend/.env.example

## Change Log

- 2026-05-05: Story 3.3 created — comprehensive checkout & order creation backend implementation guide
- 2026-05-06: Story 3.3 implemented — Order/OrderItem models, serializers, OrderCreateView, URL, migration, tests; 32/32 tests pass
