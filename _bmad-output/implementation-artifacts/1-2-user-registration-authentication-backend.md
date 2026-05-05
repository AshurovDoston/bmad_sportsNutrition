# Story 1.2: User Registration & Authentication Backend

Status: review

## Story

As a visitor,
I want to register and authenticate via secure API endpoints,
so that the platform can issue me a JWT and protect my account data.

## Acceptance Criteria

1. `POST /api/v1/auth/register/` with unique phone, valid name, and password returns HTTP 201 with `{id, name, phone}` — password never in response
2. `POST /api/v1/auth/register/` with an existing phone returns HTTP 400 with `{"error": "...", "code": "phone_already_registered", "details": {}}`
3. `POST /api/v1/auth/login/` with valid credentials returns HTTP 200 with `access_token` (24h TTL) in response body and `refresh_token` (7d TTL) as httpOnly cookie
4. `POST /api/v1/auth/login/` with invalid credentials returns HTTP 401 with `code: "invalid_credentials"`
5. `POST /api/v1/auth/token/refresh/` with valid refresh cookie returns a new `access_token`
6. `POST /api/v1/auth/logout/` with valid access token clears the refresh cookie and returns HTTP 200
7. 6+ failed login attempts within 60s from same IP returns HTTP 429 (django-ratelimit)
8. Passwords are hashed with Argon2 — never stored in plaintext
9. All error responses follow `{"error": "...", "code": "...", "details": {...}}` format

## Tasks / Subtasks

- [x] Task 1: CustomUser model (AC: #1, #8)
  - [x] Define `CustomUser` in `backend/accounts/models.py` extending `AbstractBaseUser` + `PermissionsMixin`
  - [x] Fields: `id` (BigAuto PK), `name` (CharField 150), `phone` (CharField 20, unique), `delivery_address` (TextField blank/null), `is_active` (default True), `is_staff` (default False), `date_joined` (auto_now_add)
  - [x] Create `CustomUserManager` with `create_user(phone, password, name, **extra)` and `create_superuser`
  - [x] Set `USERNAME_FIELD = 'phone'` and `REQUIRED_FIELDS = ['name']`
  - [x] Add `AUTH_USER_MODEL = 'accounts.CustomUser'` to `backend/core/settings/base.py`
  - [x] Run and commit migrations: `python manage.py makemigrations accounts`

- [x] Task 2: Serializers (AC: #1, #2, #9)
  - [x] `RegisterSerializer(serializers.ModelSerializer)` — fields: `name`, `phone`, `password` (write-only); `create()` calls `CustomUser.objects.create_user()`; validates unique phone with `code: "phone_already_registered"` error
  - [x] `UserProfileSerializer` — fields: `id`, `name`, `phone`; read-only (no password)
  - [x] `LoginSerializer(serializers.Serializer)` — fields: `phone`, `password`; `validate()` authenticates and returns user or raises with `code: "invalid_credentials"`
  - [x] All serializers in `backend/accounts/serializers.py`

- [x] Task 3: JWT configuration (AC: #3, #5)
  - [x] Add `SIMPLE_JWT` block to `backend/core/settings/base.py`:
    ```python
    from datetime import timedelta
    SIMPLE_JWT = {
        'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
        'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
        'ROTATE_REFRESH_TOKENS': False,
        'AUTH_HEADER_TYPES': ('Bearer',),
    }
    ```

- [x] Task 4: Views (AC: #1–#7, #9)
  - [x] `RegisterView(APIView)` — `POST`: validate `RegisterSerializer`, save user, return `UserProfileSerializer` data with HTTP 201; apply rate limit `'6/m'`
  - [x] `LoginView(APIView)` — `POST`: validate `LoginSerializer`, call `RefreshToken.for_user(user)`, return `access_token` in body + `refresh_token` httpOnly cookie (`Secure=False` in dev, `SameSite='Lax'`); apply rate limit `'6/m'`
  - [x] `LogoutView(APIView)` — `POST`: delete `refresh_token` cookie, return HTTP 200; requires `IsAuthenticated`
  - [x] `CookieTokenRefreshView(APIView)` — `POST`: read `refresh_token` from cookie, return new `access_token`; permission_classes=[]
  - [x] All views handle `Ratelimited` exception and return HTTP 429 with `code: "rate_limit_exceeded"`
  - [x] All error responses use `{"error": "...", "code": "...", "details": {...}}` — never raw DRF errors
  - [x] All views in `backend/accounts/views.py`

- [x] Task 5: URLs (AC: all)
  - [x] Wire up `backend/accounts/urls.py`:
    - `auth/register/` → `RegisterView`
    - `auth/login/` → `LoginView`
    - `auth/logout/` → `LogoutView`
    - `auth/token/refresh/` → `CookieTokenRefreshView`
  - [x] Uncomment `path('api/v1/', include('accounts.urls'))` in `backend/core/urls.py`

- [x] Task 6: Tests (AC: #1–#9)
  - [x] In `backend/accounts/tests.py` — cover: register success, register duplicate phone (400 + correct code), login success (access_token body + httpOnly cookie), login invalid creds (401 + correct code), logout clears cookie, token refresh with valid cookie, rate limit triggers 429
  - [x] Use `APIClient` from `rest_framework.test`
  - [x] Tests pass with `python manage.py test accounts`

- [x] Task 7: Verify
  - [x] `python manage.py migrate` — clean, no conflicts
  - [x] `python manage.py test accounts` — all tests pass
  - [x] Smoke test all 4 endpoints confirm expected status codes and response shapes

## Dev Notes

### CRITICAL: Set AUTH_USER_MODEL BEFORE first migration

Add `AUTH_USER_MODEL = 'accounts.CustomUser'` to `backend/core/settings/base.py` BEFORE running `makemigrations`. Story 1.1 already ran `migrate` using Django's built-in `auth.User`. To avoid conflict, wipe the postgres volume in Docker before migrating:

```bash
docker-compose down -v && docker-compose up -d
python manage.py makemigrations accounts
python manage.py migrate
```

### CustomUser — extend AbstractBaseUser, not AbstractUser

`AbstractUser` includes `username` field that conflicts with phone-as-identifier. Use `AbstractBaseUser` + `PermissionsMixin`:

```python
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class CustomUserManager(BaseUserManager):
    def create_user(self, phone, password, name, **extra_fields):
        if not phone:
            raise ValueError('Phone is required')
        user = self.model(phone=phone, name=name, **extra_fields)
        user.set_password(password)  # Argon2 hashing via PASSWORD_HASHERS in base.py
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password, name, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(phone, password, name, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, unique=True)
    delivery_address = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['name']

    objects = CustomUserManager()
```

### JWT token issuance (simplejwt)

```python
from rest_framework_simplejwt.tokens import RefreshToken

refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

response = Response({'access_token': access_token}, status=200)
response.set_cookie(
    key='refresh_token',
    value=str(refresh),
    httponly=True,
    samesite='Lax',
    secure=False,   # True in production
    max_age=7 * 24 * 60 * 60,
)
return response
```

### CookieTokenRefreshView — reads from cookie, not request body

simplejwt's default `TokenRefreshView` reads `refresh` from request body. Override to read cookie:

```python
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

class CookieTokenRefreshView(APIView):
    permission_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token missing', 'code': 'refresh_token_missing', 'details': {}},
                status=401
            )
        try:
            refresh = RefreshToken(refresh_token)
            return Response({'access_token': str(refresh.access_token)})
        except TokenError:
            return Response(
                {'error': 'Invalid or expired token', 'code': 'token_invalid', 'details': {}},
                status=401
            )
```

### Rate limiting — handle Ratelimited exception explicitly

django-ratelimit raises `Ratelimited` (a Django exception), which DRF's exception handler does not catch. Handle it in `dispatch()` on each rate-limited view:

```python
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
from django.utils.decorators import method_decorator

@method_decorator(ratelimit(key='ip', rate='6/m', method='POST', block=True), name='dispatch')
class LoginView(APIView):
    def dispatch(self, request, *args, **kwargs):
        try:
            return super().dispatch(request, *args, **kwargs)
        except Ratelimited:
            return Response(
                {'error': 'Too many requests', 'code': 'rate_limit_exceeded', 'details': {}},
                status=429
            )
```

Apply the same pattern to `RegisterView`.

### Error format — enforce consistently

Never return bare DRF validation errors. Always wrap:

```python
serializer = RegisterSerializer(data=request.data)
if not serializer.is_valid():
    return Response(
        {'error': 'Validation failed', 'code': 'validation_error', 'details': serializer.errors},
        status=400
    )
```

For duplicate phone specifically, the `RegisterSerializer` `validate_phone()` method should raise:
```python
raise serializers.ValidationError({'error': '...', 'code': 'phone_already_registered', 'details': {}})
```
Then the view wraps it per the pattern above.

### Argon2 — already configured in base.py (Story 1.1)

`PASSWORD_HASHERS` already has `Argon2PasswordHasher` first. `user.set_password(password)` uses it automatically. Do NOT change PASSWORD_HASHERS.

### core/urls.py — uncomment accounts line

```python
# Before (Story 1.1 left it commented):
# path('api/v1/', include('accounts.urls')),

# After:
path('api/v1/', include('accounts.urls')),
```

### Django admin — register CustomUser

`accounts/admin.py` requires a custom `UserAdmin` because the built-in `UserAdmin` references `username`:

```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ['phone', 'name', 'is_staff', 'date_joined']
    ordering = ['phone']
    fieldsets = (
        (None, {'fields': ('phone', 'password')}),
        ('Personal', {'fields': ('name', 'delivery_address')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {'fields': ('phone', 'name', 'password1', 'password2')}),
    )
    search_fields = ['phone', 'name']
```

### Anti-patterns to avoid

- ❌ Do NOT use `AbstractUser` — it brings `username` field conflicts
- ❌ Do NOT store the access token in any cookie — access token goes in response body only
- ❌ Do NOT use `camelCase` JSON keys in serializers — `snake_case` only
- ❌ Do NOT put validation/user creation logic in views — keep in serializers/managers
- ❌ Do NOT return password field in any serializer response
- ❌ Do NOT run `migrate` before setting `AUTH_USER_MODEL` in base.py
- ❌ Do NOT use simplejwt's default `TokenRefreshView` — it reads from request body, not cookie

### Project Structure Notes

Files to modify (all placeholders from Story 1.1):
- **MODIFY** `backend/accounts/models.py` — CustomUser + CustomUserManager
- **MODIFY** `backend/accounts/serializers.py` — RegisterSerializer, UserProfileSerializer, LoginSerializer
- **MODIFY** `backend/accounts/views.py` — RegisterView, LoginView, LogoutView, CookieTokenRefreshView
- **MODIFY** `backend/accounts/urls.py` — 4 auth URL patterns
- **MODIFY** `backend/accounts/admin.py` — CustomUserAdmin
- **MODIFY** `backend/accounts/tests.py` — 7+ test cases
- **MODIFY** `backend/core/settings/base.py` — add AUTH_USER_MODEL + SIMPLE_JWT block
- **MODIFY** `backend/core/urls.py` — uncomment accounts.urls include
- **CREATE** `backend/accounts/migrations/0001_initial.py` (via makemigrations)

All accounts logic in `backend/accounts/` — nothing in `core/`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — user story and acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — JWT, Argon2, rate limiting decisions
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — error format, snake_case requirement
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — accounts/ app location
- [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-docker-development-environment.md#Dev Notes] — existing base.py config (PASSWORD_HASHERS, REST_FRAMEWORK, INSTALLED_APPS already set)
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — anti-patterns to avoid

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fixed `test_register_duplicate_phone`: ModelSerializer auto-adds `UniqueValidator` for phone (unique=True), which fires before `validate_phone` with a generic 'unique' code. Fixed by setting `extra_kwargs = {'phone': {'validators': []}}` to disable the auto-validator and let our custom `validate_phone` produce the `phone_already_registered` code.

### Completion Notes List

- Implemented `CustomUser` model extending `AbstractBaseUser` + `PermissionsMixin` with phone as USERNAME_FIELD and Argon2 hashing
- Implemented 3 serializers: `RegisterSerializer`, `UserProfileSerializer`, `LoginSerializer`
- Implemented 4 views: `RegisterView`, `LoginView`, `LogoutView`, `CookieTokenRefreshView` — all with consistent error format `{"error", "code", "details"}`
- Rate limiting (6/m per IP) applied to Register and Login via `django-ratelimit` with `Ratelimited` exception caught in `dispatch()`
- `refresh_token` stored as httpOnly cookie; `access_token` returned in response body only
- `CookieTokenRefreshView` reads from cookie instead of request body (overrides simplejwt default)
- `CustomUserAdmin` registered with custom fieldsets (no username references)
- 9 tests covering all ACs — all pass (`python manage.py test accounts`)
- Migrations run clean after postgres volume reset (required because Story 1.1 had migrated with default auth.User)

### File List

- backend/core/settings/base.py
- backend/accounts/models.py
- backend/accounts/serializers.py
- backend/accounts/views.py
- backend/accounts/urls.py
- backend/accounts/admin.py
- backend/accounts/tests.py
- backend/core/urls.py
- backend/accounts/migrations/0001_initial.py

## Change Log

- 2026-05-05: Implemented Story 1.2 — CustomUser model, JWT auth endpoints (register/login/logout/token refresh), rate limiting, 9 tests all passing
