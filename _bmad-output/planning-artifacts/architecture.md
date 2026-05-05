---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
lastStep: 8
status: 'complete'
completedAt: '2026-05-04'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/research/domain-sports-nutrition-ecommerce-uzbekistan-research-2026-05-04.md'
workflowType: 'architecture'
project_name: 'bmad_sportsNutrition'
user_name: 'Doston'
date: '2026-05-04'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (44 total):**

| Category | FRs | Key Architectural Implication |
|---|---|---|
| Goal-Based Discovery | FR1–4 | Product-goal tag mapping; filtered query patterns |
| Product Catalog & Search | FR5–13 | File storage for certificates; search/filter on catalog |
| User Account Management | FR14–19 | JWT auth + guest checkout; dual session model |
| Shopping Cart | FR20–24 | Cart persisted server-side for registered users; session-based for guests |
| Checkout & Payment | FR25–28 | Mock payment flow; order creation transaction; email confirmation |
| Order Management | FR29–31 | Order history and status read for registered users |
| Admin Operations | FR32–41 | CRUD + file uploads; RBAC; order workflow management |
| Content & Education | FR42–44 | Blog articles + Confusion Resolver Q&A; must be SEO-indexable |

**Non-Functional Requirements:**

- **Performance:** LCP ≤ 2.5s on 4G mobile; API ≤ 500ms under 50 concurrent users; cart/checkout ≤ 1s
- **Security:** bcrypt/Argon2 password hashing; JWT 24h access / 7d refresh; HTTPS in production; server-side input validation; admin RBAC; data localization ZRU-547 (commercial launch only)
- **Scalability:** 500 concurrent users at launch; stateless Django app; DB connection pooling from day one
- **Reliability:** 99.5% uptime during Tashkent business hours (09:00–21:00 UZT); daily automated backups; no SPOF in checkout flow
- **Browser/Accessibility:** Chrome 90+, Safari 14+, Firefox 88+; responsive from 320px; WCAG 2.1 AA where feasible

**Scale & Complexity:**

- Primary domain: Full-stack web (Next.js SSR/SSG + Django REST Framework API)
- Complexity level: **Medium** — no real-time WebSocket, no ML, no multi-tenancy; complexity comes from dual-auth cart, file uploads, SSR/API split, and RBAC
- Estimated architectural components: ~8 (Auth, Product Catalog, Cart, Order, Admin, Content/CMS, File Storage, Notification)

### Technical Constraints & Dependencies

- **Django REST Framework** — API-only backend; no server-side rendering; all business logic and data access via REST endpoints
- **Next.js** — frontend framework; SSR/SSG required for product detail pages and blog articles (SEO indexability); calls DRF API at build/request time
- **PostgreSQL** — primary database via Django ORM; seeded with 50+ mock products across 4 goal categories for demo
- **JWT authentication** — stateless; 24h access tokens, 7d refresh tokens; token refresh flow required in Next.js client
- **File storage** — certificate PDFs/images and product images require a file storage strategy (local for demo; object storage for production)
- **CORS** — Next.js frontend and DRF backend are separate origins; CORS headers required on all API responses
- **Deployment:** DigitalOcean or Azure for demo (data outside Uzbekistan acceptable); Uzbekistan-hosted infrastructure required before commercial launch (ZRU-547)
- **Mock payment** — form-based simulation only; no third-party SDK for demo

### Cross-Cutting Concerns Identified

- **Authentication & Authorization** — JWT issuance/refresh, guest session handling, admin RBAC applied across all protected endpoints
- **File Storage** — product images and authenticity certificates used across catalog, product detail, and admin; storage strategy affects both API and frontend URLs
- **SEO / SSR** — Next.js rendering strategy (SSR vs SSG vs ISR) affects product pages, blog, and Confusion Resolver; must be decided consistently
- **CORS** — all DRF API responses must include correct `Access-Control-Allow-Origin` headers for Next.js origin
- **Input Validation** — server-side validation on every DRF endpoint; no trust of client data
- **Environment Configuration** — dev / demo / prod environments need distinct config (DB, storage, JWT secrets, CORS origins, HTTPS)
- **Mobile-First UI** — 375px–428px primary viewport; 4G mobile performance target; all UI decisions start from mobile and scale up

---

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web — separate frontend (Next.js) and backend (Django REST Framework) services, communicating via REST API.

### Starter Options Considered

- **Option A (Selected): Separate initialization** — `create-next-app` for frontend, `django-admin startproject` for backend. Full control, no opinionated boilerplate conflicts.
- **Option B: Fullstack starter** (e.g., `akshat2602/django-nextjs-boilerplate`) — pre-wired DRF + Djoser + Docker, but opinionated auth patterns and folder structures create churn for a team with a defined stack.

### Selected Approach: Separate Initialization

**Rationale:** Stack is already decided. Separate initialization is faster and cleaner for a 2-day demo target — no time lost untangling a third-party boilerplate's assumptions.

**Initialization Commands:**

```bash
# Frontend
npx create-next-app@latest frontend \
  --ts --tailwind --app --src-dir --eslint --import-alias "@/*"

# Backend
django-admin startproject core .
pip install djangorestframework djangorestframework-simplejwt django-cors-headers Pillow psycopg2-binary
```

**Architectural Decisions Established by Starter:**

| Decision | Value |
|---|---|
| **Language** | TypeScript (frontend) / Python (backend) |
| **Styling Solution** | Tailwind CSS |
| **Routing** | Next.js App Router |
| **Build Tooling** | Next.js built-in (Turbopack dev, Webpack prod) |
| **Linting** | ESLint (Next.js config) |
| **Auth Library** | `djangorestframework-simplejwt` |
| **CORS** | `django-cors-headers` |
| **Image Handling** | `Pillow` (product images + certificate files) |
| **DB Driver** | `psycopg2-binary` (PostgreSQL) |

**Current Versions:**
- Next.js `16.2.10` | Django `6.0.4` | Django REST Framework `3.17.1`

**Note:** Project initialization using these commands should be the first implementation story.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Guest cart session strategy — required before any cart or checkout work
- JWT token refresh flow — required before any auth-protected frontend pages
- File storage strategy — required before admin product CRUD
- Next.js rendering strategy per page type — required before any frontend routing work

**Important Decisions (Shape Architecture):**
- State management libraries (TanStack Query + Zustand)
- API versioning and error response format
- Admin RBAC implementation approach
- Docker-compose dev environment

**Deferred Decisions (Post-MVP):**
- Redis caching layer — not needed until launch-scale concurrency
- pgbouncer connection pooling — add before commercial launch
- Sentry monitoring — add post-demo
- Global rate limiting — add post-demo

---

### Data Architecture

| Decision | Choice | Rationale |
|---|---|---|
| **Caching** | None for MVP | ≤50 concurrent users; DB sufficient; Redis deferred to post-launch |
| **File storage (demo)** | Local filesystem (`MEDIA_ROOT`) | Zero infra overhead for 2-day demo |
| **File storage (prod)** | DigitalOcean Spaces (S3-compatible) via `django-storages` | Same API as S3; swap backend via `STORAGE_BACKEND` env var; no code changes |
| **DB connection pooling** | Django default for demo; `pgbouncer` for production | Single server at demo scale; add pooler before commercial launch |
| **Migrations** | Django ORM migrations | Standard; version-controlled alongside models |

---

### Authentication & Security

| Decision | Choice | Rationale |
|---|---|---|
| **Registered user auth** | JWT via `djangorestframework-simplejwt` | Stateless; 24h access / 7d refresh tokens |
| **Guest cart** | Django session cookie (`sessionid`) stored in DB | Standard Django sessions; merge into user cart on login |
| **Password hashing** | Argon2 via `django[argon2]` | PRD-required; one-line `PASSWORD_HASHERS` config |
| **Admin RBAC** | Django `is_staff` flag + custom `IsAdminUser` DRF permission | No complex RBAC needed at this scale; built-in and auditable |
| **Rate limiting** | `django-ratelimit` on auth endpoints only | Prevents brute-force on login/register; no global limiting at demo scale |
| **HTTPS** | Enforced in production via reverse proxy (nginx/Caddy); not required for demo | Demo uses HTTP; production config documented as pre-launch prerequisite |

---

### API & Communication Patterns

| Decision | Choice | Rationale |
|---|---|---|
| **API versioning** | `/api/v1/` URL prefix | Simple, explicit, industry-standard |
| **API documentation** | `drf-spectacular` (OpenAPI 3.0) | Actively maintained; Django 6.x compatible; better than drf-yasg |
| **Error response format** | `{"error": "message", "code": "error_code", "details": {...}}` | Consistent structure across all endpoints; frontend can handle errors uniformly |
| **CORS** | `django-cors-headers` with explicit `CORS_ALLOWED_ORIGINS` | Whitelist Next.js dev (`localhost:3000`) and production domain |
| **API authentication** | Bearer token header: `Authorization: Bearer <access_token>` | Standard JWT transport |

---

### Frontend Architecture

| Decision | Choice | Rationale |
|---|---|---|
| **Server state / data fetching** | TanStack Query (React Query) | Handles API calls, caching, loading/error states; integrates cleanly with App Router |
| **Client state** | Zustand | Lightweight; no boilerplate; manages cart + auth token state |
| **Cart persistence** | Zustand (client) + server sync for registered users | Guest cart in session cookie (server); registered cart in DB; merge on login |

**Next.js Rendering Strategy by Page Type:**

| Page | Strategy | Reason |
|---|---|---|
| Product listing (goal-filtered) | ISR (revalidate 60s) | Balances freshness with performance; SEO-indexable |
| Product detail | SSR | Fresh stock/price data required; SEO critical |
| Blog articles | SSG | Static content; rarely changes; fastest delivery |
| Confusion Resolver | SSG | Static Q&A content |
| Cart / Checkout | Client-side only | Behind auth or session; no SSR needed |
| Account / Order history | Client-side only | Auth-protected; no SEO value |
| Admin panel | Client-side only | Auth-protected; no public access |

---

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|---|---|---|
| **Containerization** | Docker + docker-compose (dev) | Frontend + backend + PostgreSQL in one `docker-compose up` |
| **Hosting (demo)** | DigitalOcean or Azure | Both acceptable; choose based on familiarity; data outside Uzbekistan OK for demo |
| **Hosting (production)** | Uzbekistan-hosted server | ZRU-547 data localization requirement; must be resolved before commercial launch |
| **CI/CD** | GitHub Actions | Free tier sufficient for 1–2 engineer team |
| **Environment config** | `.env` files — `python-dotenv` (backend) + Next.js `.env.local` (frontend) | Per-environment secrets; never committed to git |
| **Monitoring** | None for demo | Add Sentry post-launch |

---

### Decision Impact Analysis

**Implementation Sequence (dependency order):**
1. Docker-compose dev environment (unblocks everything)
2. PostgreSQL schema + Django models + migrations
3. JWT auth endpoints (login, register, refresh, logout)
4. Guest session cart setup
5. Product catalog API with goal filtering
6. File storage config (MEDIA_ROOT + serving)
7. Admin API endpoints (product CRUD, certificate upload, order management)
8. Cart and checkout API
9. Order creation + email confirmation
10. Next.js frontend (SSR/ISR/SSG per page type, TanStack Query, Zustand)
11. Deployment pipeline

**Cross-Component Dependencies:**
- Cart depends on Auth (merge guest → user cart on login)
- Checkout depends on Cart + Order creation (atomic transaction)
- Product detail (SSR) depends on DRF product endpoint being live
- Admin file upload depends on file storage config (MEDIA_ROOT or Spaces)
- All frontend pages depend on CORS config being correct

---

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

8 areas where AI agents could make different choices if not specified: JSON field casing, REST resource naming, API response wrapping, error format, token storage, file structure, test placement, and business logic placement.

---

### Naming Patterns

**The core convention: `snake_case` throughout the API boundary.** DRF returns it natively — no conversion package needed. TypeScript models match the wire format directly.

| Context | Convention | Example |
|---|---|---|
| DB columns / Django model fields | `snake_case` | `created_at`, `goal_category` |
| DRF serializer fields | `snake_case` | `"product_name"`, `"is_in_stock"` |
| API JSON keys | `snake_case` | `{"goal_category": "muscle_gain"}` |
| TypeScript interfaces/types | `snake_case` (match API) | `interface Product { goal_category: string }` |
| TypeScript variables/functions | `camelCase` | `const goalCategory = product.goal_category` |
| React components | `PascalCase` | `ProductCard`, `GoalSelector` |
| Next.js files | `kebab-case` | `product-card.tsx`, `goal-selector.tsx` |
| REST endpoints | plural nouns | `/api/v1/products/`, `/api/v1/orders/` |
| Django apps | `snake_case` singular | `products`, `orders`, `accounts` |

---

### Structure Patterns

**Backend — one Django app per domain:**

```
backend/
  products/        # models, serializers, views, urls, tests
  orders/          # models, serializers, views, urls, tests
  accounts/        # models, serializers, views, urls, tests
  content/         # blog + confusion_resolver
  core/            # settings, urls, wsgi — no business logic here
```

**Frontend — feature-based under `src/`:**

```
frontend/src/
  app/             # Next.js App Router pages
    (shop)/        # goal, products, product/[slug], cart, checkout
    (account)/     # login, register, profile, orders
    admin/         # admin panel pages
    blog/          # blog + confusion resolver
  components/      # shared UI components
  features/        # feature-specific components: products/, cart/, auth/
  lib/             # API client (api.ts), utils, constants
  store/           # Zustand stores
  types/           # TypeScript interfaces matching API shapes
```

**Test placement:** Co-located — `products/tests.py` (Django), `*.test.tsx` next to component (Next.js)

---

### Format Patterns

**API success responses — always wrapped:**

```json
// List (paginated)
{"results": [...], "count": 42, "next": null, "previous": null}

// Single object
{"id": 1, "name": "Gold Standard Whey", "goal_category": "muscle_gain"}

// Action response (create/update/delete)
{"success": true, "data": {...}}
```

**API error responses — always this exact shape:**

```json
{"error": "Validation failed", "code": "validation_error", "details": {"field": ["error msg"]}}
```

**Dates:** ISO 8601 strings everywhere — `"2026-05-04T10:30:00Z"` — never Unix timestamps

**Pagination:** DRF `PageNumberPagination` — `?page=2&page_size=20` query params

---

### Process Patterns

**Loading states (TanStack Query):**
- Use `isLoading` / `isFetching` / `isError` from `useQuery` — never invent parallel boolean state
- Show skeleton UI on `isLoading`; show stale data + spinner on `isFetching`

**Error handling:**
- DRF: let the DRF exception handler format all errors; never return raw Python exceptions from views
- Next.js: wrap all API calls in try/catch; surface `error.code` for user-facing messages
- Never swallow errors silently — always log to console in dev

**Auth token handling:**
- Store access token in memory (Zustand); store refresh token in `httpOnly` cookie
- On 401 response: attempt token refresh once; if refresh fails, redirect to `/login`
- **Never** store access token in `localStorage`

**Cart merge on login:**
- On successful login: POST guest session cart items to `/api/v1/cart/merge/`
- Server merges and returns unified cart; client replaces local Zustand state

---

### Enforcement Guidelines

**All AI agents MUST:**
- Use `snake_case` for all API JSON keys — never `camelCase` in DRF serializers
- Prefix all API routes with `/api/v1/`
- Use plural nouns for REST resource names (`/products/`, not `/product/`)
- Return errors in `{"error", "code", "details"}` format — never bare strings or non-standard shapes
- Place new Django functionality in its domain app — never add business logic to `core/`
- Use TanStack Query for all data fetching — never call `fetch` directly inside React components
- Centralize all API base URLs and endpoint paths in `lib/api.ts`
- Store no secrets in source code — all config via environment variables

**Anti-patterns to avoid:**
- ❌ `camelCase` JSON keys in DRF serializers (breaks TypeScript interface alignment)
- ❌ Access tokens in `localStorage` (XSS risk)
- ❌ Direct `fetch` calls inside React components (bypasses TanStack Query caching)
- ❌ Business logic in Django views — belongs in service functions or model methods
- ❌ Hardcoded API base URLs in components — use `lib/api.ts` client

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bmad_sportsNutrition/
├── docker-compose.yml          # Spins up: postgres + backend + frontend
├── .gitignore
├── README.md
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── backend/                    # Django REST Framework
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── core/                   # Project config — NO business logic
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── dev.py
│   │   │   └── prod.py
│   │   ├── urls.py             # Root router → /api/v1/
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── products/               # FR1–13: Goal discovery, catalog, certificates
│   │   ├── models.py           # Product, GoalCategory, ProductImage, Certificate
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py             # /api/v1/products/, /api/v1/goals/
│   │   ├── filters.py          # django-filter: goal, brand, price
│   │   ├── permissions.py
│   │   ├── admin.py
│   │   └── tests.py
│   ├── orders/                 # FR20–31: Cart, checkout, orders
│   │   ├── models.py           # Cart, CartItem, Order, OrderItem
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py             # /api/v1/cart/, /api/v1/orders/
│   │   └── tests.py
│   ├── accounts/               # FR14–19: Auth, user profile
│   │   ├── models.py           # CustomUser (phone + address fields)
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py             # /api/v1/auth/
│   │   └── tests.py
│   ├── content/                # FR42–44: Blog, Confusion Resolver
│   │   ├── models.py           # BlogPost, ConfusionEntry
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py             # /api/v1/blog/, /api/v1/confusion/
│   │   └── tests.py
│   └── media/                  # Uploaded files (gitignored): certificates, product images
│
└── frontend/                   # Next.js 16 + TypeScript + Tailwind
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── Dockerfile
    ├── .env.example
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx              # Root layout — Header, Footer, Providers
    │   │   ├── page.tsx                # Homepage: Goal selector (FR1)
    │   │   ├── (shop)/
    │   │   │   ├── products/
    │   │   │   │   ├── page.tsx        # Product listing, goal filter (FR2–5) — ISR
    │   │   │   │   └── [slug]/
    │   │   │   │       └── page.tsx    # Product detail, certificate, reviews (FR7–12) — SSR
    │   │   │   ├── cart/
    │   │   │   │   └── page.tsx        # Cart (FR20–23)
    │   │   │   └── checkout/
    │   │   │       ├── page.tsx        # Checkout + mock payment (FR25–27)
    │   │   │       └── confirmation/
    │   │   │           └── page.tsx    # Order confirmation (FR27, FR19)
    │   │   ├── (account)/
    │   │   │   ├── login/page.tsx
    │   │   │   ├── register/page.tsx
    │   │   │   ├── profile/page.tsx    # FR17
    │   │   │   └── orders/
    │   │   │       ├── page.tsx        # Order history (FR29)
    │   │   │       └── [id]/page.tsx   # Order detail (FR30–31)
    │   │   ├── admin/
    │   │   │   ├── layout.tsx          # Admin auth guard
    │   │   │   ├── page.tsx            # Dashboard
    │   │   │   ├── products/
    │   │   │   │   ├── page.tsx        # Product list (FR33)
    │   │   │   │   ├── new/page.tsx    # Add product + certificate upload (FR32, FR34–35)
    │   │   │   │   └── [id]/page.tsx   # Edit/delete product (FR33, FR36)
    │   │   │   ├── orders/
    │   │   │   │   ├── page.tsx        # All orders, filter by status (FR37)
    │   │   │   │   └── [id]/page.tsx   # Order detail + status update (FR38–39)
    │   │   │   └── content/
    │   │   │       └── page.tsx        # Blog + Confusion Resolver CRUD (FR40–41)
    │   │   ├── blog/
    │   │   │   ├── page.tsx            # Blog list (FR42) — SSG
    │   │   │   └── [slug]/page.tsx     # Blog post (FR42) — SSG
    │   │   └── confusion-resolver/
    │   │       └── page.tsx            # Q&A + recommendations (FR13, FR43) — SSG
    │   ├── components/
    │   │   ├── ui/                     # Button, Input, Badge, Skeleton, Modal, Spinner
    │   │   ├── layout/                 # Header, Footer, MobileNav
    │   │   └── features/
    │   │       ├── products/           # ProductCard, GoalSelector, AuthBadge, DeliveryTimer, CertificateViewer
    │   │       ├── cart/               # CartItem, CartSummary, CartDrawer
    │   │       ├── checkout/           # CheckoutForm, MockPaymentForm, OrderSummary
    │   │       ├── auth/               # LoginForm, RegisterForm, ProfileForm
    │   │       └── admin/              # ProductForm, OrderTable, StatusBadge, FileUpload
    │   ├── lib/
    │   │   ├── api.ts                  # API client: base URL, auth headers, error handling
    │   │   ├── auth.ts                 # Token helpers, refresh logic
    │   │   ├── constants.ts            # Goal categories, page sizes, delivery timer config
    │   │   └── utils.ts                # Date formatting, price formatting, slug helpers
    │   ├── store/
    │   │   ├── auth.ts                 # Zustand: access token, user profile
    │   │   └── cart.ts                 # Zustand: guest cart items (merged on login)
    │   ├── types/
    │   │   ├── product.ts              # Product, GoalCategory, Certificate interfaces
    │   │   ├── order.ts                # Cart, CartItem, Order, OrderItem interfaces
    │   │   ├── user.ts                 # User, AuthTokens interfaces
    │   │   └── content.ts              # BlogPost, ConfusionEntry interfaces
    │   └── middleware.ts               # Redirect unauthenticated users from /account, /admin
    └── public/
        └── images/                     # Static assets (logo, placeholder images)
```

### Architectural Boundaries

**API Boundary (DRF ↔ Next.js):**
- All communication via `/api/v1/` REST endpoints
- Next.js never accesses the DB directly — always through DRF
- CORS headers on all DRF responses; `CORS_ALLOWED_ORIGINS` whitelists Next.js origin

**Auth Boundary:**
- `/api/v1/auth/` issues and refreshes JWTs
- `src/middleware.ts` (Next.js) guards `/account/*` and `/admin/*` routes client-side
- DRF `IsAuthenticated` / `IsAdminUser` permissions enforce server-side on every request

**File Storage Boundary:**
- Uploaded files served from `backend/media/` in dev via Django's `MEDIA_URL`
- Frontend references file URLs returned in API responses — never constructs media paths itself

**Admin Boundary:**
- `/admin/*` Next.js routes only reachable by users with `is_staff: true` (checked on login, stored in Zustand)
- All `/api/v1/` admin-scoped endpoints require `IsAdminUser` DRF permission

### Requirements → Structure Mapping

| FR Group | Backend Location | Frontend Location |
|---|---|---|
| Goal discovery (FR1–4) | `products/` models + filters | `app/(shop)/products/page.tsx`, `features/products/GoalSelector` |
| Product catalog (FR5–13) | `products/` views + serializers | `app/(shop)/products/[slug]/`, `features/products/ProductCard`, `AuthBadge`, `CertificateViewer` |
| User accounts (FR14–19) | `accounts/` + simplejwt | `app/(account)/`, `store/auth.ts`, `middleware.ts` |
| Cart (FR20–24) | `orders/Cart` + `orders/CartItem` | `app/(shop)/cart/`, `store/cart.ts`, `features/cart/` |
| Checkout (FR25–28) | `orders/Order` + `orders/OrderItem` | `app/(shop)/checkout/`, `features/checkout/MockPaymentForm` |
| Order history (FR29–31) | `orders/` views | `app/(account)/orders/` |
| Admin ops (FR32–41) | all apps' admin serializers/views | `app/admin/` + `features/admin/` |
| Content (FR42–44) | `content/` app | `app/blog/`, `app/confusion-resolver/` |

### Data Flow

```
User action (browser)
  → Next.js component (TanStack Query)
    → lib/api.ts (attaches Bearer token, handles 401 refresh)
      → DRF endpoint (/api/v1/...)
        → Django app view → serializer → model → PostgreSQL
          → serialized response (snake_case JSON)
        → back to Next.js component → render
```

**File upload flow:**
```
Admin form (FileUpload component)
  → multipart/form-data POST to /api/v1/products/{id}/certificate/
    → DRF saves to MEDIA_ROOT (dev) or DigitalOcean Spaces (prod)
      → returns {certificate_url: "..."} in product response
        → frontend renders <a href={certificate_url}> on product detail page
```

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All versions are mutually compatible: DRF 3.17.1 + simplejwt + django-cors-headers run on Django 6.x without conflicts. TanStack Query v5 supports React 18/19 (Next.js 16). Zustand v5 is React 18/19 compatible. Argon2 is a one-line `PASSWORD_HASHERS` change. Next.js App Router ISR/SSR/SSG per page type is fully supported in Next.js 16.

**Pattern Consistency:**
`snake_case` API keys flow consistently from DRF serializers to TypeScript interfaces. Domain backend apps align 1:1 with frontend feature folders. App Router route groups match FR categories. All patterns reinforce each other.

**Structure Alignment:**
docker-compose at root, domain backend apps, feature-based frontend structure — all coherent with the architectural decisions made in step 4.

### Requirements Coverage Validation ✅

| FR Group | Coverage Status |
|---|---|
| Goal discovery (FR1–4) | ✅ `products/filters.py` + GoalSelector + ISR product listing |
| Product catalog (FR5–13) | ✅ DRF product views + ProductCard, AuthBadge, CertificateViewer, DeliveryTimer |
| User accounts (FR14–19) | ✅ `accounts/` + simplejwt + `middleware.ts` + guest checkout |
| Cart (FR20–24) | ✅ `orders/Cart` + Zustand cart store + cart page |
| Checkout (FR25–28) | ✅ `orders/Order` + MockPaymentForm — email backend resolved in gaps |
| Order history (FR29–31) | ✅ `orders/` views + `/account/orders/` pages |
| Admin (FR32–41) | ✅ all domain apps + `app/admin/` + `features/admin/` |
| Content (FR42–44) | ✅ `content/` app + `/blog/` + `/confusion-resolver/` SSG |

**NFR Coverage:**
- Performance: ISR/SSR strategy + Next.js image optimization ✅
- Security: Argon2, JWT 24h/7d, HTTPS (prod), RBAC, CORS ✅
- Scalability: stateless Django; connection pooling before commercial launch ✅
- Data localization (ZRU-547): documented as pre-launch prerequisite ✅

### Gap Analysis Results

**Important gaps — resolved here, no blockers:**

| Gap | Resolution |
|---|---|
| Email confirmation (FR28) | Demo: `EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'`; prod: `django-anymail` + SendGrid/Mailgun |
| Guest cart implementation | Zustand + `localStorage` (frontend only); merge to server on login via `POST /api/v1/cart/merge/` — no Django sessions needed |
| Demo data seeding | `backend/products/management/commands/seed_data.py` — run with `python manage.py seed_data` |
| Delivery timer (FR10) | `DELIVERY_TIME_HOURS = 2` constant in `frontend/src/lib/constants.ts`; static display in `DeliveryTimer` component |

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**
**Confidence Level: High**

**Key Strengths:**
- Stack is precisely matched to requirements: DRF API-only + Next.js SSR/SSG directly addresses the SEO + mobile-first + fast-checkout requirements
- ISR/SSR/SSG rendering strategy is explicitly mapped per page type — no ambiguity for agents
- Domain backend apps map 1:1 to frontend feature folders — consistent mental model across the full stack
- All 44 FRs and all NFRs have explicit architectural support
- Gaps are all implementation-detail clarifications, not architectural unknowns

**Areas for Future Enhancement:**
- Redis caching layer (post-launch, when concurrent users exceed 500)
- pgbouncer connection pooling (before commercial launch)
- Sentry error monitoring (post-demo)
- Uzbekistan-hosted infrastructure for data localization compliance (before commercial launch)
- Real payment integration: Click.uz / Payme (Phase 2)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented in this file
- Use `snake_case` for all API JSON keys — this is the single most common conflict point
- Respect the rendering strategy table: SSR for product detail, ISR for listing, SSG for blog/FAQ
- Reference `lib/api.ts` for all API calls; never hardcode URLs or call `fetch` directly in components
- Place new backend functionality in its domain app; never add to `core/`

**First Implementation Priority:**
```bash
# 1. Initialize project structure
docker-compose up -d postgres

# 2. Backend
django-admin startproject core backend/
cd backend && pip install djangorestframework djangorestframework-simplejwt django-cors-headers Pillow psycopg2-binary django-filter drf-spectacular django-ratelimit

# 3. Frontend
npx create-next-app@latest frontend --ts --tailwind --app --src-dir --eslint --import-alias "@/*"

# 4. Seed demo data
python manage.py seed_data
```
