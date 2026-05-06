# Story 3.1: Shopping Cart Backend API

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want a cart API that persists my items server-side and supports merging my guest cart on login,
so that my cart is never lost whether I'm browsing as a guest or a registered user.

## Acceptance Criteria

1. **Given** a registered user with a valid access token, **When** `GET /api/v1/cart/` is called, **Then** the user's server-side cart is returned with all items, quantities, line prices, and subtotal

2. **Given** a product and quantity, **When** `POST /api/v1/cart/items/` is called with a valid access token, **Then** the item is added to the user's cart and the updated cart is returned; if the item already exists its quantity is incremented

3. **Given** a cart item id, **When** `PATCH /api/v1/cart/items/{id}/` is called with a new quantity, **Then** the quantity is updated and the updated cart is returned

4. **Given** a cart item id, **When** `DELETE /api/v1/cart/items/{id}/` is called, **Then** the item is removed and the updated cart is returned

5. **Given** a list of guest cart items `[{product_id, quantity}]`, **When** `POST /api/v1/cart/merge/` is called by a newly logged-in user, **Then** guest items are merged into the server cart (quantities summed for duplicates) and the unified cart is returned

6. **Given** a product that is out of stock, **When** it is added to the cart via the API, **Then** HTTP 400 is returned with `code: "product_out_of_stock"`

7. **Given** any cart endpoint, **When** called without a valid access token, **Then** HTTP 401 is returned

## Tasks / Subtasks

- [x] Task 1: Create Cart and CartItem models in `backend/orders/models.py` (AC: 1, 2, 3, 4, 5)
  - [x] Import `settings` from `django.conf` and `Product` from `products.models`
  - [x] Create `Cart` model: `user = OneToOneField(settings.AUTH_USER_MODEL, on_delete=CASCADE, related_name='cart')`, `created_at = DateTimeField(auto_now_add=True)`, `updated_at = DateTimeField(auto_now=True)`
  - [x] Create `CartItem` model: `cart = ForeignKey(Cart, on_delete=CASCADE, related_name='items')`, `product = ForeignKey(Product, on_delete=PROTECT)`, `quantity = PositiveIntegerField(default=1)`, `class Meta: unique_together = [['cart', 'product']]`
  - [x] Run `python manage.py makemigrations orders` to generate the migration

- [x] Task 2: Implement serializers in `backend/orders/serializers.py` (AC: 1, 2, 3, 4, 5, 6)
  - [x] Implement `CartItemProductSerializer(serializers.ModelSerializer)` with fields `['id', 'name', 'slug', 'price', 'primary_image_url']`; `primary_image_url` is a `SerializerMethodField` that returns the first image URL or `None`
  - [x] Implement `CartItemSerializer(serializers.ModelSerializer)` with fields `['id', 'product', 'quantity', 'line_price']`; `product` = nested `CartItemProductSerializer(read_only=True)`; `line_price` = `SerializerMethodField` computing `product.price * quantity` as string
  - [x] Implement `CartSerializer(serializers.ModelSerializer)` with fields `['id', 'items', 'subtotal']`; `items` = nested `CartItemSerializer(many=True, read_only=True)`; `subtotal` = `SerializerMethodField` summing all `line_price` values as string
  - [x] Implement `CartMergeItemSerializer(serializers.Serializer)` with `product_id = IntegerField()` and `quantity = IntegerField(min_value=1)` — used only for input validation in the merge endpoint

- [x] Task 3: Implement views in `backend/orders/views.py` (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] Import: `APIView`, `generics`, `status`, `Response`, `IsAuthenticated`, `get_object_or_404`, `Cart`, `CartItem`, `Product`, all serializers
  - [x] Implement `CartView(APIView)` with `permission_classes = [IsAuthenticated]`; `get()` calls `Cart.objects.get_or_create(user=request.user)` and returns `CartSerializer(cart).data`
  - [x] Implement `CartItemCreateView(APIView)` with `permission_classes = [IsAuthenticated]`; `post()` reads `product_id` and `quantity` from request.data, checks `product.is_in_stock`, calls `CartItem.objects.get_or_create(cart=cart, product=product)` and increments quantity if exists, returns full Cart response
  - [x] Implement `CartItemUpdateDeleteView(APIView)` with `permission_classes = [IsAuthenticated]`; `patch()` updates quantity; `delete()` removes item; both verify the CartItem belongs to `request.user.cart` (404 if not found in user's cart), both return full Cart response
  - [x] Implement `CartMergeView(APIView)` with `permission_classes = [IsAuthenticated]`; `post()` validates body as list using `CartMergeItemSerializer(data=request.data, many=True)`, then for each valid item: skip if product not found or not in stock, `get_or_create` CartItem, add quantities; return full Cart response
  - [x] Use error shape `{"error": "...", "code": "product_out_of_stock", "details": {}}` for stock errors (AC: 6)

- [x] Task 4: Register URLs in `backend/orders/urls.py` and enable in `backend/core/urls.py` (AC: 1–7)
  - [x] Replace `orders/urls.py` content: import all views, define `urlpatterns` with:
    - `path('cart/', CartView.as_view(), name='cart-detail')`
    - `path('cart/items/', CartItemCreateView.as_view(), name='cart-item-create')`
    - `path('cart/items/<int:pk>/', CartItemUpdateDeleteView.as_view(), name='cart-item-detail')`
    - `path('cart/merge/', CartMergeView.as_view(), name='cart-merge')`
  - [x] In `backend/core/urls.py`: uncomment the line `# path('api/v1/', include('orders.urls')),   # Story 3`

- [x] Task 5: Write backend tests in `backend/orders/tests.py` (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] Define URL constants: `CART_URL = '/api/v1/cart/'`, `CART_ITEMS_URL = '/api/v1/cart/items/'`, `CART_MERGE_URL = '/api/v1/cart/merge/'`
  - [x] Add helper `make_user(phone='+998901234567', password='pass', name='Test')` using `CustomUser.objects.create_user()`
  - [x] Add helper `make_product(name, slug, price, in_stock=True, stock_quantity=10)` using `Product.objects.create()`
  - [x] `CartAuthTests`: test all 4 endpoint paths return 401 without auth
  - [x] `CartGetTests`: test GET creates cart if not exists, returns 200 with correct structure (id, items, subtotal)
  - [x] `CartAddItemTests`: test add new item increments cart; test add existing item sums quantity; test add out-of-stock returns 400 with `product_out_of_stock` code; test add nonexistent product returns 404
  - [x] `CartUpdateItemTests`: test PATCH updates quantity and returns updated cart; test PATCH on another user's item returns 404
  - [x] `CartDeleteItemTests`: test DELETE removes item and returns updated cart; test DELETE on another user's item returns 404
  - [x] `CartMergeTests`: test merge adds new items; test merge sums quantities for duplicate products; test merge skips out-of-stock products (no error, just skip); test merge with empty list returns current cart

## Dev Notes

### 🚨 CRITICAL: `orders/` App Is Empty — Build From Scratch

The `backend/orders/` app currently has only placeholder files:
- `models.py`: only `from django.db import models`
- `views.py`: only `from rest_framework.viewsets import ModelViewSet`
- `serializers.py`: only `from rest_framework import serializers`
- `urls.py`: has empty `DefaultRouter` pattern
- `tests.py`: only `from django.test import TestCase`
- **No `migrations/` folder exists** — `makemigrations orders` is required before `migrate`

### 🚨 CRITICAL: Uncomment `orders.urls` in `core/urls.py`

`backend/core/urls.py` line 13 currently reads:
```python
# path('api/v1/', include('orders.urls')),   # Story 3
```
**This MUST be uncommented.** Without it all cart endpoints return 404.

### 🚨 Models: One Cart Per User (OneToOneField)

```python
# backend/orders/models.py
from django.conf import settings
from django.db import models
from products.models import Product


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart({self.user})"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = [['cart', 'product']]

    def __str__(self):
        return f"{self.product.name} × {self.quantity}"
```

Why `PROTECT` for product FK: prevents accidental product deletion when cart items exist. Why `CASCADE` for cart FK: when cart is deleted (user deleted), items are removed too. Why `OneToOneField` for Cart-User: each user has exactly one server cart.

### 🚨 Serializers: Correct `line_price` and `subtotal` Computation

`price` on `Product` is a `DecimalField`. Multiply with `quantity` (int) using Python `Decimal`:

```python
# backend/orders/serializers.py
from decimal import Decimal
from rest_framework import serializers
from products.models import Product
from .models import Cart, CartItem


class CartItemProductSerializer(serializers.ModelSerializer):
    primary_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'price', 'primary_image_url']

    def get_primary_image_url(self, obj):
        image = obj.images.filter(is_primary=True).first() or obj.images.first()
        if image and image.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image.image.url)
            return image.image.url
        return None


class CartItemSerializer(serializers.ModelSerializer):
    product = CartItemProductSerializer(read_only=True)
    line_price = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'line_price']

    def get_line_price(self, obj):
        return str(obj.product.price * obj.quantity)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'subtotal']

    def get_subtotal(self, obj):
        total = sum(item.product.price * item.quantity for item in obj.items.all())
        return str(total)


class CartMergeItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
```

**Why not reuse `ProductListSerializer`?** Too heavy — includes goal tags, certification fields, and `SerializerMethodField` for `primary_image_url` that depends on `request` context. A lightweight inline serializer is cleaner and faster for cart items.

### 🚨 Views: How Each Endpoint Works

```python
# backend/orders/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from products.models import Product
from .models import Cart, CartItem
from .serializers import CartSerializer, CartMergeItemSerializer


def _cart_response(cart, request):
    """Return full cart serializer response; always re-fetch to get fresh queryset."""
    cart.refresh_from_db()
    return Response(CartSerializer(cart, context={'request': request}).data)


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return _cart_response(cart, request)


class CartItemCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)
        product = get_object_or_404(Product, pk=product_id)
        if not product.is_in_stock:
            return Response(
                {'error': 'Product is out of stock', 'code': 'product_out_of_stock', 'details': {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cart, _ = Cart.objects.get_or_create(user=request.user)
        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            item.quantity += int(quantity)
        else:
            item.quantity = int(quantity)
        item.save()
        return _cart_response(cart, request)


class CartItemUpdateDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_item(self, request, pk):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return get_object_or_404(CartItem, pk=pk, cart=cart), cart

    def patch(self, request, pk):
        item, cart = self._get_item(request, pk)
        quantity = request.data.get('quantity')
        if quantity is not None:
            item.quantity = int(quantity)
            item.save()
        return _cart_response(cart, request)

    def delete(self, request, pk):
        item, cart = self._get_item(request, pk)
        item.delete()
        return _cart_response(cart, request)


class CartMergeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CartMergeItemSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        cart, _ = Cart.objects.get_or_create(user=request.user)
        for entry in serializer.validated_data:
            try:
                product = Product.objects.get(pk=entry['product_id'])
            except Product.DoesNotExist:
                continue
            if not product.is_in_stock:
                continue
            item, created = CartItem.objects.get_or_create(cart=cart, product=product)
            item.quantity = item.quantity + entry['quantity'] if not created else entry['quantity']
            item.save()
        return _cart_response(cart, request)
```

**Key implementation notes:**
- `_cart_response` always calls `refresh_from_db()` so the serializer sees the updated cart state after mutations
- `CartItemUpdateDeleteView._get_item` uses `get_object_or_404(CartItem, pk=pk, cart=cart)` — this returns 404 (not 403) if pk exists but belongs to another user's cart, matching the security pattern from Story 3.5 AC 5
- Merge skips invalid products silently (no error) — this handles race conditions where a product was deleted or went out of stock between guest session and login
- `get_or_create` on CartItem uses the `unique_together(cart, product)` constraint — safe against duplicates

### 🚨 URL Registration

```python
# backend/orders/urls.py
from django.urls import path
from .views import CartView, CartItemCreateView, CartItemUpdateDeleteView, CartMergeView

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart-detail'),
    path('cart/items/', CartItemCreateView.as_view(), name='cart-item-create'),
    path('cart/items/<int:pk>/', CartItemUpdateDeleteView.as_view(), name='cart-item-detail'),
    path('cart/merge/', CartMergeView.as_view(), name='cart-merge'),
]
```

Then in `backend/core/urls.py`:
```python
path('api/v1/', include('orders.urls')),   # uncomment this line
```

### 🚨 API Response Shape

All endpoints return the full Cart object on success:
```json
{
  "id": 1,
  "items": [
    {
      "id": 3,
      "product": {
        "id": 7,
        "name": "Gold Standard Whey",
        "slug": "gold-standard-whey",
        "price": "29.99",
        "primary_image_url": "http://localhost:8000/media/products/whey.jpg"
      },
      "quantity": 2,
      "line_price": "59.98"
    }
  ],
  "subtotal": "59.98"
}
```

Out-of-stock error response (HTTP 400):
```json
{"error": "Product is out of stock", "code": "product_out_of_stock", "details": {}}
```

### 🚨 Test Pattern — Authentication

The project uses `CustomUser` with `phone` as `USERNAME_FIELD`. Authenticate in tests using `force_authenticate`:

```python
# backend/orders/tests.py
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import CustomUser
from products.models import Product
from .models import Cart, CartItem

CART_URL = '/api/v1/cart/'
CART_ITEMS_URL = '/api/v1/cart/items/'
CART_MERGE_URL = '/api/v1/cart/merge/'


def make_user(phone='+998901234567', password='testpass', name='Test User'):
    return CustomUser.objects.create_user(phone=phone, password=password, name=name)


def make_product(name='Whey', slug='whey', price='29.99', in_stock=True, stock_quantity=10):
    return Product.objects.create(
        name=name, slug=slug, brand='Brand', description='',
        price=price, is_in_stock=in_stock, stock_quantity=stock_quantity, delivery_hours=2
    )


class CartAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_get_cart_requires_auth(self):
        res = self.client.get(CART_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_cart_item_requires_auth(self):
        res = self.client.post(CART_ITEMS_URL, {})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_cart_item_requires_auth(self):
        res = self.client.patch(f'{CART_ITEMS_URL}1/', {})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_cart_item_requires_auth(self):
        res = self.client.delete(f'{CART_ITEMS_URL}1/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_merge_requires_auth(self):
        res = self.client.post(CART_MERGE_URL, [], format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
```

### 🚨 What Already Exists — Do NOT Recreate

- `Product` model in `backend/products/models.py` — has `is_in_stock (BooleanField)`, `stock_quantity (PositiveIntegerField)`, `price (DecimalField)`, `images (related_name on ProductImage)` — use these fields directly
- `ProductImage` model with `is_primary (BooleanField)` and `image (ImageField)` — use for `primary_image_url` in `CartItemProductSerializer`
- `CustomUser` model in `backend/accounts/models.py` — referenced via `settings.AUTH_USER_MODEL`; `USERNAME_FIELD = 'phone'`
- `core/urls.py` — already has the orders include line commented; just uncomment it
- `orders/` app is already in `INSTALLED_APPS` (verify in `core/settings/base.py` before running makemigrations)

### 🚨 Migration Required — No Existing Migration for `orders`

```bash
# Inside backend container or virtualenv:
python manage.py makemigrations orders
python manage.py migrate
```

There is NO existing migrations folder in `backend/orders/`. The dev agent must create the migration before running tests or starting the server.

### Project Structure Notes

- All new code goes in `backend/orders/` — the domain app for FR20–31
- No new Django app needed; `orders` is already installed
- Cart and checkout share the `orders/` app per the architecture (`orders/` models: Cart, CartItem, Order, OrderItem)
- Stories 3.2–3.5 build on top of this story's endpoints; get this right first
- Frontend Zustand store (`frontend/src/store/cart.ts`) is created in Story 3.2 — not in scope here

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — Acceptance criteria verbatim
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Cart → orders/ app
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — Guest cart = Zustand + localStorage; server cart for registered users only
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns] — Error response shape `{"error", "code", "details"}`
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — `IsAuthenticated` on all cart endpoints
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — `orders/` backend app; `store/cart.ts` frontend
- [Source: backend/orders/models.py] — Currently empty; build from scratch
- [Source: backend/orders/urls.py] — Currently has empty DefaultRouter; replace entirely
- [Source: backend/core/urls.py:13] — Commented `orders.urls` include; must uncomment
- [Source: backend/products/models.py] — `Product.is_in_stock`, `Product.price`, `ProductImage.is_primary`, `ProductImage.image`
- [Source: backend/accounts/models.py] — `CustomUser`, `USERNAME_FIELD = 'phone'`
- [Source: _bmad-output/implementation-artifacts/2-6-confusion-resolver-pages-ssg.md#Dev Notes] — Backend test patterns (APIClient, TestCase, URL constants, helper factories)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Implemented Cart (OneToOneField per user) and CartItem models with unique_together constraint; generated migration 0001_initial
- Implemented 4 serializers: CartItemProductSerializer (lightweight product info for cart), CartItemSerializer (with line_price computed as Decimal), CartSerializer (with subtotal sum), CartMergeItemSerializer (input validation only)
- Implemented 4 views: CartView (GET), CartItemCreateView (POST), CartItemUpdateDeleteView (PATCH/DELETE), CartMergeView (POST); all require IsAuthenticated; all return full Cart on success
- _cart_response helper uses refresh_from_db() to guarantee fresh queryset after mutations
- Stock check returns HTTP 400 with code: "product_out_of_stock"; cross-user item access returns HTTP 404
- Uncommented orders.urls include in core/urls.py
- 19 new tests covering all ACs; 62 total tests pass, 0 regressions

### File List

- backend/orders/models.py
- backend/orders/serializers.py
- backend/orders/views.py
- backend/orders/urls.py
- backend/orders/tests.py
- backend/orders/migrations/0001_initial.py
- backend/core/urls.py

## Change Log

- 2026-05-05: Story 3.1 implemented — Cart/CartItem models, serializers, views, URLs, and 19 tests (Date: 2026-05-05)
