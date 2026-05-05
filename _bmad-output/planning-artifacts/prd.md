---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
releaseMode: phased
inputDocuments:
  - '_bmad-output/planning-artifacts/research/domain-sports-nutrition-ecommerce-uzbekistan-research-2026-05-04.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-05-04-123247.md'
workflowType: 'prd'
briefCount: 0
researchCount: 1
brainstormingCount: 1
projectDocsCount: 0
classification:
  projectType: web_app
  domain: ecommerce_general
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - bmad_sportsNutrition

**Author:** Doston
**Date:** 2026-05-04

## Executive Summary

Uzbekistan's sports nutrition market is growing at double-digit pace with 599 gyms nationally (+18.5% in two years) and an e-commerce sector expanding at 41–47% CAGR — yet no structured, trusted digital platform for sports nutrition exists. The market is served entirely by Instagram DMs, Telegram channels, and small importers competing on price with zero UX investment. This product captures that white space: a sports nutrition e-commerce platform that functions as a guide, not a store.

Target users are urban gym-goers in Tashkent (ages 18–35), mobile-native, fitness-motivated, and currently buying supplements through informal channels with no product verification, no transparent pricing, and no reliable delivery. The platform replaces the DM-and-wait experience with a goal-driven discovery flow, verified product authenticity, transparent pricing, and fast local delivery — no intermediaries, no fakes, no friction.

### What Makes This Special

The delight moment is precise and deliberate: a user selects their fitness goal (e.g., muscle gain), and immediately sees a curated, ranked product list with authenticity certificates and a live local delivery timer. That single interaction is structurally impossible for an Instagram seller to replicate. It turns a transactional purchase into a guided, trusted experience.

The core differentiation stack:
- **Goal-first AI recommendations** — not a product grid; a recommendation engine that maps fitness goals to verified products
- **Verified authenticity** — certificates displayed on every product, verified purchase badges on reviews; directly addresses the counterfeit trust deficit
- **2-hour Tashkent delivery** — transforms supplement buying from a multi-day logistics problem to an on-demand service
- **No-DM experience** — fully transparent pricing, self-serve checkout

Competitive moat: first-mover timing (no specialist platform exists), AI-powered goal recommendations (structurally unreplicable by informal sellers), and the uzbeknaturals.com wholesale partnership (50K pre-certified SKUs, bypassing the 5–8 month import permit bottleneck).

One-sentence pitch: *"Unlike Instagram sellers, we show verified certificates, transparent prices, and deliver to your door in 2 hours — no DMs, no waiting, no fakes."*

## Project Classification

| Dimension | Value |
|---|---|
| **Project Type** | Standard responsive website (MVP); payment integration and Telegram bot in later phases |
| **Domain** | E-commerce / sports nutrition retail, Uzbekistan |
| **Complexity** | Medium — goal-based recommendation engine, regulatory compliance (LLC registration, e-commerce notification, data localization), product catalog with authenticity verification |
| **Project Context** | Greenfield — no existing product or codebase |
| **Primary Market** | Tashkent, Uzbekistan (Phase 1); national expansion Phase 2+ |

## Success Criteria

### User Success
- User selects a fitness goal and lands on a relevant, curated product list in under 3 seconds
- User completes a purchase (add to cart → checkout → order confirmation) in under 2 minutes
- User can view order history and track past purchases without contacting support
- Authenticity certificates are visible on every product page — zero ambiguity about product legitimacy

### Business Success
- 500 orders placed within the first 3 months post-launch (Tashkent market)
- 30%+ of first-time buyers return for a second purchase within 60 days
- Platform live and demo-ready within 2 days for manager approval
- Zero critical bugs in the core purchase flow at launch

### Technical Success
- Django REST Framework API serving all product, cart, order, and auth endpoints
- PostgreSQL database with seeded mock catalog (50+ products across 4 goal categories)
- All pages load under 2 seconds on a standard mobile connection
- Secure auth (JWT), input validation, and HTTPS in production

### Measurable Outcomes
- Goal → product list → add to cart → checkout: fully functional end-to-end
- Mock payment flow completes without errors
- Site deployed and publicly accessible (not localhost)

## Product Scope

### MVP (Demo + Launch)
- Goal-based product discovery (Muscle Gain, Fat Loss, Endurance, General Health)
- Product catalog with filtering, authenticity badges, delivery timer
- Product detail pages with nutrition facts and verified reviews
- User registration + login (JWT auth)
- Shopping cart (add, remove, update quantity)
- Checkout with mock payment
- Order confirmation + order history
- **Backend:** Django REST Framework + PostgreSQL
- **Deployment:** Live, publicly accessible URL

### Growth Features (Post-MVP)
- Telegram bot notifications (order updates, restock alerts)
- Real payment integration (Click.uz, Payme)
- Confusion Resolver (top 5 goal Q&A → product recommendation)
- Replenishment reminders
- Influencer affiliate tracking
- BNPL integration
- Uzbek/Russian language versions

### Vision (Future)
- AI-powered personalized recommendations
- Native mobile app
- Subscription / auto-replenishment
- Loyalty points program
- Community Q&A on product pages
- Gym pickup points

## User Journeys

### Journey 1: Aziz — The Committed Gym-Goer (Primary Happy Path)

**Aziz, 25, Tashkent.** Trains 5 days a week at Chekhov Sport. Has been buying whey protein through Instagram DMs for 6 months — always anxious about fakes, always waiting 2–3 days for delivery, never sure if the price is fair.

He finds the platform through an Instagram post. He taps the link, selects **Muscle Gain**, and immediately sees a ranked list of protein powders — each with an authenticity badge, a price, and a *"Delivers in 2 hours"* timer. He's never seen this before. He taps Optimum Nutrition Gold Standard, reads the certificate on the product page, sees 47 verified photo reviews. He adds it to cart, registers with his phone number, and checks out in 90 seconds. His order arrives the same afternoon.

**Resolution:** Aziz never DMs an Instagram seller again. He has an account, an order history, and a platform he trusts.

**Capabilities revealed:** Goal filter, product listing, authenticity display, product detail, cart, registration, checkout, order confirmation, delivery tracking.

---

### Journey 2: Dilnoza — The Confused First-Timer (Primary Edge Case)

**Dilnoza, 27, Tashkent.** Started going to the gym 3 weeks ago. Her trainer told her to "take something for recovery." She has no idea what BCAA or creatine means. She searches Instagram, gets overwhelmed, and worries about buying the wrong thing or getting a fake.

She lands on the platform and sees the goal selection screen. She picks **General Health** — the closest to what she understands. The platform shows a beginner-friendly curated list: a multivitamin, a basic protein powder, and a recovery drink, each with a plain-language explanation ("Why this works for your goal"). She reads the Confusion Resolver entry: *"Do I need protein powder if I'm just starting out?"* — gets a clear answer and a product recommendation. She adds the multivitamin to cart, checks out as a guest, then creates an account at confirmation to track her order.

**Resolution:** Dilnoza made her first supplement purchase without anxiety. The platform educated her, verified the product, and delivered to her door.

**Capabilities revealed:** Goal filter (General Health), beginner-friendly product descriptions, Confusion Resolver (top 5 Q&A), guest checkout, post-purchase account creation, order history.

---

### Journey 3: Store Admin — Catalog and Order Management

**The store manager** needs to add new products from the uzbeknaturals.com catalog, update stock levels, and process incoming orders.

They log into the admin panel, add a new protein brand (uploading the authenticity certificate as a PDF), assign it to the Muscle Gain and Endurance goal categories, set price and stock, and publish. A new order notification appears — they confirm it and mark it as dispatched with a tracking reference. They can see all open orders, filter by status, and view customer details.

**Resolution:** The catalog stays current, orders are managed without a separate system, and no order falls through the cracks.

**Capabilities revealed:** Admin product management (CRUD + goal tagging + certificate upload), order management dashboard, order status updates, stock control.

---

### Journey Requirements Summary

| Capability | Driven By |
|---|---|
| Goal-based product discovery | Aziz, Dilnoza |
| Authenticity badges + certificate display | Aziz, Dilnoza |
| Plain-language product descriptions | Dilnoza |
| Confusion Resolver (Q&A → recommendation) | Dilnoza |
| User registration + JWT auth | Aziz |
| Guest checkout + post-purchase registration | Dilnoza |
| Shopping cart (add, remove, quantity) | Aziz, Dilnoza |
| Mock checkout + order confirmation | Aziz, Dilnoza |
| Order history | Aziz, Dilnoza |
| Admin: product CRUD + goal tagging | Store Admin |
| Admin: certificate upload | Store Admin |
| Admin: order management + status updates | Store Admin |

## Domain-Specific Requirements

### Compliance & Regulatory
- **Resident LLC required** — platform must operate as a registered Uzbekistan legal entity before launch (online registration, 1–2 weeks)
- **E-commerce operator notification** — file notification per Cabinet Resolution No. 885 (effective July 1, 2025); separate bank account for e-commerce transactions required
- **Product compliance** — source exclusively from uzbeknaturals.com for MVP; they hold import permits and certificates of conformity for their 50K+ SKU catalog, eliminating the 5–8 month import permit bottleneck
- **Tax/Customs integration** — required by Resolution No. 885; deferred to post-demo but must be in place at commercial launch

### Technical Constraints
- **Data localization** — all personal data of Uzbek citizens must be stored on Uzbekistan-hosted servers; hosting provider selected before deploying user-facing features
- **HTTPS mandatory** — all endpoints served over TLS in production
- **JWT authentication** — stateless auth for Django REST Framework API; tokens expire and refresh appropriately
- **Input validation** — server-side validation on all API endpoints; no trust of client-side data

### Integration Requirements
- **uzbeknaturals.com** — primary product catalog source; mock data seeded from their catalog for demo
- **Mock payment processor** — simulate checkout flow for MVP; no real payment gateway connected
- **Django REST Framework** — all API endpoints (products, cart, orders, auth, admin) served from DRF backend
- **PostgreSQL** — primary database; seeded with 50+ mock products across 4 goal categories

### Risk Mitigations

| Risk | Mitigation |
|---|---|
| Import permit delays (5–8 months) | Source exclusively from uzbeknaturals.com — pre-certified catalog |
| Data localization non-compliance | Select Uzbekistan-hosted infrastructure before production launch |
| Counterfeit trust deficit | Display certificate PDFs on every product page; verified purchase badges |
| E-commerce notification deadline | File at company registration; straightforward process |

## Innovation & Novel Patterns

### Detected Innovation Areas
- **Guide-not-a-store positioning** — goal-first discovery replaces the product grid; structurally unreplicable by Instagram sellers who lack the UX infrastructure to offer ranked, goal-filtered, certificate-verified product lists
- **First-mover in a structured market** — no specialist platform exists in Uzbekistan; the innovation is applying global e-commerce standards to a market still operating via DMs
- **Trust-as-differentiator** — authenticity certificate display as a primary product feature, not an afterthought; directly monetizes the trust deficit competitors have left unaddressed

### Validation Approach
- Manager demo (2-day target): functional live site with mock data validates the core UX concept
- Post-launch: track goal-selection → purchase conversion rate as the primary differentiator metric; if users skip goal selection and go direct to catalog, the differentiator is underperforming

### Risk Mitigation
- Goal recommendations are rule-based at MVP (product–goal tag mapping); no ML required; delivers the differentiator without AI infrastructure risk
- If goal-first flow underperforms, standard catalog browse remains available as fallback

## Web Application Requirements

### Architecture Overview
- **Backend:** Django REST Framework — API-only, no server-side rendering; all business logic, auth, and data access served via REST endpoints
- **Frontend:** Modern JavaScript SPA (React recommended) consuming the DRF API; responsible for all rendering and UX
- **Database:** PostgreSQL; managed via Django ORM
- **Deployment:** Backend and frontend deployed independently; backend on Uzbekistan-hosted server (data localization); frontend on CDN/static host

### Browser & Device Support
- Chrome 90+ (desktop and Android)
- Safari 14+ (iOS and macOS)
- Firefox 88+ (desktop)
- Responsive design: 320px minimum width; optimized for 375px–428px (mobile primary), 768px (tablet), 1280px+ (desktop)

### SEO Strategy
- Product detail pages and blog articles must be indexable (server-side rendering or static generation on the frontend)
- Structured data markup (Schema.org Product) on all product pages
- Sitemap generated and submitted

### Performance Targets
- Largest Contentful Paint (LCP) ≤ 2.5 seconds on 4G mobile
- Time to Interactive (TTI) ≤ 3.5 seconds on 4G mobile
- API endpoints respond ≤ 500ms under normal load (≤ 50 concurrent users)

## Project Scoping & Phased Development

### MVP Strategy
**Approach:** Experience MVP — deliver the full delight moment end-to-end with mock data. The goal is to prove the concept to a manager and establish a foundation for real launch.
**Team:** 1–2 engineers, 2-day demo target, Django REST Framework + React stack
**Philosophy:** Every MVP feature must support at least one user journey completely. No half-built flows.

### MVP Feature Set
**Core journeys supported:** Aziz (happy path purchase) + Dilnoza (first-timer with Confusion Resolver) + Admin (catalog and order management)

**Must-Have for Demo:**
- Goal selection → curated product list with authenticity badges and delivery timer
- Product detail page with certificate, reviews, nutrition facts
- Add to cart, update quantity, remove item
- Guest checkout + registered user checkout with mock payment
- Order confirmation page + order history
- User registration and login (JWT)
- Admin panel: product CRUD, goal tagging, certificate upload, order management

### Risk Mitigation Strategy
| Risk | Mitigation |
|---|---|
| 2-day timeline too tight | Focus on core purchase flow first; add admin panel if time allows |
| Mock payment complexity | Use a simple form simulation — no third-party SDK needed for demo |
| Data localization for demo | Use local or cloud server for demo; Uzbekistan-hosted infra before commercial launch |

## Functional Requirements

### Goal-Based Discovery
- FR1: Shopper can select a fitness goal (Muscle Gain, Fat Loss, Endurance, General Health) as the primary entry point to product discovery
- FR2: Shopper can view a curated, ranked product list filtered by their selected goal
- FR3: Shopper can view a plain-language explanation of why each product is recommended for their selected goal
- FR4: Shopper can change their selected goal at any time and receive an updated product list

### Product Catalog & Search
- FR5: Shopper can browse all products with filtering by goal, brand, category, and price range
- FR6: Shopper can search products by name or brand
- FR7: Shopper can view a product detail page with full product description, images, price, and stock status
- FR8: Shopper can view the authenticity certificate (PDF/image) on each product detail page
- FR9: Shopper can view nutrition facts and product specifications on the detail page
- FR10: Shopper can see a live local delivery timer on product listings and detail pages
- FR11: Shopper can see in-stock and out-of-stock indicators on product listings
- FR12: Shopper can view verified purchase photo reviews on product detail pages
- FR13: Shopper can access Confusion Resolver entries answering top supplement questions with product recommendations

### User Account Management
- FR14: Visitor can register a new account with name, phone number, and password
- FR15: Registered user can log in and receive a JWT access token
- FR16: Registered user can log out and invalidate their session
- FR17: Registered user can view and edit their profile (name, phone, delivery address)
- FR18: Visitor can complete checkout as a guest without creating an account
- FR19: Guest user can create an account from the order confirmation page to track their order

### Shopping Cart
- FR20: Shopper can add a product to their cart from the product listing or detail page
- FR21: Shopper can update product quantities in their cart
- FR22: Shopper can remove items from their cart
- FR23: Shopper can view cart summary with line items, subtotal, and estimated delivery
- FR24: Cart state persists across browser sessions for registered users

### Checkout & Payment
- FR25: Shopper can enter or confirm a delivery address during checkout
- FR26: Shopper can complete checkout via mock payment (form-based simulation, no real gateway)
- FR27: Shopper receives an order confirmation page with order number and itemized summary after checkout
- FR28: System sends an email confirmation to the shopper after successful order placement

### Order Management
- FR29: Registered user can view their complete order history with order date, status, and total
- FR30: Registered user can view full details of any individual order
- FR31: Registered user can see the current delivery status of an active order

### Admin Operations
- FR32: Admin can add new products with name, description, images, price, stock, category, and goal tags
- FR33: Admin can edit and delete existing products
- FR34: Admin can upload an authenticity certificate file (PDF or image) for each product
- FR35: Admin can assign products to one or more goal categories
- FR36: Admin can update product stock levels
- FR37: Admin can view all customer orders with filtering by status
- FR38: Admin can update the status of any order (pending → confirmed → dispatched → delivered)
- FR39: Admin can view customer account details associated with orders
- FR40: Admin can create, edit, and delete Confusion Resolver Q&A entries
- FR41: Admin can publish, edit, and unpublish fitness blog articles

### Content & Education
- FR42: Visitor can read published fitness blog articles
- FR43: Visitor can browse all Confusion Resolver entries without logging in
- FR44: System displays "Why this works for your goal" copy on every product in goal-filtered views

## Non-Functional Requirements

### Performance
- Product listing and detail pages achieve LCP ≤ 2.5 seconds on a 4G mobile connection
- All DRF API endpoints respond within 500ms under normal load (≤ 50 concurrent users)
- Cart and checkout operations complete within 1 second under normal load
- Frontend bundle size optimized; lazy-load non-critical resources

### Security
- All user passwords hashed with bcrypt or Argon2; never stored in plaintext
- JWT access tokens expire within 24 hours; refresh tokens valid for 7 days
- All data transmitted over HTTPS; HTTP requests redirected to HTTPS in production
- All API endpoints validate and sanitize input; SQL injection and XSS prevention enforced at the framework level
- Admin endpoints restricted to users with admin role; inaccessible to regular user accounts
- User personal data stored on Uzbekistan-hosted servers in compliance with Law No. ZRU-547

### Scalability
- System handles up to 500 concurrent users without degradation (launch target)
- Django app stateless to allow horizontal scaling in Phase 2
- Database connection pooling configured from day one

### Reliability
- 99.5% uptime target during Tashkent business hours (09:00–21:00 UZT)
- Daily automated database backups; point-in-time restore capability
- Core checkout flow (cart → payment → order creation) has no single point of failure

### Browser & Accessibility
- Full functionality on Chrome 90+, Safari 14+, Firefox 88+ (desktop and mobile)
- Responsive layout functional at 320px minimum viewport width
- All interactive elements keyboard-navigable; form fields labelled for screen readers (WCAG 2.1 AA where feasible)
