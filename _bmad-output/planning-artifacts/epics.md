---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-epic-1', 'step-03-epic-2', 'step-03-epic-3', 'step-03-epic-4', 'step-03-epic-5', 'step-04-final-validation']
status: complete
completedAt: '2026-05-04'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
---

# bmad_sportsNutrition - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad_sportsNutrition, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Shopper can select a fitness goal (Muscle Gain, Fat Loss, Endurance, General Health) as the primary entry point to product discovery
FR2: Shopper can view a curated, ranked product list filtered by their selected goal
FR3: Shopper can view a plain-language explanation of why each product is recommended for their selected goal
FR4: Shopper can change their selected goal at any time and receive an updated product list
FR5: Shopper can browse all products with filtering by goal, brand, category, and price range
FR6: Shopper can search products by name or brand
FR7: Shopper can view a product detail page with full product description, images, price, and stock status
FR8: Shopper can view the authenticity certificate (PDF/image) on each product detail page
FR9: Shopper can view nutrition facts and product specifications on the detail page
FR10: Shopper can see a live local delivery timer on product listings and detail pages
FR11: Shopper can see in-stock and out-of-stock indicators on product listings
FR12: Shopper can view verified purchase photo reviews on product detail pages
FR13: Shopper can access Confusion Resolver entries answering top supplement questions with product recommendations
FR14: Visitor can register a new account with name, phone number, and password
FR15: Registered user can log in and receive a JWT access token
FR16: Registered user can log out and invalidate their session
FR17: Registered user can view and edit their profile (name, phone, delivery address)
FR18: Visitor can complete checkout as a guest without creating an account
FR19: Guest user can create an account from the order confirmation page to track their order
FR20: Shopper can add a product to their cart from the product listing or detail page
FR21: Shopper can update product quantities in their cart
FR22: Shopper can remove items from their cart
FR23: Shopper can view cart summary with line items, subtotal, and estimated delivery
FR24: Cart state persists across browser sessions for registered users
FR25: Shopper can enter or confirm a delivery address during checkout
FR26: Shopper can complete checkout via mock payment (form-based simulation, no real gateway)
FR27: Shopper receives an order confirmation page with order number and itemized summary after checkout
FR28: System sends an email confirmation to the shopper after successful order placement
FR29: Registered user can view their complete order history with order date, status, and total
FR30: Registered user can view full details of any individual order
FR31: Registered user can see the current delivery status of an active order
FR32: Admin can add new products with name, description, images, price, stock, category, and goal tags
FR33: Admin can edit and delete existing products
FR34: Admin can upload an authenticity certificate file (PDF or image) for each product
FR35: Admin can assign products to one or more goal categories
FR36: Admin can update product stock levels
FR37: Admin can view all customer orders with filtering by status
FR38: Admin can update the status of any order (pending → confirmed → dispatched → delivered)
FR39: Admin can view customer account details associated with orders
FR40: Admin can create, edit, and delete Confusion Resolver Q&A entries
FR41: Admin can publish, edit, and unpublish fitness blog articles
FR42: Visitor can read published fitness blog articles
FR43: Visitor can browse all Confusion Resolver entries without logging in
FR44: System displays "Why this works for your goal" copy on every product in goal-filtered views

### NonFunctional Requirements

NFR1: Product listing and detail pages achieve LCP ≤ 2.5 seconds on a 4G mobile connection
NFR2: All DRF API endpoints respond within 500ms under normal load (≤ 50 concurrent users)
NFR3: Cart and checkout operations complete within 1 second under normal load
NFR4: Frontend bundle size optimized; lazy-load non-critical resources
NFR5: All user passwords hashed with Argon2; never stored in plaintext
NFR6: JWT access tokens expire within 24 hours; refresh tokens valid for 7 days
NFR7: All data transmitted over HTTPS; HTTP requests redirected to HTTPS in production
NFR8: All API endpoints validate and sanitize input; SQL injection and XSS prevention enforced at framework level
NFR9: Admin endpoints restricted to users with admin role; inaccessible to regular user accounts
NFR10: User personal data stored on Uzbekistan-hosted servers in compliance with Law No. ZRU-547 (before commercial launch)
NFR11: System handles up to 500 concurrent users without degradation (launch target)
NFR12: Django app stateless to allow horizontal scaling in Phase 2
NFR13: Database connection pooling configured from day one (pgbouncer before commercial launch)
NFR14: 99.5% uptime target during Tashkent business hours (09:00–21:00 UZT)
NFR15: Daily automated database backups; point-in-time restore capability
NFR16: Core checkout flow (cart → payment → order creation) has no single point of failure
NFR17: Full functionality on Chrome 90+, Safari 14+, Firefox 88+ (desktop and mobile)
NFR18: Responsive layout functional at 320px minimum viewport width
NFR19: All interactive elements keyboard-navigable; form fields labelled for screen readers (WCAG 2.1 AA where feasible)

### Additional Requirements

- AR1: Project initialized with separate commands — `npx create-next-app@latest frontend --ts --tailwind --app --src-dir --eslint --import-alias "@/*"` and `django-admin startproject core .`; no third-party boilerplate
- AR2: Docker-compose dev environment must be set up first (postgres + backend + frontend containers); all other work unblocks from this
- AR3: PostgreSQL seeded with 50+ mock products across 4 goal categories via `python manage.py seed_data` management command
- AR4: JWT: access token stored in Zustand (memory only); refresh token in httpOnly cookie; never localStorage for access token
- AR5: Guest cart stored in Zustand + localStorage (client-only); merged to server on login via POST /api/v1/cart/merge/
- AR6: File storage: local filesystem (MEDIA_ROOT) for demo; swap to DigitalOcean Spaces via django-storages env var for production — no code changes required
- AR7: CORS configured on all DRF responses via django-cors-headers; CORS_ALLOWED_ORIGINS whitelists Next.js origin (localhost:3000 dev, production domain prod)
- AR8: All API routes prefixed /api/v1/; plural noun resources; snake_case JSON keys throughout — camelCase in DRF serializers is forbidden
- AR9: Next.js rendering strategy per page type: ISR revalidate:60s (product listing), SSR (product detail), SSG (blog, confusion resolver), client-only (cart, checkout, account, admin)
- AR10: API documentation via drf-spectacular (OpenAPI 3.0); serve /api/v1/schema/ and /api/v1/docs/
- AR11: Email confirmation (FR28): console email backend for demo (`EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'`); django-anymail + SendGrid for production
- AR12: All backend business logic in domain apps (products, orders, accounts, content); no business logic in core/
- AR13: TanStack Query (React Query) for all data fetching in Next.js; never call fetch directly inside React components
- AR14: All API client code centralized in lib/api.ts; all endpoint paths centralized — no hardcoded URLs in components
- AR15: GitHub Actions CI pipeline for automated testing on push/PR
- AR16: Rate limiting via django-ratelimit on auth endpoints only (login/register); no global rate limiting at demo scale
- AR17: Argon2 password hashing via `django[argon2]` package; set in PASSWORD_HASHERS setting

### UX Design Requirements

No UX Design document was provided for this project.

### FR Coverage Map

FR1: Epic 2 - Goal selector as homepage entry point
FR2: Epic 2 - Goal-filtered product list
FR3: Epic 2 - "Why this works" copy per product
FR4: Epic 2 - Change goal → updated product list
FR5: Epic 2 - Browse with filters (goal, brand, category, price)
FR6: Epic 2 - Search by name or brand
FR7: Epic 2 - Product detail page
FR8: Epic 2 - Authenticity certificate on detail page
FR9: Epic 2 - Nutrition facts and specs
FR10: Epic 2 - Live delivery timer on listings and detail
FR11: Epic 2 - In-stock/out-of-stock indicators
FR12: Epic 2 - Verified purchase photo reviews
FR13: Epic 2 - Confusion Resolver entries
FR14: Epic 1 - Visitor registration
FR15: Epic 1 - Login + JWT token
FR16: Epic 1 - Logout
FR17: Epic 1 - Profile view and edit
FR18: Epic 3 - Guest checkout
FR19: Epic 3 - Post-purchase account creation
FR20: Epic 3 - Add to cart
FR21: Epic 3 - Update cart quantities
FR22: Epic 3 - Remove cart items
FR23: Epic 3 - Cart summary view
FR24: Epic 3 - Cart persistence for registered users
FR25: Epic 3 - Delivery address at checkout
FR26: Epic 3 - Mock payment checkout
FR27: Epic 3 - Order confirmation page
FR28: Epic 3 - Email confirmation
FR29: Epic 3 - Order history
FR30: Epic 3 - Order detail
FR31: Epic 3 - Delivery status on active order
FR32: Epic 4 - Admin add product
FR33: Epic 4 - Admin edit/delete product
FR34: Epic 4 - Admin certificate upload
FR35: Epic 4 - Admin goal tagging
FR36: Epic 4 - Admin stock update
FR37: Epic 4 - Admin view orders (filtered)
FR38: Epic 4 - Admin order status updates
FR39: Epic 4 - Admin view customer details
FR40: Epic 4 - Admin Confusion Resolver CRUD
FR41: Epic 4 - Admin blog CRUD
FR42: Epic 4 - Visitor read blog articles
FR43: Epic 2 - Visitor browse Confusion Resolver
FR44: Epic 2 - "Why this works for your goal" display

## Epic List

### Epic 1: Project Foundation & User Authentication
Users can register, log in, manage their profile, and log out. The application runs in Docker with JWT auth fully operational and secure.
**FRs covered:** FR14, FR15, FR16, FR17
**Architecture requirements:** AR1, AR2, AR4, AR7, AR8, AR15, AR16, AR17
**NFRs addressed:** NFR5, NFR6, NFR8, NFR9

### Epic 2: Product Discovery & Goal-Based Navigation
Users can select a fitness goal, browse a curated ranked product list, view product details with authenticity certificates, see the delivery timer, search and filter the catalog, and access the Confusion Resolver — all with a seeded 50+ product catalog.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR43, FR44
**Architecture requirements:** AR3, AR9, AR10, AR13, AR14
**NFRs addressed:** NFR1, NFR2, NFR4, NFR17, NFR18, NFR19

### Epic 3: Shopping Cart & Complete Purchase Flow
Users can add products to cart, check out as guest or registered user with mock payment, receive order confirmation and email, and view order history and delivery status. Guest users can register post-purchase.
**FRs covered:** FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31
**Architecture requirements:** AR5, AR11
**NFRs addressed:** NFR3, NFR16

### Epic 4: Admin Operations & Content Management
Admins can manage the full product catalog (CRUD, certificate upload, goal tagging, stock control), view and process orders with status updates, and manage Confusion Resolver Q&A and blog articles. Visitors can read published blog articles.
**FRs covered:** FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR40, FR41, FR42
**Architecture requirements:** AR6, AR12
**NFRs addressed:** NFR9, NFR11, NFR12

### Epic 5: Production Deployment & Demo Readiness
The application is deployed to a publicly accessible URL with seeded demo data, HTTPS enforced, CI pipeline operational, and the full end-to-end purchase flow verified in production. Demo-ready for manager presentation.
**FRs covered:** All FRs verified in production
**NFRs addressed:** NFR7, NFR13, NFR14, NFR15, NFR10 (documented as pre-commercial-launch prerequisite)

---

## Epic 1: Project Foundation & User Authentication

Users can register, log in, manage their profile, and log out. The application runs in Docker with JWT auth fully operational and secure.

### Story 1.1: Project Initialization & Docker Development Environment

As a developer,
I want a fully initialized project structure with Docker-compose running postgres, backend, and frontend services,
So that the team can begin feature development immediately without environment setup friction.

**Acceptance Criteria:**

**Given** the repository is cloned, **When** `docker-compose up` is run, **Then** postgres, Django backend (port 8000), and Next.js frontend (port 3000) all start successfully with no errors

**Given** the backend is running, **When** `GET /api/v1/health/` is called, **Then** HTTP 200 is returned confirming the service is live

**Given** the frontend is running, **When** `localhost:3000` is visited, **Then** the root page renders without console errors

**Given** the backend is running, **When** `python manage.py migrate` is executed inside the backend container, **Then** all initial migrations apply cleanly with no conflicts

**Given** code is pushed to any branch, **When** the GitHub Actions CI pipeline runs, **Then** it reports pass/fail and runs at minimum `python manage.py check` and `npm run build`

**Given** `.env` files are absent or incomplete, **When** any service starts, **Then** it fails loudly with a clear configuration error message — never silently with wrong defaults

**Given** the repository, **When** it is inspected, **Then** both `backend/.env.example` and `frontend/.env.example` are present with all required environment variable keys documented (values may be placeholders)

### Story 1.2: User Registration & Authentication Backend

As a visitor,
I want to register and authenticate via secure API endpoints,
So that the platform can issue me a JWT and protect my account data.

**Acceptance Criteria:**

**Given** a unique phone number, valid name, and password, **When** `POST /api/v1/auth/register/` is called, **Then** HTTP 201 is returned with the new user's profile (`id`, `name`, `phone`) — password never included in the response

**Given** a phone number that already exists, **When** `POST /api/v1/auth/register/` is called, **Then** HTTP 400 is returned with `{"error": "...", "code": "phone_already_registered", "details": {}}`

**Given** valid credentials, **When** `POST /api/v1/auth/login/` is called, **Then** HTTP 200 is returned with `access_token` (24h TTL) in the body and `refresh_token` (7d TTL) set as an httpOnly cookie

**Given** invalid credentials, **When** `POST /api/v1/auth/login/` is called, **Then** HTTP 401 is returned with `code: "invalid_credentials"`

**Given** a valid refresh token cookie, **When** `POST /api/v1/auth/token/refresh/` is called, **Then** a new `access_token` is returned

**Given** a valid access token, **When** `POST /api/v1/auth/logout/` is called, **Then** the refresh token cookie is cleared and HTTP 200 is returned

**Given** the login endpoint, **When** 6 failed attempts are made within 60 seconds from the same IP, **Then** HTTP 429 is returned for subsequent attempts (django-ratelimit)

**Given** any registration input, **When** the password is stored, **Then** it is hashed with Argon2 — plaintext is never written to the database

**Given** missing or malformed fields on any auth endpoint, **When** the request is processed, **Then** the error response always follows `{"error": "...", "code": "...", "details": {...}}` format

### Story 1.3: Authentication Frontend — Login, Register & Token Handling

As a visitor,
I want to register and log in through the website with seamless token management,
So that I can access my account and protected pages without manually managing tokens.

**Acceptance Criteria:**

**Given** the `/register` page, **When** a visitor submits name, phone, and password, **Then** the account is created, the access token is stored in Zustand (memory only — never localStorage), and the user is redirected to the homepage as logged in

**Given** the `/login` page, **When** valid credentials are submitted, **Then** the access token is stored in Zustand memory, the httpOnly refresh cookie is set by the server, and the user is redirected to their intended destination

**Given** an active session where the access token has expired, **When** any API call returns HTTP 401, **Then** the client automatically attempts one token refresh; on success the original request is retried; on failure the user is redirected to `/login`

**Given** a logged-in user clicking logout, **When** the action is triggered, **Then** `POST /api/v1/auth/logout/` is called, the Zustand auth store is cleared, and the user is redirected to `/login`

**Given** an unauthenticated user, **When** they navigate to any `/account/*` or `/admin/*` route, **Then** Next.js middleware immediately redirects them to `/login`

**Given** registration or login form submission errors (e.g., phone already exists, wrong password), **When** the API returns an error, **Then** a user-friendly inline message is shown on the relevant field — no generic browser alert

### Story 1.4: User Profile View & Edit

As a registered user,
I want to view and update my name, phone number, and default delivery address,
So that my details are saved and pre-filled at checkout without re-entry every time.

**Acceptance Criteria:**

**Given** a logged-in user, **When** `GET /api/v1/auth/profile/` is called, **Then** HTTP 200 is returned with `{id, name, phone, delivery_address}` — password is never included

**Given** a logged-in user, **When** `PATCH /api/v1/auth/profile/` is called with one or more updated fields, **Then** only the submitted fields are updated and the full updated profile is returned

**Given** the `/account/profile` page, **When** a logged-in user visits, **Then** their current name, phone, and address are displayed in an editable form pre-populated with existing values

**Given** the profile form, **When** valid updated data is submitted, **Then** the profile is saved and a success confirmation is shown inline

**Given** the profile form, **When** invalid data is submitted (e.g., malformed phone number), **Then** an inline field-level error is shown and the other valid field values are preserved

**Given** an unauthenticated request, **When** `GET` or `PATCH /api/v1/auth/profile/` is called, **Then** HTTP 401 is returned

---

## Epic 2: Product Discovery & Goal-Based Navigation

Users can select a fitness goal, browse a curated ranked product list, view product details with authenticity certificates, see the delivery timer, search and filter the catalog, and access the Confusion Resolver — all with a seeded 50+ product catalog.

### Story 2.1: Product & Goal Catalog Backend API

As a shopper,
I want a fully operational product catalog API with goal filtering, search, and certificate support,
So that the frontend can retrieve curated, goal-tagged products and display authenticity data.

**Acceptance Criteria:**

**Given** the backend is running, **When** `GET /api/v1/goals/` is called, **Then** the 4 goal categories (Muscle Gain, Fat Loss, Endurance, General Health) are returned with `id`, `name`, `slug`, and `why_it_works` description

**Given** the product catalog exists, **When** `GET /api/v1/products/` is called, **Then** a paginated list of products is returned with `id`, `name`, `slug`, `price`, `is_in_stock`, `goal_categories`, `primary_image_url`, `certificate_url`, `delivery_hours`, and `why_this_works`

**Given** products with goal tags, **When** `GET /api/v1/products/?goal=muscle_gain` is called, **Then** only products tagged with that goal are returned, ranked by a `sort_order` field

**Given** products in the catalog, **When** `GET /api/v1/products/?brand=optimum&min_price=10&max_price=50` is called, **Then** only matching products are returned (django-filter)

**Given** a specific product slug, **When** `GET /api/v1/products/{slug}/` is called, **Then** the full product detail is returned including `nutrition_facts`, `description`, `images`, `certificate_url`, `reviews`, and all goal tags

**Given** the API, **When** `GET /api/v1/schema/` and `GET /api/v1/docs/` are accessed, **Then** the OpenAPI 3.0 schema renders correctly via drf-spectacular

**Given** all product catalog endpoints, **When** accessed by an unauthenticated user, **Then** they are publicly accessible — no auth required for read

### Story 2.2: Demo Data Seeding

As a developer running a demo,
I want a management command that seeds the database with realistic mock products,
So that the full product discovery experience is functional without manual data entry.

**Acceptance Criteria:**

**Given** the backend is running with an empty database, **When** `python manage.py seed_data` is executed, **Then** it completes without errors and outputs a summary of records created

**Given** the seed command runs, **When** complete, **Then** at least 50 products exist across all 4 goal categories with a minimum of 10 products per goal

**Given** the seeded products, **When** inspected, **Then** each product has: name, slug, description, price, stock quantity > 0, `is_in_stock: true`, at least one product image URL, a mock certificate file reference, nutrition facts (as JSON), and a `why_this_works` text per goal

**Given** the seeded products, **When** the product detail API is called, **Then** each product has at least 3 mock verified reviews with reviewer name, rating (1–5), and review text

**Given** the seed command is run a second time, **When** it completes, **Then** it does not create duplicate records (idempotent — uses `get_or_create` or equivalent)

**Given** the seeded data, **When** `seed_data` completes, **Then** at least 5 Confusion Resolver entries exist covering common beginner questions (e.g., "Do I need protein powder if I'm just starting out?")

### Story 2.3: Homepage Goal Selector & ISR Product Listing

As a shopper,
I want to select my fitness goal on the homepage and immediately see a curated product list with delivery timers and stock indicators,
So that I can discover the right products for my goals without browsing an overwhelming catalog.

**Acceptance Criteria:**

**Given** the homepage (`/`), **When** it loads, **Then** a goal selector displays the 4 goal category cards (Muscle Gain, Fat Loss, Endurance, General Health) as the primary entry point

**Given** a user selects a goal, **When** the selection is made, **Then** the user is navigated to `/products?goal={slug}` and the product list is filtered to that goal — rendered via ISR (revalidate: 60s)

**Given** the product listing page, **When** it renders, **Then** each product card displays: product name, primary image, price, goal badge, `why_this_works` copy, delivery timer ("Delivers in 2 hours"), and in-stock/out-of-stock indicator

**Given** a product is out of stock, **When** its card renders, **Then** an "Out of Stock" badge is shown and the add-to-cart button is disabled

**Given** the page, **When** a user changes their goal filter, **Then** the product list updates to reflect the new goal without a full page reload

**Given** the product listing page on a 375px mobile viewport, **When** rendered, **Then** all product cards are fully readable and interactive with no horizontal overflow

**Given** all data fetching on the listing page, **When** implemented, **Then** TanStack Query is used for client-side fetching — no raw `fetch` calls inside React components

### Story 2.4: Product Detail Page (SSR)

As a shopper,
I want to view a full product detail page with description, nutrition facts, authenticity certificate, and verified reviews,
So that I can make a confident, informed purchase decision.

**Acceptance Criteria:**

**Given** a product slug, **When** `/products/{slug}` is loaded, **Then** the page renders server-side (SSR) with full product data: name, images, price, stock status, description, nutrition facts, goal tags, and `why_this_works` copy

**Given** the product detail page, **When** it renders, **Then** the authenticity certificate is displayed as a viewable/downloadable link (PDF or image) with a clear "Verified Certificate" label

**Given** the product detail page, **When** it renders, **Then** a delivery timer shows "Delivers in 2 hours" using the `DELIVERY_TIME_HOURS` constant from `lib/constants.ts`

**Given** the product detail page, **When** it renders, **Then** verified purchase reviews are listed showing reviewer name, star rating (1–5), and review text

**Given** a product slug that does not exist, **When** the page is requested, **Then** a 404 page is returned (Next.js `notFound()`)

**Given** the product detail page, **When** viewed on mobile (375px), **Then** the certificate link, nutrition facts, reviews, and all CTAs are fully accessible and readable

### Story 2.5: Product Search & Advanced Filtering

As a shopper,
I want to search for products by name or brand and filter by goal, brand, category, and price range,
So that I can find exactly what I'm looking for without scrolling through the full catalog.

**Acceptance Criteria:**

**Given** the product listing page, **When** a user types in the search bar, **Then** the product list updates to show only products whose name or brand matches the query (calls `GET /api/v1/products/?search={query}`)

**Given** the filter panel, **When** a user selects a brand, category, and/or price range, **Then** the product list updates to reflect all active filters simultaneously (multi-filter support)

**Given** active filters, **When** the user clears all filters, **Then** the unfiltered product list is restored

**Given** a search or filter that returns no results, **When** the list renders, **Then** an empty state message is shown ("No products found — try a different goal or filter")

**Given** filter state, **When** the user changes goal from the goal selector, **Then** the brand and price filters reset but the new goal filter is applied

**Given** the search input, **When** the user types, **Then** requests are debounced (300ms minimum) to avoid excessive API calls

### Story 2.6: Confusion Resolver Pages (SSG)

As a shopper confused about which supplements to take,
I want to browse Q&A entries that answer common supplement questions with product recommendations,
So that I can make an informed first purchase without needing expert knowledge.

**Acceptance Criteria:**

**Given** the `/confusion-resolver` page, **When** it loads, **Then** all published Confusion Resolver entries are listed, each showing the question and a brief answer preview — rendered as SSG (static at build time)

**Given** a Confusion Resolver entry, **When** expanded or navigated to, **Then** the full answer is displayed along with 1–3 recommended products linked to their product detail pages

**Given** the Confusion Resolver pages, **When** rendered, **Then** they are publicly accessible without authentication (FR43)

**Given** the SSG pages, **When** the Next.js build runs, **Then** all Confusion Resolver entries are pre-rendered as static HTML — no server-side processing per request

**Given** no Confusion Resolver entries exist in the database, **When** the page loads, **Then** an empty state is shown ("Check back soon for expert answers")

---

## Epic 3: Shopping Cart & Complete Purchase Flow

Users can add products to cart, check out as guest or registered user with mock payment, receive order confirmation and email, and view order history and delivery status. Guest users can register post-purchase.

### Story 3.1: Shopping Cart Backend API

As a shopper,
I want a cart API that persists my items server-side and supports merging my guest cart on login,
So that my cart is never lost whether I'm browsing as a guest or a registered user.

**Acceptance Criteria:**

**Given** a registered user with a valid access token, **When** `GET /api/v1/cart/` is called, **Then** the user's server-side cart is returned with all items, quantities, line prices, and subtotal

**Given** a product and quantity, **When** `POST /api/v1/cart/items/` is called with a valid access token, **Then** the item is added to the user's cart and the updated cart is returned; if the item already exists its quantity is incremented

**Given** a cart item id, **When** `PATCH /api/v1/cart/items/{id}/` is called with a new quantity, **Then** the quantity is updated and the updated cart is returned

**Given** a cart item id, **When** `DELETE /api/v1/cart/items/{id}/` is called, **Then** the item is removed and the updated cart is returned

**Given** a list of guest cart items `[{product_id, quantity}]`, **When** `POST /api/v1/cart/merge/` is called by a newly logged-in user, **Then** guest items are merged into the server cart (quantities summed for duplicates) and the unified cart is returned

**Given** a product that is out of stock, **When** it is added to the cart via the API, **Then** HTTP 400 is returned with `code: "product_out_of_stock"`

**Given** any cart endpoint, **When** called without a valid access token, **Then** HTTP 401 is returned

### Story 3.2: Shopping Cart Frontend

As a shopper,
I want to add products to my cart, adjust quantities, and view my cart summary — whether I'm a guest or logged in,
So that I can build my order at my own pace and pick up where I left off.

**Acceptance Criteria:**

**Given** any product card on the listing page or the product detail page, **When** "Add to Cart" is clicked, **Then** the item is added to the Zustand cart store (guest) or POSTed to `/api/v1/cart/items/` (registered user) and a brief confirmation is shown

**Given** the `/cart` page, **When** it loads, **Then** all cart items are displayed with product name, image, unit price, quantity selector, line total, and a remove button; the cart subtotal and estimated delivery are shown at the bottom

**Given** a quantity selector in the cart, **When** the value is changed, **Then** the quantity is updated in Zustand (guest) or via `PATCH /api/v1/cart/items/{id}/` (registered) and the subtotal recalculates immediately

**Given** a remove button on a cart item, **When** clicked, **Then** the item is removed from the Zustand store (guest) or via `DELETE /api/v1/cart/items/{id}/` (registered)

**Given** a guest user with items in their Zustand cart, **When** they log in, **Then** `POST /api/v1/cart/merge/` is called automatically, the server returns the merged cart, and the Zustand store is replaced with the merged server cart

**Given** a registered user's cart, **When** they close the browser and return later, **Then** their cart items are restored from the server via `GET /api/v1/cart/` on next load

**Given** an empty cart, **When** the cart page renders, **Then** an empty state with a "Continue Shopping" link to `/products` is shown

### Story 3.3: Checkout & Order Creation Backend

As a shopper,
I want my order to be created atomically on the server with an email confirmation sent,
So that my purchase is reliably recorded and I receive immediate proof of my order.

**Acceptance Criteria:**

**Given** a valid cart payload and delivery address, **When** `POST /api/v1/orders/` is called, **Then** an Order and OrderItems are created in a single database transaction — partial order creation is not possible

**Given** a successful order creation, **When** the endpoint returns, **Then** HTTP 201 is returned with `{order_id, order_number, items, subtotal, delivery_address, status: "pending", created_at}`

**Given** a successful order, **When** creation completes, **Then** stock quantities for all ordered products are decremented atomically within the same transaction

**Given** a product in the order that has gone out of stock between cart and checkout, **When** the order endpoint is called, **Then** HTTP 400 is returned with `code: "product_out_of_stock"` and no order is created

**Given** a successful order, **When** it is created, **Then** a confirmation email is sent via `django.core.mail.backends.console.EmailBackend` for demo; the production email backend setting is documented in `backend/.env.example`

**Given** an unauthenticated request to `POST /api/v1/orders/`, **When** it is received, **Then** HTTP 401 is returned

### Story 3.4: Checkout Frontend — Address, Mock Payment & Order Confirmation

As a shopper,
I want to enter my delivery address, complete a mock payment, and receive an order confirmation — whether I'm a guest or a registered user,
So that I can complete my purchase quickly and confidently.

**Acceptance Criteria:**

**Given** the `/checkout` page, **When** a registered user arrives, **Then** their saved delivery address is pre-filled from their profile; they can edit it before confirming

**Given** the `/checkout` page, **When** a guest arrives, **Then** they can enter their name, phone, email, and delivery address without being forced to create an account

**Given** the address step is complete, **When** the user proceeds to payment, **Then** a mock payment form is shown with card number, expiry, and CVV fields — no real payment SDK is connected; any non-empty input passes validation

**Given** the mock payment form is submitted with valid-looking input, **When** the form is processed, **Then** `POST /api/v1/orders/` is called; on success the user is redirected to `/checkout/confirmation?order={order_number}`

**Given** the `/checkout/confirmation` page, **When** it loads, **Then** the order number, itemized product list, delivery address, subtotal, and "Your order is confirmed" message are displayed

**Given** the confirmation page, **When** a guest user is viewing it, **Then** a "Create an account to track your order" prompt is shown; submitting the form registers them and links the existing order to their new account

**Given** a checkout API error (e.g., out-of-stock product), **When** the error is returned, **Then** a user-friendly inline message is shown and the user stays on the checkout page with their data preserved

### Story 3.5: Order History & Delivery Status

As a registered user,
I want to view all my past orders and track the delivery status of active orders,
So that I have a complete purchase record and never need to contact support to find out where my order is.

**Acceptance Criteria:**

**Given** the `/account/orders` page, **When** a logged-in user visits, **Then** all their past orders are listed showing order number, date placed, total, and current status (pending / confirmed / dispatched / delivered)

**Given** an order in the list, **When** the user clicks it, **Then** they are taken to `/account/orders/{id}` showing the full order: itemized products with quantities and prices, delivery address, and current status

**Given** an order with status "dispatched", **When** the order detail page renders, **Then** the delivery status is visually highlighted distinguishing it from completed or pending orders

**Given** `GET /api/v1/orders/` is called with a valid access token, **Then** only the authenticated user's own orders are returned — never another user's orders

**Given** `GET /api/v1/orders/{id}/` is called for an order belonging to a different user, **Then** HTTP 404 is returned (not 403 — no information leakage)

**Given** an unauthenticated user, **When** they visit `/account/orders`, **Then** Next.js middleware redirects them to `/login`

---

## Epic 4: Admin Operations & Content Management

Admins can manage the full product catalog (CRUD, certificate upload, goal tagging, stock control), view and process orders with status updates, and manage Confusion Resolver Q&A and blog articles. Visitors can read published blog articles.

### Story 4.1: Admin Product Management Backend

As an admin,
I want secure write-access API endpoints for managing the product catalog including certificate file uploads,
So that I can add, edit, and remove products and keep authenticity certificates current without touching the database directly.

**Acceptance Criteria:**

**Given** a user with `is_staff: true`, **When** `POST /api/v1/products/` is called with valid product data, **Then** the product is created and HTTP 201 is returned with the full product object

**Given** an admin user, **When** `PATCH /api/v1/products/{slug}/` is called with updated fields, **Then** only submitted fields are updated and the updated product is returned

**Given** an admin user, **When** `DELETE /api/v1/products/{slug}/` is called, **Then** the product is removed and HTTP 204 is returned

**Given** an admin user, **When** `POST /api/v1/products/{slug}/certificate/` is called with a multipart PDF or image file, **Then** the file is saved to `MEDIA_ROOT` (demo) and the product's `certificate_url` is updated in the response

**Given** the file storage configuration, **When** the `STORAGE_BACKEND` environment variable is set to `spaces`, **Then** certificate and product image uploads are routed to DigitalOcean Spaces via `django-storages` — no code changes required

**Given** a non-admin user (`is_staff: false`), **When** any write endpoint (`POST`, `PATCH`, `DELETE`) is called, **Then** HTTP 403 is returned

**Given** product creation or update, **When** `goal_category` slugs are submitted as an array, **Then** the product is linked to all matching GoalCategory records; invalid slugs return HTTP 400

**Given** a `stock_quantity` update via PATCH that sets the value to 0, **When** saved, **Then** `is_in_stock` is automatically set to `false` on the product record

### Story 4.2: Admin Product Management Frontend

As an admin,
I want a browser-based interface to add, edit, and delete products — including uploading certificates and assigning goal tags,
So that I can keep the catalog current without needing developer access.

**Acceptance Criteria:**

**Given** the `/admin/products` page, **When** an admin visits, **Then** all products are listed in a table with columns for name, price, stock, goal tags, and Edit / Delete actions

**Given** the `/admin/products/new` page, **When** an admin fills in product details (name, description, price, stock, goal tags, images) and submits, **Then** `POST /api/v1/products/` is called and the new product appears in the product list

**Given** the product form, **When** an admin uploads a certificate file, **Then** the file is sent via `POST /api/v1/products/{slug}/certificate/` and the `certificate_url` is confirmed in the response

**Given** the goal tags field, **When** an admin selects from available goal categories, **Then** a multi-select input allows assigning one or more goals; selections are sent as an array of slugs

**Given** the `/admin/products/{id}` edit page, **When** an admin updates any fields and saves, **Then** `PATCH /api/v1/products/{slug}/` is called and the product list reflects the changes

**Given** a delete action on a product, **When** the admin confirms the deletion dialog, **Then** `DELETE /api/v1/products/{slug}/` is called and the product is removed from the list

**Given** a non-admin user navigating to any `/admin/*` route, **When** the page loads, **Then** Next.js middleware redirects them to `/login`

### Story 4.3: Admin Order Management

As an admin,
I want to view all customer orders filtered by status and update each order's status through its lifecycle,
So that I can process orders efficiently and customers receive accurate status updates.

**Acceptance Criteria:**

**Given** an admin user, **When** `GET /api/v1/admin/orders/` is called, **Then** all orders across all customers are returned paginated with `order_number`, `customer_name`, `phone`, `status`, `total`, and `created_at`

**Given** the orders endpoint, **When** `GET /api/v1/admin/orders/?status=pending` is called, **Then** only orders with the matching status are returned

**Given** an admin user, **When** `PATCH /api/v1/admin/orders/{id}/` is called with `{"status": "dispatched"}`, **Then** the order status is updated and the updated order is returned

**Given** the `/admin/orders` page, **When** an admin visits, **Then** all orders are shown in a table with order number, customer name, status badge, total, date, and a status filter dropdown

**Given** the `/admin/orders/{id}` page, **When** an admin visits, **Then** the full order detail is shown: itemized products, quantities, prices, delivery address, customer phone, and a status update dropdown

**Given** the status update dropdown, **When** the admin selects a new status and confirms, **Then** `PATCH /api/v1/admin/orders/{id}/` is called and the status badge updates immediately

**Given** a non-admin user, **When** any `/api/v1/admin/orders/` endpoint is called, **Then** HTTP 403 is returned

### Story 4.4: Admin Content Management — Blog & Confusion Resolver

As an admin,
I want to create, edit, publish, and delete blog articles and Confusion Resolver Q&A entries from the admin panel,
So that I can keep educational content current without touching the database or code.

**Acceptance Criteria:**

**Given** an admin user, **When** `POST /api/v1/content/confusion/` is called with `{question, answer, recommended_product_ids}`, **Then** a new Confusion Resolver entry is created and HTTP 201 is returned

**Given** an admin user, **When** `PATCH /api/v1/content/confusion/{id}/` is called, **Then** the entry is updated; **When** `DELETE /api/v1/content/confusion/{id}/` is called, **Then** the entry is deleted

**Given** an admin user, **When** `POST /api/v1/content/blog/` is called with `{title, slug, body, is_published}`, **Then** a blog post is created; `is_published: false` means it is not shown on the public blog

**Given** an admin user, **When** `PATCH /api/v1/content/blog/{slug}/` is called with `{"is_published": true}`, **Then** the article becomes visible on the public blog immediately

**Given** the `/admin/content` page, **When** an admin visits, **Then** tabs for "Blog" and "Confusion Resolver" are shown; each tab lists existing entries with Edit and Delete actions

**Given** the Confusion Resolver form, **When** an admin adds or edits an entry, **Then** they can link 1–3 existing products by searching product names; selected products are stored as `recommended_product_ids`

**Given** a non-admin user, **When** any content write endpoint is called, **Then** HTTP 403 is returned

### Story 4.5: Public Blog Pages (SSG)

As a visitor,
I want to read fitness and nutrition blog articles published by the store,
So that I can learn about supplements and trust the platform's expertise before buying.

**Acceptance Criteria:**

**Given** the `/blog` page, **When** it loads, **Then** all published blog articles are listed with title, publication date, and a brief excerpt — rendered as SSG (static at build time)

**Given** a blog article slug, **When** `/blog/{slug}` is loaded, **Then** the full article content is rendered as SSG with title, publication date, and body

**Given** a blog article with `is_published: false`, **When** the SSG build runs, **Then** that article is excluded from all public pages and returns 404 if accessed directly

**Given** the SSG build, **When** it runs, **Then** all published blog articles are pre-rendered as static HTML — no per-request server processing

**Given** a blog slug that does not exist, **When** the page is requested, **Then** Next.js returns a 404 page via `notFound()`

**Given** no blog articles are published, **When** `/blog` loads, **Then** an empty state is shown ("No articles yet — check back soon")

---

## Epic 5: Production Deployment & Demo Readiness

The application is deployed to a publicly accessible URL with HTTPS enforced, seeded demo data, CI pipeline operational, database backups configured, and the full end-to-end purchase flow verified in production — demo-ready for manager presentation.

### Story 5.1: Production Infrastructure & HTTPS Deployment

As a manager reviewing the demo,
I want the application accessible at a public URL with HTTPS enforced,
So that I can evaluate the full product in a realistic, professional environment.

**Acceptance Criteria:**

**Given** a cloud server (DigitalOcean Droplet or Azure VM), **When** provisioned and configured, **Then** the Django backend runs under gunicorn with nginx as the reverse proxy on port 443

**Given** the production environment, **When** the application starts, **Then** HTTPS is enforced — all HTTP requests on port 80 are permanently redirected to HTTPS (301); a valid TLS certificate is in place (Let's Encrypt or equivalent)

**Given** the production Django settings (`core/settings/prod.py`), **When** active, **Then** `DEBUG=False`, `ALLOWED_HOSTS` is restricted to the production domain, `SECURE_SSL_REDIRECT=True`, and `SESSION_COOKIE_SECURE=True` are all set

**Given** the Next.js frontend, **When** deployed (Vercel or same server behind nginx), **Then** it is publicly reachable at the production domain and communicates with the backend via the production API URL (`NEXT_PUBLIC_API_URL`)

**Given** the production database, **When** the backend starts, **Then** all Django migrations have been applied and the database is connected via the `DATABASE_URL` environment variable

**Given** the CORS configuration in production, **When** the frontend origin makes API requests, **Then** only the production frontend domain is in `CORS_ALLOWED_ORIGINS` — `localhost` is not present

**Given** both `backend/.env.example` and `frontend/.env.example`, **When** reviewed, **Then** all environment variables required for production deployment are documented with descriptions

### Story 5.2: Demo Data Seeding & End-to-End Smoke Testing

As a demo presenter,
I want the production database seeded with realistic data and all critical user flows verified working end-to-end,
So that the manager demo runs flawlessly without missing data or broken flows.

**Acceptance Criteria:**

**Given** the production database, **When** `python manage.py seed_data` is run on the production server, **Then** 50+ products, 4 goal categories, 5+ Confusion Resolver entries, and at least 2 blog articles are present

**Given** the seeded production environment, **When** the full Aziz journey is manually tested (goal selection → product list → product detail → add to cart → register → checkout → order confirmation), **Then** every step completes without errors and the order appears in the database

**Given** the seeded production environment, **When** the admin flow is manually tested (login as admin → add a product → upload a certificate → update an order status), **Then** all actions succeed and are reflected in the UI

**Given** the production deployment, **When** `GET /api/v1/health/` is called, **Then** HTTP 200 is returned confirming the backend is live

**Given** the production product detail page, **When** loaded on a real mobile device (or browser DevTools 375px), **Then** LCP is measured at ≤ 2.5 seconds on a simulated 4G connection

**Given** the certificate viewer on a product detail page in production, **When** clicked, **Then** the certificate file loads correctly from the configured file storage (MEDIA_ROOT or Spaces)

### Story 5.3: Database Reliability & Commercial Launch Prerequisites

As the platform operator,
I want automated daily database backups configured and a clear written record of what must be done before commercial launch,
So that demo data is never permanently lost and the path from demo to compliant production is unambiguous.

**Acceptance Criteria:**

**Given** the production PostgreSQL instance, **When** configured, **Then** an automated daily backup runs via a cron job or managed database backup feature; backup retention is set to at least 7 days

**Given** the backup configuration, **When** verified, **Then** a test restore to a staging environment completes successfully with all data intact

**Given** the production database, **When** operating under demo load, **Then** Django's default connection handling is in place; a `DATABASES` setting comment documents that pgbouncer must be added before commercial launch when concurrent users exceed 100

**Given** the project `README.md`, **When** reviewed, **Then** a "Commercial Launch Prerequisites" section documents the following as not-yet-complete: (1) migrate hosting to Uzbekistan-hosted server (ZRU-547 compliance), (2) configure pgbouncer connection pooling, (3) switch `EMAIL_BACKEND` to django-anymail + SendGrid, (4) integrate real payment gateway (Click.uz or Payme), (5) file e-commerce operator notification per Cabinet Resolution No. 885

**Given** the GitHub Actions CI workflow, **When** a pull request is opened, **Then** the pipeline runs `python manage.py check`, Django tests (`python manage.py test`), and `npm run build` — reporting pass/fail before merge
