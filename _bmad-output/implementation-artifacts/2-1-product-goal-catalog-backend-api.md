# Story 2.1: Product & Goal Catalog Backend API

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want a fully operational product catalog API with goal filtering, brand/price filtering, and certificate support,
so that the frontend can retrieve curated, goal-tagged products and display authenticity data.

## Acceptance Criteria

1. **Given** the backend is running, **When** `GET /api/v1/goals/` is called, **Then** the 4 goal categories (Muscle Gain, Fat Loss, Endurance, General Health) are returned with `id`, `name`, `slug`, and `why_it_works` description.
2. **Given** the product catalog exists, **When** `GET /api/v1/products/` is called, **Then** a paginated list of products is returned with `id`, `name`, `slug`, `price`, `is_in_stock`, `goal_categories`, `primary_image_url`, `certificate_url`, `delivery_hours`, and `why_this_works`.
3. **Given** products with goal tags, **When** `GET /api/v1/products/?goal=muscle_gain` is called, **Then** only products tagged with that goal are returned, ranked by `sort_order`.
4. **Given** products in the catalog, **When** `GET /api/v1/products/?brand=optimum&min_price=10&max_price=50` is called, **Then** only matching products are returned (django-filter).
5. **Given** a specific product slug, **When** `GET /api/v1/products/{slug}/` is called, **Then** the full product detail is returned including `nutrition_facts`, `description`, `images`, `certificate_url`, `reviews`, and all goal tags.
6. **Given** the API, **When** `GET /api/v1/schema/` and `GET /api/v1/docs/` are accessed, **Then** the OpenAPI 3.0 schema renders correctly via drf-spectacular.
7. **Given** all product catalog endpoints, **When** accessed by an unauthenticated user, **Then** they are publicly accessible — no auth required for read.

## Tasks / Subtasks

- [x] Task 1: Create models in `backend/products/models.py` (AC: 1, 2, 3, 4, 5)
  - [x] Create `GoalCategory` model: `id`, `name` (CharField 100), `slug` (SlugField unique), `why_it_works` (TextField)
  - [x] Create `Product` model: `id`, `name` (200), `slug` (SlugField unique), `description` (TextField), `brand` (CharField 100), `price` (DecimalField max_digits=10 decimal_places=2), `stock_quantity` (PositiveIntegerField default=0), `is_in_stock` (BooleanField default=True), `nutrition_facts` (JSONField default=dict), `sort_order` (IntegerField default=0), `delivery_hours` (IntegerField default=2), `goal_categories` (ManyToManyField GoalCategory through='ProductGoalTag'), `certificate_file` (FileField upload_to='certificates/' blank=True null=True), `created_at` (DateTimeField auto_now_add=True); Meta: `ordering = ['sort_order', 'name']`
  - [x] Create `ProductGoalTag` through model: `product` (FK Product CASCADE related_name='goal_tags'), `goal` (FK GoalCategory CASCADE), `why_this_works` (TextField); Meta: `unique_together = [['product', 'goal']]`
  - [x] Create `ProductImage` model: `product` (FK Product CASCADE related_name='images'), `image` (ImageField upload_to='products/'), `is_primary` (BooleanField default=False); Meta: `ordering = ['-is_primary']`
  - [x] Create `ProductReview` model: `product` (FK Product CASCADE related_name='reviews'), `reviewer_name` (CharField 100), `rating` (IntegerField — validated 1-5 by serializer), `review_text` (TextField), `is_verified` (BooleanField default=False), `photo` (ImageField upload_to='reviews/' blank=True null=True), `created_at` (DateTimeField auto_now_add=True)
- [x] Task 2: Create and run migrations (AC: all)
  - [x] Create `backend/products/migrations/__init__.py` (empty)
  - [x] Run `python manage.py makemigrations products` inside backend container
  - [x] Run `python manage.py migrate` to apply
- [x] Task 3: Create serializers in `backend/products/serializers.py` (AC: 1, 2, 5)
  - [x] `GoalCategorySerializer`: fields `['id', 'name', 'slug', 'why_it_works']`, read-only
  - [x] `ProductReviewSerializer`: fields `['id', 'reviewer_name', 'rating', 'review_text', 'is_verified', 'photo']`; add `get_photo` SerializerMethodField that returns `request.build_absolute_uri(photo.url)` or None
  - [x] `ProductListSerializer`: fields `['id', 'name', 'slug', 'price', 'is_in_stock', 'goal_categories', 'primary_image_url', 'certificate_url', 'delivery_hours', 'why_this_works']`; all via SerializerMethodField where needed (see Dev Notes for exact implementations)
  - [x] `ProductDetailSerializer` extends `ProductListSerializer`: add `description`, `nutrition_facts`, `images` (nested `ProductImageSerializer`), `reviews` (nested `ProductReviewSerializer`)
  - [x] `ProductImageSerializer`: fields `['id', 'image_url', 'is_primary']`; `image_url` SerializerMethodField using `request.build_absolute_uri`
- [x] Task 4: Create filter in `backend/products/filters.py` (AC: 3, 4)
  - [x] `ProductFilter(django_filters.FilterSet)`: `goal` = CharFilter on `goal_categories__slug` with `lookup_expr='iexact'`; `brand` = CharFilter `lookup_expr='icontains'`; `min_price` = NumberFilter on `price` `lookup_expr='gte'`; `max_price` = NumberFilter on `price` `lookup_expr='lte'`; Meta: `model=Product`, `fields=['goal','brand','min_price','max_price']`
  - [x] `import django_filters` and `from .models import Product`
- [x] Task 5: Create views in `backend/products/views.py` (AC: 1, 2, 3, 4, 5, 7)
  - [x] `GoalListView(ListAPIView)`: `permission_classes=[AllowAny]`, `queryset=GoalCategory.objects.all()`, `serializer_class=GoalCategorySerializer`, `pagination_class=None`
  - [x] `ProductListView(ListAPIView)`: `permission_classes=[AllowAny]`, queryset with `prefetch_related('goal_categories','goal_tags','goal_tags__goal','images')`, `serializer_class=ProductListSerializer`, `filter_backends=[DjangoFilterBackend]`, `filterset_class=ProductFilter`; override `get_serializer_context` to pass `goal_slug=request.query_params.get('goal')`
  - [x] `ProductDetailView(RetrieveAPIView)`: `permission_classes=[AllowAny]`, queryset with `prefetch_related('goal_categories','goal_tags','goal_tags__goal','images','reviews')`, `serializer_class=ProductDetailSerializer`, `lookup_field='slug'`
- [x] Task 6: Create URL routing in `backend/products/urls.py` (AC: 1, 2, 3, 4, 5)
  - [x] Replace current DefaultRouter skeleton with direct `path()` entries:
    - `path('goals/', GoalListView.as_view(), name='goal-list')`
    - `path('products/', ProductListView.as_view(), name='product-list')`
    - `path('products/<slug:slug>/', ProductDetailView.as_view(), name='product-detail')`
  - [x] Import `GoalListView`, `ProductListView`, `ProductDetailView` from `.views`
- [x] Task 7: Update `backend/core/urls.py` (AC: 2, 3, 4, 5, 6)
  - [x] Uncomment `path('api/v1/', include('products.urls'))` line
  - [x] Add drf-spectacular endpoints: `path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema')` and `path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui')`
  - [x] Import `SpectacularAPIView, SpectacularSwaggerView` from `drf_spectacular.views`
- [x] Task 8: Register models in `backend/products/admin.py` (AC: supporting)
  - [x] Register `GoalCategory`, `Product`, `ProductGoalTag`, `ProductImage`, `ProductReview` with `admin.site.register()`
  - [x] Add `list_display` for at least Product: `['name', 'slug', 'brand', 'price', 'is_in_stock', 'sort_order']`
- [x] Task 9: Write backend tests in `backend/products/tests.py` (AC: 1–7)
  - [x] Goal list: `GET /api/v1/goals/` → 200, returns list with `id/name/slug/why_it_works` fields
  - [x] Goal list no auth required: unauthenticated request → 200 (not 401)
  - [x] Product list: `GET /api/v1/products/` → 200, paginated (`results`, `count`, `next`, `previous`)
  - [x] Product list fields: response items contain `id,name,slug,price,is_in_stock,goal_categories,primary_image_url,certificate_url,delivery_hours,why_this_works`
  - [x] Goal filter: `GET /api/v1/products/?goal=muscle_gain` → only products tagged with `muscle_gain` returned
  - [x] Brand filter: `GET /api/v1/products/?brand=TestBrand` → only matching brand returned
  - [x] Price filter: `GET /api/v1/products/?min_price=10&max_price=50` → only products in price range
  - [x] Product detail: `GET /api/v1/products/{slug}/` → 200, contains `nutrition_facts,description,images,reviews`
  - [x] Product detail 404: `GET /api/v1/products/does-not-exist/` → 404
  - [x] Product detail no auth required: unauthenticated → 200
  - [x] Schema endpoint: `GET /api/v1/schema/` → 200

## Dev Notes

### Critical Architecture Context

**Stack versions:**
- Django 6.0.4, DRF 3.17.1, `django_filters` (already in `INSTALLED_APPS`), `drf_spectacular` (already in `INSTALLED_APPS`), `Pillow` (already installed — required for ImageField)
- `DjangoFilterBackend` must be imported from `django_filters.rest_framework`, not `rest_framework.filters`

**CORS and auth:** All product/goal endpoints use `permission_classes = [AllowAny]`. The existing `JWTAuthentication` in `DEFAULT_AUTHENTICATION_CLASSES` will still try to read the token — this is fine; it just won't block anonymous requests when `AllowAny` is set.

**Pagination:** `DEFAULT_PAGINATION_CLASS = 'rest_framework.pagination.PageNumberPagination'` and `PAGE_SIZE = 20` are already configured in `base.py`. Product list will automatically paginate. **Goals list must set `pagination_class = None`** — there are only 4 goals and frontend needs them unpaginated.

### Model Implementation Details

**Why a through table (`ProductGoalTag`) instead of direct M2M:**
The AC requires per-goal `why_this_works` text on each product (different text for "Why this works for Muscle Gain" vs "Why this works for Fat Loss"). A simple M2M cannot store this extra field — a through table is the correct Django pattern.

**`is_in_stock` auto-update:** Story 4.1 will add a signal/override to auto-set `is_in_stock=False` when `stock_quantity=0`. For this story, `is_in_stock` is set manually. Do NOT add that logic here.

**`certificate_file` field:** Uses `FileField` (not `ImageField`) because certificates can be PDFs. Pillow is already installed but only needed for `ImageField` (product/review photos).

### Serializer Implementation Details

**`ProductListSerializer` — exact SerializerMethodField implementations:**

```python
class ProductListSerializer(serializers.ModelSerializer):
    goal_categories = serializers.SerializerMethodField()
    primary_image_url = serializers.SerializerMethodField()
    certificate_url = serializers.SerializerMethodField()
    why_this_works = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'price', 'is_in_stock',
                  'goal_categories', 'primary_image_url', 'certificate_url',
                  'delivery_hours', 'why_this_works']

    def get_goal_categories(self, obj):
        return list(obj.goal_categories.values_list('slug', flat=True))

    def get_primary_image_url(self, obj):
        primary = obj.images.filter(is_primary=True).first() or obj.images.first()
        if primary and primary.image:
            request = self.context.get('request')
            return request.build_absolute_uri(primary.image.url) if request else primary.image.url
        return None

    def get_certificate_url(self, obj):
        if obj.certificate_file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.certificate_file.url) if request else obj.certificate_file.url
        return None

    def get_why_this_works(self, obj):
        goal_slug = self.context.get('goal_slug')
        if goal_slug:
            tag = obj.goal_tags.filter(goal__slug=goal_slug).first()
            if tag:
                return tag.why_this_works
        tag = obj.goal_tags.first()
        return tag.why_this_works if tag else ''
```

**`ProductDetailSerializer`** extends `ProductListSerializer`, adds:
```python
class ProductDetailSerializer(ProductListSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            'description', 'nutrition_facts', 'images', 'reviews'
        ]
```

**`ProductImageSerializer`:**
```python
class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'is_primary']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None
```

**`ProductReviewSerializer`:**
```python
class ProductReviewSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = ['id', 'reviewer_name', 'rating', 'review_text', 'is_verified', 'photo_url']

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url
        return None
```

### View Implementation Details

**`ProductListView` — passing goal_slug to serializer context:**
```python
class ProductListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductFilter

    def get_queryset(self):
        return Product.objects.prefetch_related(
            'goal_categories', 'goal_tags', 'goal_tags__goal', 'images'
        ).order_by('sort_order', 'name')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['goal_slug'] = self.request.query_params.get('goal')
        return ctx
```

**`ProductDetailView`:**
```python
class ProductDetailView(RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return Product.objects.prefetch_related(
            'goal_categories', 'goal_tags', 'goal_tags__goal', 'images', 'reviews'
        )
```

### URL Routing Details

**`backend/products/urls.py` — replace entire file:**
```python
from django.urls import path
from .views import GoalListView, ProductListView, ProductDetailView

urlpatterns = [
    path('goals/', GoalListView.as_view(), name='goal-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
]
```

**`backend/core/urls.py` — final state:**
```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from .views import health_check

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/v1/health/', health_check, name='health-check'),
    path('api/v1/', include('accounts.urls')),
    path('api/v1/', include('products.urls')),
    # path('api/v1/', include('orders.urls')),   # Story 3
    # path('api/v1/', include('content.urls')),  # Story 4
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### Goal Slug Conflict — CRITICAL

**The `frontend/src/lib/constants.ts` has WRONG goal slugs:**

| Current (wrong) | Correct (per PRD/AC) |
|---|---|
| `muscle-gain` | `muscle_gain` |
| `weight-loss` | `fat_loss` |
| `endurance` | `endurance` ✓ |
| `recovery` | `general_health` |

The AC example uses `?goal=muscle_gain` (underscores). The backend slugs being created in this story are: `muscle_gain`, `fat_loss`, `endurance`, `general_health`.

**DO NOT update `constants.ts` in this story** — that file is owned by the frontend and will be corrected in Story 2.3. This story creates the canonical backend slugs. The seed command (Story 2.2) will use these exact slugs.

### Test Setup Pattern

Follow the exact pattern from `backend/accounts/tests.py`:

```python
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from .models import GoalCategory, Product, ProductGoalTag

GOALS_URL = '/api/v1/goals/'
PRODUCTS_URL = '/api/v1/products/'

def make_goal(name='Muscle Gain', slug='muscle_gain', why='Builds protein synthesis'):
    return GoalCategory.objects.create(name=name, slug=slug, why_it_works=why)

def make_product(name='Test Protein', slug='test-protein', brand='TestBrand', price='29.99'):
    return Product.objects.create(name=name, slug=slug, brand=brand, price=price)

class GoalListTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.goal = make_goal()
    # tests...

class ProductListTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.goal = make_goal()
        self.product = make_product()
        ProductGoalTag.objects.create(product=self.product, goal=self.goal, why_this_works='Great for goals')
    # tests...
```

**All tests use `APIClient()` without `force_authenticate` — endpoints are public.**

### What This Story Does NOT Implement

- Search (`?search=`) — Story 2.5
- Category filter beyond goals — Story 2.5
- `is_in_stock` auto-update on stock_quantity=0 — Story 4.1
- Product WRITE endpoints (POST/PATCH/DELETE) — Story 4.1
- Certificate file upload endpoint — Story 4.1
- Pagination on goals endpoint (intentionally `pagination_class = None`)

### Project Structure Notes

- All products logic in `backend/products/` — no new apps
- `backend/products/migrations/` directory does NOT exist yet — must create it with `__init__.py` before running `makemigrations`
- `products` app is already in `INSTALLED_APPS` in `base.py` (line 27)
- `django_filters` is in `INSTALLED_APPS` as `'django_filters'` (not `'django_filters.rest_framework'`)
- `DjangoFilterBackend` import: `from django_filters.rest_framework import DjangoFilterBackend`
- Use `ListAPIView` and `RetrieveAPIView` from `rest_framework.generics` (not `ModelViewSet` — the skeleton import should be replaced)
- Use `AllowAny` from `rest_framework.permissions`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — Acceptance Criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — backend app structure, products/ app layout
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns] — pagination format, error format
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — snake_case JSON keys, plural noun endpoints
- [Source: backend/core/settings/base.py] — INSTALLED_APPS (products, django_filters, drf_spectacular), REST_FRAMEWORK config
- [Source: backend/core/urls.py] — current state (products.urls commented out, no drf-spectacular)
- [Source: backend/products/models.py] — currently empty (only `from django.db import models`)
- [Source: backend/accounts/tests.py] — test patterns to follow (APIClient, TestCase, helper functions)
- [Source: frontend/src/lib/constants.ts] — goal slugs are WRONG and will be fixed in Story 2.3

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No blockers encountered. All 16 new tests passed on first run. Full regression suite (30 tests) passed with zero failures.

### Completion Notes List

- Implemented 5 Django models: GoalCategory, Product, ProductGoalTag (through table), ProductImage, ProductReview
- Created initial migration (0001_initial.py) and applied to database
- Implemented 4 serializers: GoalCategorySerializer, ProductImageSerializer, ProductReviewSerializer, ProductListSerializer, ProductDetailSerializer — all using SerializerMethodField for computed fields
- Created ProductFilter with goal (iexact on slug), brand (icontains), min_price/max_price filters
- Implemented 3 views: GoalListView (unpaginated), ProductListView (paginated + filtered + goal_slug context), ProductDetailView (by slug)
- Updated products/urls.py to direct path() entries, replacing DefaultRouter skeleton
- Updated core/urls.py: added products.urls include + drf-spectacular schema/docs endpoints
- Registered all 5 models in admin with Product having list_display
- 16 tests covering all 7 ACs including auth, pagination, filtering, 404, and schema endpoint
- drf-spectacular warnings on SerializerMethodField type hints are cosmetic only and do not affect functionality

### File List

- backend/products/models.py
- backend/products/serializers.py
- backend/products/filters.py
- backend/products/views.py
- backend/products/urls.py
- backend/products/admin.py
- backend/products/tests.py
- backend/products/migrations/__init__.py
- backend/products/migrations/0001_initial.py
- backend/core/urls.py

## Change Log

- 2026-05-05: Created story file with comprehensive backend implementation guide for products/goals catalog API.
- 2026-05-05: Implemented story — all 9 tasks complete. Models, migrations, serializers, filters, views, URLs, admin, and tests. 16/16 tests pass, 30/30 full regression suite passes. Status → review.
