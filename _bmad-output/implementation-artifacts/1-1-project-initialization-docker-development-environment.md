# Story 1.1: Project Initialization & Docker Development Environment

Status: ready-for-dev

## Story

As a developer,
I want a fully initialized project structure with Docker-compose running postgres, backend, and frontend services,
so that development can start immediately with a consistent, reproducible environment.

## Acceptance Criteria

1. `docker-compose up` starts all three services (postgres, Django backend, Next.js frontend) without manual steps beyond copying `.env.example` files
2. `GET /api/v1/health/` returns HTTP 200 with body `{"status": "ok"}`
3. Django migrations run cleanly on container startup with no errors
4. GitHub Actions CI pipeline configured at `.github/workflows/ci.yml` running check/test/build steps on every PR
5. `.env.example` files present for both `backend/` and `frontend/` with all required variables documented

## Tasks / Subtasks

- [ ] Task 1: Root project scaffold (AC: #1, #4, #5)
  - [ ] Create `docker-compose.yml` at project root with postgres, backend, frontend services
  - [ ] Create `.gitignore` covering Python/Node/media/env files
  - [ ] Create `README.md` with setup instructions (`docker-compose up`, env file setup, health check)
  - [ ] Create `.github/workflows/ci.yml` with lint/test/build steps

- [ ] Task 2: Django backend initialization (AC: #2, #3, #5)
  - [ ] Create `backend/` directory and run `django-admin startproject core .` inside it
  - [ ] Create `backend/requirements.txt` (see Dev Notes for full package list)
  - [ ] Create `backend/Dockerfile`
  - [ ] Create `backend/.env.example` (see Dev Notes for required variables)
  - [ ] Replace generated `core/settings.py` with split settings: `core/settings/__init__.py`, `base.py`, `dev.py`, `prod.py`
  - [ ] Update `core/urls.py` to route `/api/v1/` and include health check
  - [ ] Create `core/views.py` with `health_check` view
  - [ ] Create empty domain apps with full scaffolding (models.py, views.py, urls.py, serializers.py, tests.py, admin.py): `products/`, `orders/`, `accounts/`, `content/`
  - [ ] Register all domain apps in `INSTALLED_APPS` (base.py)
  - [ ] Configure CORS, DRF, database in base.py

- [ ] Task 3: Next.js frontend initialization (AC: #1, #5)
  - [ ] Run `npx create-next-app@latest frontend --ts --tailwind --app --src-dir --eslint --import-alias "@/*"` (Next.js 16.x)
  - [ ] Create `frontend/Dockerfile`
  - [ ] Create `frontend/.env.example`
  - [ ] Create empty directory structure: `src/components/ui/`, `src/components/layout/`, `src/components/features/products/`, `src/components/features/cart/`, `src/components/features/auth/`, `src/components/features/admin/`, `src/components/features/checkout/`, `src/lib/`, `src/store/`, `src/types/`
  - [ ] Create `src/lib/api.ts` placeholder (API client base URL from env, no-op calls for now)
  - [ ] Create `src/lib/constants.ts` placeholder (DELIVERY_TIME_HOURS=2, goal categories)
  - [ ] Create `src/lib/utils.ts` placeholder
  - [ ] Create `src/lib/auth.ts` placeholder
  - [ ] Create `src/types/product.ts`, `src/types/order.ts`, `src/types/user.ts`, `src/types/content.ts` placeholder interfaces
  - [ ] Create `src/store/auth.ts` and `src/store/cart.ts` Zustand store placeholders
  - [ ] Create `src/middleware.ts` placeholder (guards `/account/*` and `/admin/*`)

- [ ] Task 4: Verify (AC: all)
  - [ ] `docker-compose up -d` — all three services reach healthy/running state
  - [ ] `curl localhost:8000/api/v1/health/` returns `{"status": "ok"}` with HTTP 200
  - [ ] `curl localhost:3000` returns Next.js default page (HTTP 200)
  - [ ] `docker-compose run --rm backend python manage.py migrate` completes with no errors
  - [ ] CI workflow file passes YAML syntax check

## Dev Notes

### Backend packages — `backend/requirements.txt`

```
Django==6.0.4
djangorestframework==3.17.1
djangorestframework-simplejwt
django-cors-headers
Pillow
psycopg2-binary
django-filter
drf-spectacular
django-ratelimit
django[argon2]
python-dotenv
```

### Frontend init command (exact, from architecture)

```bash
npx create-next-app@latest frontend \
  --ts --tailwind --app --src-dir --eslint --import-alias "@/*"
```

### `django-admin startproject` usage

```bash
mkdir -p backend && cd backend && django-admin startproject core .
```

The trailing `.` is critical — it places `manage.py` at `backend/manage.py` and the settings package at `backend/core/`, matching the architecture directory structure. Without it, Django creates a nested `core/core/` structure.

### Settings split pattern

Replace the generated `core/settings.py` with:

- `core/settings/__init__.py` — empty
- `core/settings/base.py` — shared: INSTALLED_APPS, DRF config, CORS, DB (from env), AUTH_USER_MODEL, Argon2 PASSWORD_HASHERS, MEDIA_ROOT/MEDIA_URL, REST_FRAMEWORK defaults
- `core/settings/dev.py` — `from .base import *`; `DEBUG=True`; `ALLOWED_HOSTS=['*']`; `CORS_ALLOWED_ORIGINS=['http://localhost:3000']`; console email backend
- `core/settings/prod.py` — `from .base import *`; `DEBUG=False`; `SECURE_SSL_REDIRECT=True`; `SESSION_COOKIE_SECURE=True`; real email backend placeholder

Set `DJANGO_SETTINGS_MODULE=core.settings.dev` in `backend/.env.example` and in the docker-compose backend service environment.

### `INSTALLED_APPS` (base.py)

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'corsheaders',
    'drf_spectacular',
    'django_filters',
    # Domain apps
    'products',
    'orders',
    'accounts',
    'content',
]
```

### MIDDLEWARE (corsheaders MUST be first)

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    # ... remaining Django defaults ...
]
```

### DATABASE config (base.py)

```python
import os

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB', 'sportsnutrition'),
        'USER': os.getenv('POSTGRES_USER', 'postgres'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', ''),
        'HOST': os.getenv('POSTGRES_HOST', 'db'),
        'PORT': os.getenv('POSTGRES_PORT', '5432'),
    }
}
```

### Argon2 password hashing (base.py)

```python
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
]
```

### DRF config (base.py)

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
}
```

### Health check view — `core/views.py`

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def health_check(request):
    return Response({"status": "ok"})
```

This is one of the few permitted items in `core/` — it is a project-level infrastructure concern, not domain business logic.

### `core/urls.py`

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import health_check

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/v1/health/', health_check, name='health-check'),
    # Domain API routes added as each story is implemented:
    # path('api/v1/', include('accounts.urls')),
    # path('api/v1/', include('products.urls')),
    # path('api/v1/', include('orders.urls')),
    # path('api/v1/', include('content.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### `backend/.env.example`

```dotenv
# Django
DJANGO_SETTINGS_MODULE=core.settings.dev
SECRET_KEY=change-me-in-production

# Database
POSTGRES_DB=sportsnutrition
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432

# CORS (comma-separated if multiple)
CORS_ALLOWED_ORIGINS=http://localhost:3000

# File storage (local for demo, 'spaces' for production)
STORAGE_BACKEND=local
```

### `frontend/.env.example`

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### `docker-compose.yml` structure

```yaml
version: '3.9'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: sportsnutrition
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    env_file: ./backend/.env
    depends_on:
      - db
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    command: python manage.py runserver 0.0.0.0:8000

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

### `backend/Dockerfile`

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

### `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

### `.github/workflows/ci.yml` structure

```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: sportsnutrition
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r backend/requirements.txt
      - run: python backend/manage.py check
        env:
          DJANGO_SETTINGS_MODULE: core.settings.dev
          POSTGRES_HOST: localhost
          POSTGRES_PASSWORD: postgres
      - run: python backend/manage.py test
        env:
          DJANGO_SETTINGS_MODULE: core.settings.dev
          POSTGRES_HOST: localhost
          POSTGRES_PASSWORD: postgres

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
        working-directory: frontend
      - run: npm run lint
        working-directory: frontend
      - run: npm run build
        working-directory: frontend
        env:
          NEXT_PUBLIC_API_URL: http://localhost:8000
```

### Architecture anti-patterns to avoid

- ❌ `camelCase` keys in DRF serializers — always `snake_case`
- ❌ Access token in `localStorage` — store in Zustand memory only
- ❌ Direct `fetch` calls in React components — use TanStack Query (Story 2+)
- ❌ Business logic in `core/` — domain logic belongs in domain apps only
- ❌ Hardcoded URLs/API base URLs in components — use `src/lib/api.ts`

### Zustand store placeholders (src/store/)

`src/store/auth.ts`:
```typescript
import { create } from 'zustand'

interface AuthState {
  accessToken: string | null
  setAccessToken: (token: string | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
}))
```

`src/store/cart.ts`:
```typescript
import { create } from 'zustand'

interface CartState {
  items: Array<{ productId: number; quantity: number }>
  addItem: (productId: number, quantity?: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (productId, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === productId)
      if (existing) {
        return { items: state.items.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i) }
      }
      return { items: [...state.items, { productId, quantity }] }
    }),
  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
  clearCart: () => set({ items: [] }),
}))
```

### `src/middleware.ts` placeholder

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Auth guard implemented in Story 1.3
  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
}
```

### Project Structure Notes

- Full directory structure defined in `architecture.md` lines 376–498
- This story creates all skeleton directories and placeholder files; domain app logic added in subsequent stories
- `backend/media/` must be in `.gitignore` (future file uploads)
- `frontend/public/images/` for static logo/placeholder assets
- All domain app `urls.py` files should be commented out in `core/urls.py` for now — they will be wired in as each story implements the actual endpoints

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] — initialization commands and rationale
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — full directory tree (lines 376–498)
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — Argon2, JWT packages
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — Docker-compose decision
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, anti-patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#First Implementation Priority] — initialization command sequence
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — DRF config, error format
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] — user story and acceptance criteria

## Dev Agent Record

### Agent Model Used

_To be filled in by dev agent_

### Debug Log References

_None_

### Completion Notes List

_None_

### File List

_To be filled in by dev agent upon completion_
