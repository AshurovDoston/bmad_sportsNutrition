# Story 4.1: Admin Product Management Backend

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an admin,
I want secure write-access API endpoints for managing the product catalog including certificate file uploads,
so that I can add, edit, and remove products and keep authenticity certificates current without touching the database directly.

## Acceptance Criteria

1. **Given** a user with `is_staff: true`, **When** `POST /api/v1/products/` is called with valid product data, **Then** the product is created and HTTP 201 is returned with the full product object (same shape as `GET /api/v1/products/{slug}/`).

2. **Given** an admin user, **When** `PATCH /api/v1/products/{slug}/` is called with one or more updated fields, **Then** only the submitted fields are updated and the full updated product is returned (HTTP 200).

3. **Given** an admin user, **When** `DELETE /api/v1/products/{slug}/` is called, **Then** the product is removed and HTTP 204 is returned with an empty body.

4. **Given** an admin user, **When** `POST /api/v1/products/{slug}/certificate/` is called with a multipart PDF or image file under the field name `certificate`, **Then** the file is saved to `MEDIA_ROOT` (demo) and the product's `certificate_url` in the response reflects the new file URL.

5. **Given** the file storage configuration, **When** the `STORAGE_BACKEND` environment variable is set to `spaces`, **Then** certificate and product image uploads are routed to DigitalOcean Spaces via `django-storages` — no application code changes required (configuration in `core/settings/base.py` only).

6. **Given** a non-admin user (`is_staff: false`) with a valid access token, **When** any write endpoint (`POST /api/v1/products/`, `PATCH /api/v1/products/{slug}/`, `DELETE /api/v1/products/{slug}/`, or `POST /api/v1/products/{slug}/certificate/`) is called, **Then** HTTP 403 is returned. **Given** an unauthenticated request, **Then** HTTP 401 is returned.

7. **Given** product creation or update, **When** `goal_categories` is submitted as an array of slugs, **Then** the product is linked to all matching `GoalCategory` records via `ProductGoalTag`; **When** any submitted slug does not exist, **Then** HTTP 400 is returned with `{"error": "...", "code": "invalid_goal_slug", "details": {"goal_categories": ["Unknown slug(s): <list>"]}}` and **no** changes are persisted.

8. **Given** a `stock_quantity` value submitted via `POST` or `PATCH`, **When** the value is `0`, **Then** `is_in_stock` is automatically set to `false` on the product record; **When** the value is `> 0`, **Then** `is_in_stock` is automatically set to `true`. Clients cannot override this invariant by sending `is_in_stock` directly (the field is read-only on write).

9. **Given** all read endpoints (`GET /api/v1/products/`, `GET /api/v1/products/{slug}/`, `GET /api/v1/goals/`), **When** accessed by anonymous or non-admin users, **Then** they remain publicly accessible (no regression on Story 2.1 behavior).

## Tasks / Subtasks

- [ ] Task 1: Add `django-storages` dependency and Spaces storage configuration (AC: 5)
  - [ ] Append `django-storages[s3]` to `backend/requirements.txt` (one line, no version pin — matches existing style)
  - [ ] Open `backend/core/settings/base.py` and append the storage block (see **Storage Configuration** in Dev Notes — verbatim) AFTER the existing `MEDIA_ROOT = BASE_DIR / 'media'` line
  - [ ] Append the Spaces env var documentation block to `backend/.env.example` (see **`.env.example` Additions** in Dev Notes — verbatim)
  - [ ] Run `pip install -r requirements.txt` inside the backend container (`docker-compose exec backend pip install -r requirements.txt`) so the new package is installed before tests run
  - [ ] Do NOT actually flip `STORAGE_BACKEND` to `spaces` in dev — the demo runs on `local`. Only verify `python manage.py check` passes with `STORAGE_BACKEND=local`.

- [ ] Task 2: Add `ProductWriteSerializer` to `backend/products/serializers.py` (AC: 1, 2, 7, 8)
  - [ ] Add imports for `GoalCategory`, `ProductGoalTag` from `.models` (extend existing import line)
  - [ ] Add `ProductWriteSerializer(serializers.ModelSerializer)` class — see verbatim definition in **ProductWriteSerializer** under Dev Notes
  - [ ] Field list: `id, name, slug, description, brand, price, stock_quantity, is_in_stock, nutrition_facts, sort_order, delivery_hours, goal_categories`
  - [ ] `goal_categories` is a write-only `ListField(child=SlugField())`
  - [ ] `id` and `is_in_stock` are read-only (AC: 8 — admins cannot override stock invariant)
  - [ ] Implement `validate_goal_categories` to verify every submitted slug exists in `GoalCategory`; on failure, raise `serializers.ValidationError({'error': '...', 'code': 'invalid_goal_slug', 'details': {...}})` (AC: 7)
  - [ ] Implement `create()` and `update()` per Dev Notes — both must (a) sync `ProductGoalTag` records to the submitted slug list, (b) apply the stock-quantity → `is_in_stock` invariant
  - [ ] Do NOT modify existing `GoalCategorySerializer`, `ProductImageSerializer`, `ProductReviewSerializer`, `ProductListSerializer`, or `ProductDetailSerializer`

- [ ] Task 3: Convert `ProductListView` to `ListCreateAPIView` and `ProductDetailView` to `RetrieveUpdateDestroyAPIView` (AC: 1, 2, 3, 6, 9)
  - [ ] Update imports in `backend/products/views.py`:
    ```python
    from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
    from rest_framework.permissions import AllowAny, IsAdminUser
    from rest_framework.response import Response
    from rest_framework import status
    from .serializers import GoalCategorySerializer, ProductListSerializer, ProductDetailSerializer, ProductWriteSerializer
    ```
  - [ ] Change `ProductListView(ListAPIView)` → `ProductListView(ListCreateAPIView)`; **keep all existing behavior intact** (filter_backends, filterset_class, search_fields, get_queryset, get_serializer_context for goal_slug)
  - [ ] Add `get_permissions()` override — `AllowAny` for safe methods, `IsAdminUser` for write methods (see Dev Notes)
  - [ ] Add `get_serializer_class()` override — `ProductWriteSerializer` for `POST`, `ProductListSerializer` for `GET`
  - [ ] Override `create()` to return `ProductDetailSerializer` shape (so the response matches `GET /api/v1/products/{slug}/`) — see Dev Notes
  - [ ] Change `ProductDetailView(RetrieveAPIView)` → `ProductDetailView(RetrieveUpdateDestroyAPIView)`
  - [ ] Add the same `get_permissions()` and `get_serializer_class()` overrides; for write methods return `ProductWriteSerializer`
  - [ ] Override `update()` to return `ProductDetailSerializer` shape (full product on response) — see Dev Notes
  - [ ] Do NOT change `GoalListView` (no admin write requirements on goals in this story)

- [ ] Task 4: Add `ProductCertificateUploadView` to `backend/products/views.py` (AC: 4, 6)
  - [ ] Add imports: `from rest_framework.views import APIView`, `from rest_framework.parsers import MultiPartParser, FormParser`, `from django.shortcuts import get_object_or_404`, `from .models import Product`
  - [ ] Implement `ProductCertificateUploadView(APIView)` per verbatim spec in Dev Notes
  - [ ] `permission_classes = [IsAdminUser]`
  - [ ] `parser_classes = [MultiPartParser, FormParser]`
  - [ ] `post(self, request, slug)`: validate `certificate` file is present, validate content type in `{application/pdf, image/jpeg, image/png}`, save to `product.certificate_file`, return updated product via `ProductDetailSerializer`
  - [ ] Reject unsupported content types with HTTP 400 + `code: "invalid_certificate_type"`

- [ ] Task 5: Register URLs in `backend/products/urls.py` (AC: 4)
  - [ ] Add `ProductCertificateUploadView` to the import line
  - [ ] Add `path('products/<slug:slug>/certificate/', ProductCertificateUploadView.as_view(), name='product-certificate-upload')` to `urlpatterns`
  - [ ] Existing 3 URL patterns (`goals/`, `products/`, `products/<slug:slug>/`) remain unchanged in path; the views they reference now support write methods via Tasks 3 and 4

- [ ] Task 6: Verify migrations are NOT needed
  - [ ] `Product.certificate_file` is `FileField(upload_to='certificates/')` — already in `0001_initial.py` (lines 38)
  - [ ] `is_in_stock` boolean field already exists
  - [ ] `goal_categories` M2M through `ProductGoalTag` already exists
  - [ ] Run `python manage.py makemigrations products --check` and confirm "No changes detected" — if migrations are detected, STOP and ask before proceeding (model changes are out of scope for this story)

- [ ] Task 7: Write tests in `backend/products/tests.py` (AC: 1, 2, 3, 4, 6, 7, 8, 9)
  - [ ] Add `from accounts.models import CustomUser` at the top
  - [ ] Add `from rest_framework_simplejwt.tokens import RefreshToken` (or use `force_authenticate` — pick whichever pattern matches `backend/orders/tests.py`)
  - [ ] Add helper functions at the top of the file (next to existing `make_goal` / `make_product`):
    ```python
    def make_admin(phone='+998901111111', password='adminpass', name='Admin'):
        return CustomUser.objects.create_user(phone=phone, password=password, name=name, is_staff=True)

    def make_regular_user(phone='+998902222222', password='userpass', name='User'):
        return CustomUser.objects.create_user(phone=phone, password=password, name=name)
    ```
  - [ ] Add `ProductAdminAuthTests` — anonymous + non-admin users get 401/403 on POST/PATCH/DELETE/certificate; existing read endpoints stay 200 for anonymous (AC: 6, 9)
  - [ ] Add `ProductCreateTests` — admin POST with valid data → 201, response shape matches detail, goal tags created (AC: 1, 7, 8)
  - [ ] Add `ProductUpdateTests` — admin PATCH partial fields → 200, only submitted fields change, goal_categories sync replaces tags (AC: 2, 7)
  - [ ] Add `ProductDeleteTests` — admin DELETE → 204, product gone (AC: 3)
  - [ ] Add `ProductStockInvariantTests` — POST/PATCH with `stock_quantity=0` sets `is_in_stock=false`; PATCH with `stock_quantity=10` on out-of-stock product sets `is_in_stock=true`; client-sent `is_in_stock` is ignored (AC: 8)
  - [ ] Add `ProductGoalSlugValidationTests` — POST/PATCH with unknown slug → 400 + `code: "invalid_goal_slug"`, no DB changes (AC: 7)
  - [ ] Add `ProductCertificateUploadTests` — admin uploads PDF → 200 with new `certificate_url`; uploads `.txt` file → 400; non-admin → 403 (AC: 4, 6)
  - [ ] Use `SimpleUploadedFile` from `django.core.files.uploadedfile` for file payloads (see Dev Notes for example)

- [ ] Task 8: Run the full backend test suite and confirm zero regressions
  - [ ] `docker-compose exec backend python manage.py test` — all existing tests in `products/`, `orders/`, `accounts/`, `content/` must continue to pass
  - [ ] Confirm new tests added in Task 7 all pass
  - [ ] `python manage.py check` — no system check warnings

## Dev Notes

### CRITICAL: This Story Modifies Read-Only Views — Do Not Break Existing Behavior

`ProductListView` and `ProductDetailView` are currently read-only (`AllowAny`, `ListAPIView` / `RetrieveAPIView`). Stories 2.1, 2.3, 2.4, 2.5 all rely on these endpoints returning HTTP 200 to anonymous users with the existing response shape. **You must convert these to support write methods without altering the GET behavior in any way.**

The `get_permissions()` + `get_serializer_class()` override pattern (instead of two separate views) is the chosen approach because:
1. The AC paths are exactly `POST /api/v1/products/` and `PATCH /api/v1/products/{slug}/` — same URLs as the existing reads
2. DRF's `ListCreateAPIView` and `RetrieveUpdateDestroyAPIView` are designed for exactly this dual-purpose use
3. Method-aware permissions are idiomatic DRF and well-tested in production

After your changes, the read tests in `ProductListTests`, `ProductDetailTests`, and `GoalListTests` (in `backend/products/tests.py`) MUST still pass without any modification. Treat any regression there as a story-blocker.

### Existing State of `backend/products/views.py` — Reference Before Editing

```python
# Current state (BEFORE this story):
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import GoalCategory, Product
from .serializers import GoalCategorySerializer, ProductListSerializer, ProductDetailSerializer
from .filters import ProductFilter


class ProductListView(ListAPIView):                    # ← becomes ListCreateAPIView
    permission_classes = [AllowAny]                    # ← removed (replaced by get_permissions)
    serializer_class = ProductListSerializer           # ← removed (replaced by get_serializer_class)
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'brand']

    def get_queryset(self):                            # ← KEEP unchanged
        return Product.objects.prefetch_related(...)

    def get_serializer_context(self):                  # ← KEEP unchanged
        ctx = super().get_serializer_context()
        ctx['goal_slug'] = self.request.query_params.get('goal')
        return ctx


class ProductDetailView(RetrieveAPIView):              # ← becomes RetrieveUpdateDestroyAPIView
    permission_classes = [AllowAny]                    # ← removed (replaced by get_permissions)
    serializer_class = ProductDetailSerializer         # ← removed (replaced by get_serializer_class)
    lookup_field = 'slug'                              # ← KEEP unchanged

    def get_queryset(self):                            # ← KEEP unchanged
        return Product.objects.prefetch_related(...)
```

### Complete `ProductListView` and `ProductDetailView` After Changes

```python
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.filters import SearchFilter
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .models import GoalCategory, Product
from .serializers import (
    GoalCategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductWriteSerializer,
)
from .filters import ProductFilter


class GoalListView(ListAPIView):
    permission_classes = [AllowAny]
    queryset = GoalCategory.objects.all()
    serializer_class = GoalCategorySerializer
    pagination_class = None


class ProductListView(ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'brand']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [IsAdminUser()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductWriteSerializer
        return ProductListSerializer

    def get_queryset(self):
        return Product.objects.prefetch_related(
            'goal_categories', 'goal_tags', 'goal_tags__goal', 'images'
        ).order_by('sort_order', 'name')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['goal_slug'] = self.request.query_params.get('goal')
        return ctx

    def create(self, request, *args, **kwargs):
        # Use ProductWriteSerializer for input validation/persistence,
        # then return ProductDetailSerializer shape for the response (AC: 1)
        write_serializer = self.get_serializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        product = write_serializer.save()
        read_serializer = ProductDetailSerializer(product, context={'request': request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class ProductDetailView(RetrieveUpdateDestroyAPIView):
    lookup_field = 'slug'

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [IsAdminUser()]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProductWriteSerializer
        return ProductDetailSerializer

    def get_queryset(self):
        return Product.objects.prefetch_related(
            'goal_categories', 'goal_tags', 'goal_tags__goal', 'images', 'reviews'
        )

    def update(self, request, *args, **kwargs):
        # Always partial-friendly; return full ProductDetailSerializer shape (AC: 2)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        write_serializer = self.get_serializer(instance, data=request.data, partial=partial)
        write_serializer.is_valid(raise_exception=True)
        product = write_serializer.save()
        read_serializer = ProductDetailSerializer(product, context={'request': request})
        return Response(read_serializer.data)


class ProductCertificateUploadView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    ALLOWED_TYPES = {'application/pdf', 'image/jpeg', 'image/png'}

    def post(self, request, slug):
        product = get_object_or_404(Product, slug=slug)
        upload = request.FILES.get('certificate')
        if not upload:
            return Response(
                {'error': 'Certificate file is required', 'code': 'certificate_missing', 'details': {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if upload.content_type not in self.ALLOWED_TYPES:
            return Response(
                {
                    'error': 'Unsupported certificate file type',
                    'code': 'invalid_certificate_type',
                    'details': {'allowed': sorted(self.ALLOWED_TYPES), 'received': upload.content_type},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        product.certificate_file = upload
        product.save(update_fields=['certificate_file'])
        return Response(
            ProductDetailSerializer(product, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )
```

**Why** `ListAPIView` is left in the imports: keeping it preserves backward-compat in case any other module imports it (none currently do, but the cost is one extra symbol).

**Why** `update()` reads `partial` from kwargs: `RetrieveUpdateDestroyAPIView` calls `self.update(request, *args, **kwargs, partial=True)` for PATCH. We honor that flag.

**Why** the response uses `ProductDetailSerializer` after write: AC1 says "the full product object". `ProductWriteSerializer` is intentionally narrow (no nested images/reviews); detail is the canonical product shape consumed by the frontend.

### `ProductWriteSerializer` — Verbatim Definition

Append to `backend/products/serializers.py`. Update the existing imports first:

```python
from .models import GoalCategory, Product, ProductGoalTag, ProductImage, ProductReview
```

Then append:

```python
class ProductWriteSerializer(serializers.ModelSerializer):
    goal_categories = serializers.ListField(
        child=serializers.SlugField(), write_only=True, required=False
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'brand', 'price',
            'stock_quantity', 'is_in_stock', 'nutrition_facts',
            'sort_order', 'delivery_hours', 'goal_categories',
        ]
        read_only_fields = ['id', 'is_in_stock']  # AC: 8 — derived from stock_quantity

    def validate_goal_categories(self, value):
        # AC: 7 — all submitted slugs must exist; surface unknown ones explicitly
        existing = set(
            GoalCategory.objects.filter(slug__in=value).values_list('slug', flat=True)
        )
        unknown = [slug for slug in value if slug not in existing]
        if unknown:
            raise serializers.ValidationError({
                'error': 'Unknown goal slug(s)',
                'code': 'invalid_goal_slug',
                'details': {'goal_categories': [f'Unknown slug(s): {", ".join(unknown)}']},
            })
        return value

    def _apply_stock_invariant(self, product):
        # AC: 8 — stock_quantity drives is_in_stock; admins cannot bypass it
        product.is_in_stock = product.stock_quantity > 0

    def _sync_goal_tags(self, product, slugs):
        # Replace the set of ProductGoalTag rows for this product with the submitted slugs.
        # Existing tags whose slug is still in the new list keep their why_this_works text;
        # newly added tags get an empty why_this_works (admin can edit later via direct
        # admin tooling — Story 4.2 will surface this in the UI).
        ProductGoalTag.objects.filter(product=product).exclude(goal__slug__in=slugs).delete()
        existing_slugs = set(
            ProductGoalTag.objects.filter(product=product).values_list('goal__slug', flat=True)
        )
        for slug in slugs:
            if slug in existing_slugs:
                continue
            goal = GoalCategory.objects.get(slug=slug)
            ProductGoalTag.objects.create(product=product, goal=goal, why_this_works='')

    def create(self, validated_data):
        slugs = validated_data.pop('goal_categories', [])
        product = Product(**validated_data)
        self._apply_stock_invariant(product)
        product.save()
        self._sync_goal_tags(product, slugs)
        return product

    def update(self, instance, validated_data):
        slugs = validated_data.pop('goal_categories', None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if 'stock_quantity' in validated_data:
            self._apply_stock_invariant(instance)
        instance.save()
        if slugs is not None:
            self._sync_goal_tags(instance, slugs)
        return instance
```

**Why** `goal_categories` is `write_only`: read serializers (`ProductListSerializer`, `ProductDetailSerializer`) already expose goal categories using their own `SerializerMethodField` shape (`list of slugs` on list, full join on detail). Exposing it on the write serializer too would create two competing "goal_categories" representations.

**Why** `is_in_stock` is read-only: AC8 makes it a derived field. If a client included `"is_in_stock": true` with `"stock_quantity": 0`, the invariant must still win. Marking it `read_only` ensures `validated_data` never carries it.

**Why** `_sync_goal_tags` preserves existing tag rows: existing tags carry the curated `why_this_works` copy displayed on product cards (FR3, FR44 — Story 2.3). Re-creating them on every PATCH would wipe that copy. Tags whose slug stays in the list are kept untouched; only newly added tags start blank.

**Why** `validate_goal_categories` raises a structured `ValidationError`: this matches the architecture's error format `{error, code, details}` (architecture.md "Format Patterns"). DRF preserves the dict shape in the 400 response.

### Storage Configuration — Append to `backend/core/settings/base.py`

Append after the `MEDIA_ROOT = BASE_DIR / 'media'` line (around line 95):

```python
# File storage backend — switch via STORAGE_BACKEND env var without code changes.
# 'local' (default): saves to MEDIA_ROOT (demo)
# 'spaces': routes to DigitalOcean Spaces / S3-compatible bucket via django-storages
STORAGE_BACKEND = os.getenv('STORAGE_BACKEND', 'local').lower()

if STORAGE_BACKEND == 'spaces':
    AWS_ACCESS_KEY_ID = os.getenv('SPACES_ACCESS_KEY')
    AWS_SECRET_ACCESS_KEY = os.getenv('SPACES_SECRET_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('SPACES_BUCKET')
    AWS_S3_ENDPOINT_URL = os.getenv('SPACES_ENDPOINT')  # e.g. https://fra1.digitaloceanspaces.com
    AWS_S3_REGION_NAME = os.getenv('SPACES_REGION', 'fra1')
    AWS_DEFAULT_ACL = 'public-read'
    AWS_QUERYSTRING_AUTH = False  # public URLs without expiring signatures
    STORAGES = {
        'default': {'BACKEND': 'storages.backends.s3.S3Storage'},
        'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
    }
# When STORAGE_BACKEND == 'local', Django's default FileSystemStorage applies — nothing to override.
```

**Why** `STORAGES` (not legacy `DEFAULT_FILE_STORAGE`): Django 6.0 (this project) uses the unified `STORAGES` dict introduced in Django 4.2 and required by 5.1+. The legacy setting is removed.

**Why** `storages.backends.s3.S3Storage` (not `s3boto3.S3Boto3Storage`): the `s3` backend is the modern, recommended one in `django-storages` ≥ 1.14 (released 2023). DigitalOcean Spaces is S3-compatible and works with this backend out of the box via the `AWS_S3_ENDPOINT_URL` override.

**Why** `AWS_QUERYSTRING_AUTH = False`: certificates and product images need stable, shareable URLs (the frontend caches them, the certificate is linked from the product detail page). Signed URLs would expire and break ISR caches.

**Why** the demo never flips this on: Story 5.1 (production deployment) is when Spaces gets configured for real. For Story 4.1 we only need the configuration *path* to be in place so that "no code changes required" (AC5) holds true.

### `.env.example` Additions

Append to `backend/.env.example` (under the existing `STORAGE_BACKEND=local` line):

```
# DigitalOcean Spaces (only used when STORAGE_BACKEND=spaces)
# SPACES_ACCESS_KEY=
# SPACES_SECRET_KEY=
# SPACES_BUCKET=
# SPACES_ENDPOINT=https://fra1.digitaloceanspaces.com
# SPACES_REGION=fra1
```

### URL Registration — `backend/products/urls.py` After Changes

```python
from django.urls import path
from .views import (
    GoalListView,
    ProductListView,
    ProductDetailView,
    ProductCertificateUploadView,
)

urlpatterns = [
    path('goals/', GoalListView.as_view(), name='goal-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/<slug:slug>/certificate/', ProductCertificateUploadView.as_view(), name='product-certificate-upload'),
]
```

Only **one** new path is added; the first three are unchanged (their views now also accept write methods, but the URL pattern itself is the same).

### `IsAdminUser` Behavior — What 401 vs 403 Look Like

DRF's `IsAdminUser` returns:
- **401** when there is no authenticated user (anonymous request)
- **403** when there is an authenticated user but `request.user.is_staff` is `False`

This is exactly what AC6 requires. No custom permission class is needed — use the built-in `from rest_framework.permissions import IsAdminUser`.

### Backend API Contract (Story 4.1)

```
POST /api/v1/products/
  Auth: Bearer <admin access_token> required
  Body (application/json):
    {
      "name": "New Whey",
      "slug": "new-whey",
      "description": "...",
      "brand": "Optimum",
      "price": "29.99",
      "stock_quantity": 10,
      "nutrition_facts": {"calories": 120},
      "sort_order": 1,
      "delivery_hours": 2,
      "goal_categories": ["muscle_gain", "general_health"]
    }
  Response 201: full product (ProductDetailSerializer shape)
  Response 400: {"error": "...", "code": "validation_error" | "invalid_goal_slug", "details": {...}}
  Response 401 / 403: as documented in AC6

PATCH /api/v1/products/{slug}/
  Auth: Bearer <admin access_token>
  Body (application/json) — any subset of writable fields:
    {"price": "27.99", "stock_quantity": 0}
  Response 200: full product (ProductDetailSerializer shape)

DELETE /api/v1/products/{slug}/
  Auth: Bearer <admin access_token>
  Response 204: empty body

POST /api/v1/products/{slug}/certificate/
  Auth: Bearer <admin access_token>
  Body (multipart/form-data):
    certificate: <file: PDF | JPEG | PNG>
  Response 200: full product (certificate_url updated)
  Response 400: {"error": "...", "code": "certificate_missing" | "invalid_certificate_type", "details": {...}}
```

### Tests — Skeleton for `backend/products/tests.py`

Append after the existing `SeedDataCommandTests` class. Reuse `make_goal` and `make_product` (already at the top of the file). Add the new helpers and test classes below.

```python
from django.core.files.uploadedfile import SimpleUploadedFile
from accounts.models import CustomUser

ADMIN_PRODUCTS_URL = '/api/v1/products/'


def make_admin(phone='+998901111111', password='adminpass', name='Admin'):
    return CustomUser.objects.create_user(
        phone=phone, password=password, name=name, is_staff=True
    )


def make_regular_user(phone='+998902222222', password='userpass', name='User'):
    return CustomUser.objects.create_user(phone=phone, password=password, name=name)


class ProductAdminAuthTests(TestCase):
    """AC 6, 9 — read stays public; write requires admin."""

    def setUp(self):
        self.client = APIClient()
        self.product = make_product()

    def test_anonymous_can_read_list(self):
        res = self.client.get(ADMIN_PRODUCTS_URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_anonymous_can_read_detail(self):
        res = self.client.get(f'{ADMIN_PRODUCTS_URL}{self.product.slug}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_anonymous_post_returns_401(self):
        res = self.client.post(ADMIN_PRODUCTS_URL, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_patch_returns_401(self):
        res = self.client.patch(f'{ADMIN_PRODUCTS_URL}{self.product.slug}/', {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_delete_returns_401(self):
        res = self.client.delete(f'{ADMIN_PRODUCTS_URL}{self.product.slug}/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_certificate_upload_returns_401(self):
        res = self.client.post(f'{ADMIN_PRODUCTS_URL}{self.product.slug}/certificate/', {})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_post_returns_403(self):
        self.client.force_authenticate(make_regular_user())
        res = self.client.post(ADMIN_PRODUCTS_URL, {'name': 'X'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_admin_patch_returns_403(self):
        self.client.force_authenticate(make_regular_user())
        res = self.client.patch(f'{ADMIN_PRODUCTS_URL}{self.product.slug}/', {'price': '1.00'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_admin_delete_returns_403(self):
        self.client.force_authenticate(make_regular_user())
        res = self.client.delete(f'{ADMIN_PRODUCTS_URL}{self.product.slug}/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_admin_certificate_upload_returns_403(self):
        self.client.force_authenticate(make_regular_user())
        upload = SimpleUploadedFile('cert.pdf', b'%PDF-1.4 fake', content_type='application/pdf')
        res = self.client.post(
            f'{ADMIN_PRODUCTS_URL}{self.product.slug}/certificate/',
            {'certificate': upload}, format='multipart',
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class ProductCreateTests(TestCase):
    """AC 1, 7, 8."""

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(make_admin())
        self.goal = make_goal()  # 'muscle_gain'

    def _payload(self, **overrides):
        payload = {
            'name': 'New Product',
            'slug': 'new-product',
            'description': 'A new supplement',
            'brand': 'NewBrand',
            'price': '19.99',
            'stock_quantity': 5,
            'nutrition_facts': {'calories': 100},
            'sort_order': 99,
            'delivery_hours': 2,
            'goal_categories': ['muscle_gain'],
        }
        payload.update(overrides)
        return payload

    def test_create_returns_201(self):
        res = self.client.post(ADMIN_PRODUCTS_URL, self._payload(), format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_response_has_detail_shape(self):
        res = self.client.post(ADMIN_PRODUCTS_URL, self._payload(), format='json')
        for field in ['id', 'name', 'slug', 'price', 'is_in_stock',
                      'goal_categories', 'primary_image_url', 'certificate_url',
                      'delivery_hours', 'why_this_works', 'description',
                      'nutrition_facts', 'images', 'reviews']:
            self.assertIn(field, res.data)

    def test_create_persists_goal_tags(self):
        self.client.post(ADMIN_PRODUCTS_URL, self._payload(), format='json')
        product = Product.objects.get(slug='new-product')
        slugs = list(product.goal_categories.values_list('slug', flat=True))
        self.assertEqual(slugs, ['muscle_gain'])

    def test_create_with_zero_stock_sets_is_in_stock_false(self):
        res = self.client.post(ADMIN_PRODUCTS_URL, self._payload(stock_quantity=0), format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res.data['is_in_stock'])

    def test_create_ignores_client_supplied_is_in_stock(self):
        # Client tries to bypass stock invariant
        payload = self._payload(stock_quantity=0)
        payload['is_in_stock'] = True
        res = self.client.post(ADMIN_PRODUCTS_URL, payload, format='json')
        self.assertFalse(res.data['is_in_stock'])


class ProductUpdateTests(TestCase):
    """AC 2, 7."""

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(make_admin())
        self.muscle = make_goal()
        self.fat_loss = make_goal(name='Fat Loss', slug='fat_loss', why='Burns fat')
        self.product = make_product()
        ProductGoalTag.objects.create(
            product=self.product, goal=self.muscle, why_this_works='Curated copy'
        )

    def test_patch_partial_updates_only_submitted_fields(self):
        res = self.client.patch(
            f'{ADMIN_PRODUCTS_URL}{self.product.slug}/',
            {'price': '49.99'}, format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(str(self.product.price), '49.99')
        self.assertEqual(self.product.name, 'Test Protein')  # unchanged

    def test_patch_goal_categories_replaces_set(self):
        res = self.client.patch(
            f'{ADMIN_PRODUCTS_URL}{self.product.slug}/',
            {'goal_categories': ['fat_loss']}, format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        slugs = list(self.product.goal_categories.values_list('slug', flat=True))
        self.assertEqual(slugs, ['fat_loss'])

    def test_patch_preserves_existing_why_this_works_for_kept_slugs(self):
        # Send a list that still includes 'muscle_gain' plus a new one
        self.client.patch(
            f'{ADMIN_PRODUCTS_URL}{self.product.slug}/',
            {'goal_categories': ['muscle_gain', 'fat_loss']}, format='json',
        )
        muscle_tag = ProductGoalTag.objects.get(product=self.product, goal=self.muscle)
        self.assertEqual(muscle_tag.why_this_works, 'Curated copy')


class ProductDeleteTests(TestCase):
    """AC 3."""

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(make_admin())
        self.product = make_product()

    def test_delete_returns_204(self):
        res = self.client.delete(f'{ADMIN_PRODUCTS_URL}{self.product.slug}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_product(self):
        self.client.delete(f'{ADMIN_PRODUCTS_URL}{self.product.slug}/')
        self.assertFalse(Product.objects.filter(slug=self.product.slug).exists())


class ProductStockInvariantTests(TestCase):
    """AC 8."""

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(make_admin())
        make_goal()

    def test_patch_stock_zero_marks_out_of_stock(self):
        product = make_product(name='In Stock', slug='in-stock-prod', price='10.00')
        product.stock_quantity = 5
        product.is_in_stock = True
        product.save()
        res = self.client.patch(
            f'{ADMIN_PRODUCTS_URL}{product.slug}/',
            {'stock_quantity': 0}, format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertFalse(product.is_in_stock)

    def test_patch_stock_positive_marks_in_stock(self):
        product = make_product(name='OOS', slug='oos-prod', price='10.00')
        product.stock_quantity = 0
        product.is_in_stock = False
        product.save()
        res = self.client.patch(
            f'{ADMIN_PRODUCTS_URL}{product.slug}/',
            {'stock_quantity': 7}, format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertTrue(product.is_in_stock)


class ProductGoalSlugValidationTests(TestCase):
    """AC 7."""

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(make_admin())
        make_goal()

    def test_post_unknown_slug_returns_400(self):
        payload = {
            'name': 'X', 'slug': 'x-prod', 'description': '', 'brand': 'B',
            'price': '1.00', 'stock_quantity': 1, 'nutrition_facts': {},
            'sort_order': 1, 'delivery_hours': 2,
            'goal_categories': ['does_not_exist'],
        }
        res = self.client.post(ADMIN_PRODUCTS_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        # Error code is nested under details when ValidationError raises a dict from a field validator
        self.assertIn('goal_categories', str(res.data))

    def test_post_unknown_slug_does_not_create_product(self):
        before = Product.objects.count()
        payload = {
            'name': 'X', 'slug': 'x-prod', 'description': '', 'brand': 'B',
            'price': '1.00', 'stock_quantity': 1, 'nutrition_facts': {},
            'sort_order': 1, 'delivery_hours': 2,
            'goal_categories': ['nonexistent'],
        }
        self.client.post(ADMIN_PRODUCTS_URL, payload, format='json')
        self.assertEqual(Product.objects.count(), before)


class ProductCertificateUploadTests(TestCase):
    """AC 4, 6."""

    def setUp(self):
        self.client = APIClient()
        self.product = make_product()

    def _url(self):
        return f'{ADMIN_PRODUCTS_URL}{self.product.slug}/certificate/'

    def test_admin_uploads_pdf_returns_200(self):
        self.client.force_authenticate(make_admin())
        upload = SimpleUploadedFile('cert.pdf', b'%PDF-1.4 fake', content_type='application/pdf')
        res = self.client.post(self._url(), {'certificate': upload}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(res.data['certificate_url'])
        self.product.refresh_from_db()
        self.assertTrue(self.product.certificate_file.name.startswith('certificates/'))

    def test_admin_uploads_image_returns_200(self):
        self.client.force_authenticate(make_admin())
        upload = SimpleUploadedFile('cert.jpg', b'\xff\xd8\xff fake', content_type='image/jpeg')
        res = self.client.post(self._url(), {'certificate': upload}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_admin_uploads_unsupported_type_returns_400(self):
        self.client.force_authenticate(make_admin())
        upload = SimpleUploadedFile('cert.txt', b'plain text', content_type='text/plain')
        res = self.client.post(self._url(), {'certificate': upload}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data['code'], 'invalid_certificate_type')

    def test_admin_omits_file_returns_400(self):
        self.client.force_authenticate(make_admin())
        res = self.client.post(self._url(), {}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data['code'], 'certificate_missing')
```

**Why** the tests use `force_authenticate` (not real JWT issuance): the existing `backend/orders/tests.py` and the cart tests use the same pattern — DRF's `force_authenticate` bypasses the auth middleware so we can validate permission logic in isolation. JWT issuance is exercised in `accounts/tests.py`.

**Why** `SimpleUploadedFile` (not real files): `django.core.files.uploadedfile.SimpleUploadedFile` is the canonical helper for upload tests; bytes are not validated as actual PDF/JPEG content (we only check `content_type`), so dummy bytes are fine.

### CRITICAL: Read These Files Before Editing

- `backend/products/views.py` — current state of `ProductListView`/`ProductDetailView`. The `prefetch_related`, `get_serializer_context` logic, and `lookup_field='slug'` MUST be preserved verbatim.
- `backend/products/serializers.py` — `ProductDetailSerializer` is what the response uses. Do not modify it. `goal_categories` on the read serializers is a `SerializerMethodField` — do not confuse with the new `ListField` on the write serializer.
- `backend/products/tests.py` — the existing `make_goal` and `make_product` helpers ARE intentionally minimal (no stock, no description, etc.). When tests need extra fields, set them on the returned instance and `.save()`.
- `backend/orders/views.py` — proven pattern for `IsAuthenticated` + atomic transactions + `get_object_or_404` + structured error responses. Mirror this style.
- `backend/orders/tests.py` — proven pattern for `force_authenticate` + APIClient + `@override_settings` (not needed here since we don't send email).
- `backend/accounts/models.py` — `CustomUser` has `is_staff` (line 25) — no migration needed for admin creation. `create_user(phone, password, name, is_staff=True)` works.
- `backend/core/settings/base.py` — `STORAGES` is the correct setting key for Django 6.0 (NOT `DEFAULT_FILE_STORAGE`).

### Library Versions in Play (verified from `requirements.txt` + `architecture.md`)

- Django 6.0.4 — uses `STORAGES` dict (Django ≥ 4.2 API; Django 5.1 removed legacy `DEFAULT_FILE_STORAGE`)
- Django REST Framework 3.17.1 — `ListCreateAPIView`, `RetrieveUpdateDestroyAPIView`, `IsAdminUser`, `MultiPartParser`, `FormParser` all present and stable
- `django-storages` (NEW dependency) — pin to `django-storages[s3]` to pick up boto3 + the modern `storages.backends.s3.S3Storage` backend. The legacy `s3boto3.S3Boto3Storage` is deprecated.
- `Pillow` — already installed; needed only for `ImageField` (no new image processing in this story).
- No new packages other than `django-storages`.

### Architecture Compliance Checklist

- All new endpoints prefixed `/api/v1/` (via `core/urls.py` include) ✓
- All response JSON uses `snake_case` keys ✓
- Error format: `{error, code, details}` for the validation paths we hand-format (AC 4, 7) ✓
- Backend domain: all changes live in `backend/products/` (no business logic in `core/`) ✓
- `is_staff` flag for RBAC, no custom permission classes ✓
- File storage abstracted via `STORAGE_BACKEND` env var — no code change to swap to Spaces (AC 5) ✓
- Pagination for read list unchanged (DRF `PageNumberPagination`, page_size=20) ✓

### Anti-Patterns to Avoid

- ❌ Creating a separate `AdminProductViewSet` and routing it to `/api/v1/admin/products/` — the AC URLs are `/api/v1/products/` for both read and write
- ❌ Using `camelCase` keys in the new write serializer (e.g. `goalCategories`) — must be `snake_case`
- ❌ Returning the `ProductWriteSerializer` shape from POST/PATCH — frontend (Story 4.2) expects `ProductDetailSerializer` shape
- ❌ Modifying `ProductListSerializer.get_goal_categories` or `get_certificate_url` — read serializers are out of scope
- ❌ Adding a migration "while we're at it" — model schema is unchanged for this story
- ❌ Using `DEFAULT_FILE_STORAGE` setting (legacy, removed in Django 5.1+) — use `STORAGES` dict
- ❌ Pinning `django-storages` to a major version that uses `s3boto3` — the modern `s3` backend is in 1.14+
- ❌ Wiping `ProductGoalTag.why_this_works` on every PATCH — preserve existing rows whose slug stays in the list

### Git Intelligence

Recent commit history (most relevant first):

- `dc685ac` feat: order history & delivery status — adds `OrderDetailView` with `get_object_or_404(Order, pk=pk, user=request.user)` 404-no-leak pattern. We use the same `get_object_or_404` for product-by-slug in the certificate upload view.
- `a50f7e5` feat: checkout & order creation backend — establishes the `validated_data` + `transaction.atomic` + structured error response pattern. Story 4.1 uses the same error shape but no transactions are needed (single-row writes through Django ORM are already atomic).
- `7380774` feat: Product & Goal Catalog Backend API (Story 2.1) — established the read views + serializers we are extending. Read those tests in `backend/products/tests.py` carefully before editing — do not regress them.
- `5b01385` feat: product image fetching command — confirms `ProductImage` and `Product.images` are the related-name pattern; we touch `Product.certificate_file` only.
- `31583ff` Refactor — confirms snake_case/PascalCase/kebab-case naming is enforced; do not introduce camelCase.

### Latest Tech Notes (verified May 2026)

- **DRF 3.17 `IsAdminUser`** — emits 401 for anonymous, 403 for authenticated-but-not-staff. No custom permission required.
- **django-storages** — `storages.backends.s3.S3Storage` (the recommended one as of 1.14) auto-loads `AWS_S3_ENDPOINT_URL` for non-AWS S3-compatible providers like DO Spaces.
- **Django 6.0 `STORAGES` dict** — `'default'` controls `MEDIA` (uploads), `'staticfiles'` controls `STATIC`. Setting only `default` is enough for our purpose.
- **`MultiPartParser` + `FormParser`** — must be set together to accept `multipart/form-data` with a file field (DRF's default `JSONParser` rejects multipart).

## Project Structure Notes

**Files to MODIFY (existing — preserve all current behavior):**

- `backend/products/views.py` — convert `ProductListView` → `ListCreateAPIView`, `ProductDetailView` → `RetrieveUpdateDestroyAPIView`; add `ProductCertificateUploadView`. Keep `GoalListView` and all read behavior unchanged.
- `backend/products/serializers.py` — APPEND `ProductWriteSerializer` after `ProductDetailSerializer`. Update existing `from .models import ...` line to add `GoalCategory` and `ProductGoalTag`.
- `backend/products/urls.py` — add `ProductCertificateUploadView` to imports and one new `path()` entry.
- `backend/products/tests.py` — APPEND new test classes after `SeedDataCommandTests`. Add `make_admin` and `make_regular_user` helpers next to existing `make_product` / `make_goal`.
- `backend/core/settings/base.py` — APPEND `STORAGES` block after `MEDIA_ROOT` line. Don't touch other sections.
- `backend/.env.example` — APPEND DO Spaces variables under existing `STORAGE_BACKEND=local` line.
- `backend/requirements.txt` — APPEND `django-storages[s3]` line.

**Files NOT touched:**

- `backend/products/models.py` — schema unchanged
- `backend/products/filters.py` — read filters unchanged
- `backend/products/admin.py` — Django admin unchanged
- `backend/products/migrations/` — no new migration
- `backend/core/urls.py` — `products.urls` is already wired in
- `backend/core/settings/dev.py` and `prod.py` — only `base.py` carries the storage block; both inherit
- `backend/orders/`, `backend/accounts/`, `backend/content/` — out of scope
- `frontend/` — Story 4.2 covers the admin UI; Story 4.1 is backend-only

**No frontend changes in this story.** This is intentional — the admin UI (`/admin/products`, `/admin/products/new`, etc.) lands in Story 4.2.

**Naming conventions (architecture-enforced):**

- API JSON keys: `snake_case` everywhere (e.g. `goal_categories`, `stock_quantity`, `is_in_stock`)
- Django apps and Python files: `snake_case`
- Python classes: `PascalCase` (`ProductWriteSerializer`, `ProductCertificateUploadView`)
- URL paths: plural nouns (`/products/`, `/products/{slug}/certificate/`)

### Alignment with Unified Project Structure

- All product-domain code stays under `backend/products/` per architecture.md "Backend — one Django app per domain"
- File-storage configuration centralizes in `backend/core/settings/base.py` per "All backend business logic in domain apps; no business logic in core/" — note that *config* (not business logic) belongs in `core/settings/` by design
- New URL appended to existing `backend/products/urls.py` (not a separate admin-only urls module) — matches "domain backend apps map 1:1 to frontend feature folders"
- `IsAdminUser` (built-in DRF) matches architecture decision "Admin RBAC: Django `is_staff` flag + custom `IsAdminUser` DRF permission" (we use the built-in one — it's identical in behavior)

### Detected Conflicts or Variances

None. All ACs map to existing architectural decisions. The only externally-visible change to existing endpoints is that `ProductListView` and `ProductDetailView` now also accept write methods (POST/PATCH/DELETE) — read behavior is unchanged.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1] — Acceptance criteria verbatim
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — "Admin RBAC: Django `is_staff` flag + custom `IsAdminUser` DRF permission"
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — "File storage (demo): Local filesystem (MEDIA_ROOT)"; "File storage (prod): DigitalOcean Spaces (S3-compatible) via django-storages — Same API as S3; swap backend via STORAGE_BACKEND env var; no code changes"
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Error format `{error, code, details}`
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — `snake_case` API keys, plural noun resources
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns] — Pagination, single-object response shape
- [Source: backend/products/models.py] — `Product`, `GoalCategory`, `ProductGoalTag`, `ProductImage`, `ProductReview` (no schema change)
- [Source: backend/products/views.py] — Existing `ProductListView`, `ProductDetailView`, `GoalListView` to extend
- [Source: backend/products/serializers.py] — Existing `ProductListSerializer`, `ProductDetailSerializer` (response shape for POST/PATCH); new `ProductWriteSerializer` to append
- [Source: backend/products/urls.py] — Existing 3 paths; one new path to add
- [Source: backend/products/tests.py] — Existing `make_goal`, `make_product` helpers; new `make_admin`/`make_regular_user` to add
- [Source: backend/products/migrations/0001_initial.py] — Confirms `certificate_file = FileField(upload_to='certificates/')` already exists
- [Source: backend/accounts/models.py:25] — `CustomUser.is_staff` boolean field
- [Source: backend/orders/views.py] — Pattern: `IsAuthenticated` + `get_object_or_404` + structured `{error, code, details}` responses; `OrderCreateView` is the closest precedent for write endpoint style
- [Source: backend/orders/tests.py] — Pattern: `force_authenticate` + APIClient
- [Source: backend/core/urls.py:12] — `path('api/v1/', include('products.urls'))` already active — no root-URL changes needed
- [Source: backend/core/settings/base.py] — `STORAGES` block to append; `MEDIA_ROOT` already configured; `REST_FRAMEWORK` defaults applied to all views
- [Source: backend/requirements.txt] — Pillow already installed; one new line for `django-storages[s3]`
- [Source: backend/.env.example] — `STORAGE_BACKEND=local` already documented; append Spaces variables
- [Source: _bmad-output/implementation-artifacts/3-3-checkout-order-creation-backend.md] — Closest precedent for backend-write story style; mirror the file-list and append-only patterns
- [Source: _bmad-output/implementation-artifacts/3-5-order-history-delivery-status.md#Backend: 404 for Wrong User] — Uses `get_object_or_404` for safe lookups; same approach for product-by-slug here

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-05-06: Story 4.1 created — comprehensive admin product management backend implementation guide (epic 4 kickoff)
