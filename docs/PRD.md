# Bhagwati Kisan Mart — E-Commerce Platform
## Product Requirements Document (PRD) & Technical Requirements

**Version:** 1.2
**Date:** August 2026
**Owner:** Digvijay
**Platform Name:** Bhagwati Kisan Mart
**Parent Business:** Maa Bhagwati Kisan Seva Kendra (offline agri-inputs retail — pesticides, seeds, fertilizers)
**Initial Market:** Uttar Pradesh

---

## 1. Product Requirements Document (PRD)

### 1.1 Background & Problem Statement

Maa Bhagwati Kisan Seva Kendra is an established offline agri-inputs shop with existing local trust and relationships with farmers in its region. Farmers currently visit in person, describe crop problems verbally, and receive product recommendations (pesticides, seeds, fertilizers) from family staff. **Bhagwati Kisan Mart** is the online platform that extends this trusted relationship digitally.

The business currently has no digital presence. Meanwhile, well-funded national platforms (DeHaat, BharatAgri, AgriBegri, Farmkart) are digitizing agri-input retail at scale — but they compete on breadth, not on the hyperlocal trust relationship this shop already has.

**The opportunity:** digitize the existing trusted relationship — not replace it — by giving existing and new customers an online ordering channel backed by the same family expertise, while validating demand before investing further.

### 1.2 Vision

Become the trusted digital front door for local farmers to order genuine, correctly-recommended agri-inputs — starting as an extension of an existing offline relationship, not a cold-start marketplace.

### 1.3 Goals (Phase 1 — MVP)

| Goal | Success Metric |
|---|---|
| Launch a working online storefront | Live, functional site accepting real orders |
| Validate online demand from existing/new customers | X online orders/month within first 60 days (baseline TBD after launch) |
| Keep offline operations undisturbed | Zero disruption to existing in-store billing/customers |
| Establish trust online | Verified brand presence, real family identity, clear product info |

### 1.4 Target Users

**Primary:** Local farmers in Uttar Pradesh (starting region) who currently buy pesticides/seeds/fertilizers offline, some of whom have smartphones and are comfortable with basic apps (WhatsApp-level familiarity).

**Secondary:** Farmers outside the immediate physical reach of the shop who could be served via delivery or pickup.

### 1.5 Scope — Phase 1 (In Scope)

- Product catalog (pesticides, seeds, fertilizers) with categories: Insecticide / Fungicide / Herbicide / Bactericide / Nematicide / PGR, Seeds, Fertilizers
- Product detail pages with brand, dosage/label info, price, stock status
- Cart and checkout (COD + online payment via Razorpay/PayU)
- **Order fulfillment modes:** Online delivery (regional) AND in-store pickup (no delivery dependency for launch)
- User accounts (phone/OTP-based login — no password friction for rural users)
- Admin dashboard: product CRUD, order management, manual inventory update, basic sales view
- Region field on user profile (pincode/district) — for future use, captured now
- GST-compliant invoicing
- Responsive design (mobile-first — most farmers will access via phone)
- Basic SEO + custom domain

### 1.6 Explicitly Out of Scope (Phase 1)

- Marg ERP integration / automated inventory sync
- Video content / farming tips section
- Social features (feed, comments, follows)
- "Instagram for farmers" app
- Diagnosis-first / photo-based crop problem checker
- Mobile native app (React Native/Flutter)
- Multi-language UI (Hindi-only content is fine initially, hardcoded, no i18n engine needed yet)

### 1.7 Regulatory Considerations (Must Resolve Before Launch)

- Confirm whether the existing Form VI/VII insecticide dealer license covers **online sale/delivery**, or whether a separate endorsement is required under UP Pesticides Rules — **action item: consult UP Agriculture Dept or a local licensing consultant before go-live.**
- GST invoicing must be correctly implemented for all online transactions.
- Confirm any state-level restrictions on interstate/cross-district delivery of regulated pesticides before enabling delivery outside the immediate district.

### 1.8 Success Metrics (Post-Launch, First 90 Days)

- Number of online orders placed
- % of online orders from new vs. existing customers (track to assess cannibalization vs. growth)
- Order fulfillment time (pickup vs. delivery)
- Cart abandonment rate
- Repeat order rate

---

## 2. Technical Requirements Document

### 2.1 Locked Architecture Decisions

| Layer | Decision | Rationale |
|---|---|---|
| Frontend hosting | **Vercel (free tier)** | Managed, zero-ops, fast to ship; migrate later if needed |
| Backend framework | **NestJS** (TypeScript) | DI, module patterns, strong typing, team familiarity |
| Backend hosting | **Render/Railway (free tier initially)** | Managed containers, no ops overhead at launch |
| Database | **Supabase (Postgres)** | Managed Postgres, built on AWS, generous free tier, easy migration path to RDS later |
| Cache/Session | **Upstash (Redis)** | Free-tier serverless Redis for sessions/rate limiting |
| File/Image storage | **Cloudflare R2** | Free-tier object storage for product images |
| CI/CD | **GitHub Actions** | Automated test gating before deploy, industry standard |
| Domain | **Custom domain (paid, e.g. .in)** | Purchase immediately — do not launch on default subdomain |
| Payment gateway | **Razorpay or PayU** | ~2% transaction fee, no upfront cost, COD support included |
| SMS/OTP | **MSG91 or similar** | ~₹0.15–0.20/SMS for phone-based auth |

**Migration path (explicit, not urgent):** Vercel/Render/Supabase → AWS (Amplify/Fargate + RDS) once a concrete trigger is hit: sustained free-tier limit breaches, need for custom background workers, or cost crossover at real scale. Not on a timeline — on evidence.

### 2.2 High-Level System Architecture

```
[Farmer Browser/Phone]
        |
   [Vercel — Next.js/React Frontend]
        |
   [NestJS API — Render/Railway]
        |
   ┌────┴─────┬──────────┬─────────────┐
[Supabase]  [Upstash]  [Cloudflare R2] [Razorpay/PayU]
(Postgres)   (Redis)    (Images)        (Payments)
```

### 2.3 Core Database Schema (High-Level)

**users**
`id, phone_number, name, address, pincode, district, region, created_at`

**products**
`id, name, category (enum: insecticide/fungicide/herbicide/bactericide/nematicide/pgr/seed/fertilizer), brand, description, dosage_info, price, mrp, stock_qty, hsn_code, gst_rate, image_urls[], is_active, created_at, updated_at`

**orders**
`id, user_id, status (enum: placed/confirmed/packed/out_for_delivery/delivered/picked_up/cancelled), fulfillment_type (enum: delivery/pickup), total_amount, payment_status, payment_method, gst_invoice_no, created_at`

**order_items**
`id, order_id, product_id, quantity, unit_price, subtotal`

**admin_users**
`id, name, phone_number, role (enum: owner/staff), created_at`

> Note: `region`, `district` fields on `users` and a future `content` table's `region` tag are captured now per earlier planning, even though content features are Phase 2+ — cheap to add early, painful to retrofit.

**Indexing & constraints (required, not optional at any scale):**
- Index `products.category`, `products.is_active`, `products.brand` — these are the primary filter/browse paths.
- Index `orders.user_id`, `orders.status`, `orders.created_at` — needed for both customer order history and admin dashboard queries.
- Unique constraint on `users.phone_number`.
- Foreign key constraints (`order_items.order_id → orders.id`, `order_items.product_id → products.id`) with `ON DELETE RESTRICT` for products (never allow a product referenced by past orders to be hard-deleted — use `is_active = false` instead, a soft-delete pattern).
- `stock_qty` must never go negative — enforce with a DB-level `CHECK (stock_qty >= 0)` constraint, not just application-layer validation, since application checks alone are not safe under concurrent requests (see 2.5.3).

### 2.4 API Design Principles

- RESTful NestJS modules: `AuthModule`, `ProductsModule`, `OrdersModule`, `UsersModule`, `AdminModule`
- Phone/OTP-based auth (JWT with short expiry + refresh token)
- Role-based access control: `customer` vs `admin` (owner/staff distinction in admin panel)
- Input validation via `class-validator` on all DTOs
- Rate limiting on OTP and checkout endpoints (via Upstash Redis) to prevent abuse
- API versioning from day one (`/api/v1/...`) — costs nothing now, avoids breaking existing clients (including a future mobile app) when the API evolves later
- Consistent response envelope across all endpoints (`{ success, data, error }`) so frontend and future mobile clients parse responses uniformly
- Pagination on all list endpoints (`products`, `orders`) from day one — even at low data volume, this avoids a breaking API change later

### 2.5 Design Patterns & System Design Considerations

Applying established patterns here isn't about over-engineering — each one solves a concrete problem this project will actually hit.

**2.5.1 Repository Pattern**
Wrap all direct database access (Supabase/Postgres queries) behind repository classes (e.g., `ProductsRepository`, `OrdersRepository`) rather than calling the DB client directly inside services. This keeps `ProductsService`/`OrdersService` free of query logic, makes unit testing services possible without a real database (mock the repository), and means a future DB migration (e.g., Supabase → RDS) touches only the repository layer, not business logic.

**2.5.2 DTO Pattern + Validation Pipes**
Every API input/output crosses a DTO (`CreateOrderDto`, `ProductResponseDto`, etc.) validated via `class-validator`/`class-transformer`. This is NestJS's built-in idiom and prevents two common failure classes: malformed data reaching business logic, and internal fields (e.g., cost price, internal flags) accidentally leaking to the client in API responses.

**2.5.3 Concurrency-Safe Inventory Updates (critical for this domain)**
Two farmers can check out the same low-stock product at nearly the same moment. Naive read-then-write stock logic (`read stock → check > 0 → decrement`) has a race condition that can oversell. Handle this with either:
- A single atomic SQL update: `UPDATE products SET stock_qty = stock_qty - :qty WHERE id = :id AND stock_qty >= :qty`, checking the affected-row count to confirm success, or
- A DB transaction with row-level locking (`SELECT ... FOR UPDATE`) around the stock check-and-decrement.

This is a real business-correctness issue (double-selling limited pesticide stock), not a theoretical one — build it correctly from the start rather than retrofitting after a bad order.

**2.5.4 Strategy Pattern — Payment & Fulfillment**
Define a common interface (e.g., `PaymentProvider`) with methods like `initiate()`, `verify()`, `refund()`. Razorpay and PayU (and COD, treated as a "provider" that always succeeds) each implement this interface. This means adding or switching a payment gateway later touches one new class, not scattered `if/else` logic across the checkout flow. Same pattern applies to `fulfillment_type` (delivery vs. pickup) — a `FulfillmentStrategy` interface keeps delivery-specific logic (courier assignment, delivery fee) isolated from pickup logic.

**2.5.5 Order State Machine**
Model `order.status` as an explicit finite state machine, not a free-form enum any code can set arbitrarily: `placed → confirmed → packed → out_for_delivery/ready_for_pickup → delivered/picked_up`, with `cancelled` reachable from early states only. Enforce valid transitions in `OrdersService` (reject an attempt to jump `placed → delivered` directly). This prevents an entire class of admin-dashboard bugs and makes order history genuinely trustworthy.

**2.5.6 Idempotency on Payment & Order Creation**
Payment gateway webhooks can be delivered more than once (network retries are normal, not exceptional). The webhook handler must be idempotent — store the gateway's transaction ID and check for it before processing, so a duplicate webhook delivery can't double-confirm an order or double-credit stock reversal. Similarly, generate an idempotency key on the client for order creation so a farmer double-tapping "Place Order" on a slow connection doesn't create two orders.

**2.5.7 Event-Driven Side Effects (lightweight)**
Use NestJS's built-in `EventEmitter` (not a full message queue — unnecessary at this scale) to decouple side effects from the core order flow: when an order is confirmed, emit an `OrderConfirmedEvent`; separate listeners handle sending SMS confirmation, updating admin dashboard counts, etc. This keeps `OrdersService.confirmOrder()` from becoming a long, tangled method doing five unrelated things, and makes it easy to add new side effects later (e.g., a WhatsApp notification) without touching core order logic.

**2.5.8 Caching Strategy**
Product catalog reads far outnumber writes. Cache product listing/detail responses in Upstash Redis with a short TTL (e.g., 60–120 seconds) and explicit invalidation on admin product update — this keeps the storefront fast without stale-data risk beyond a couple of minutes. Do not cache anything user-specific (cart, order status) at this stage; the complexity isn't justified yet.

**2.5.9 Error Handling & Logging Standards**
- Global NestJS exception filter returning the consistent error envelope (see 2.4) with proper HTTP status codes — never leak stack traces or raw DB errors to the client.
- Structured logging (e.g., `pino`) with request IDs, so a Sentry error can be traced back to the exact request/order/user without guesswork.
- Distinguish operational errors (bad input, out-of-stock — expected, handled gracefully) from programmer errors (bugs — logged loudly, alerted on).

### 2.6 Recommended Backend Folder Structure (NestJS)

Modular structure, one folder per domain module, keeping repository/service/controller layers explicit:

```
src/
  common/
    filters/          (global exception filter)
    guards/            (auth guard, roles guard)
    interceptors/      (logging, response envelope)
    decorators/
  config/              (env validation/config module — see 2.7)
  modules/
    auth/
      auth.controller.ts
      auth.service.ts
      dto/
    products/
      products.controller.ts
      products.service.ts
      products.repository.ts
      entities/
      dto/
    orders/
      orders.controller.ts
      orders.service.ts
      orders.repository.ts
      state-machine/    (order status transition logic)
      dto/
    payments/
      payments.controller.ts
      providers/         (razorpay.provider.ts, payu.provider.ts, cod.provider.ts — Strategy pattern)
      payment-provider.interface.ts
    users/
    admin/
  main.ts
```

This structure is standard NestJS convention (mirrors what's used across most production NestJS codebases) — each domain module is self-contained, dependencies flow inward via DI, and no module reaches into another module's repository directly.

### 2.7 Configuration Management
- All environment-specific values (DB URL, Redis URL, gateway keys, JWT secret) loaded through a single validated config module at startup (e.g., `@nestjs/config` with a Joi/Zod schema) — the app should fail fast at boot if a required env var is missing, rather than failing unpredictably mid-request later.
- Never read `process.env` directly inside business logic — always through the config service, so config source can change (e.g., AWS Secrets Manager later) without touching business code.

### 2.8 Non-Functional / "Industry Standard" Requirements

These are non-negotiable regardless of scale, per earlier discussion:

1. **Separate staging and production environments** — never test against the live customer-facing site.
2. **Automated tests gating deploys** — Jest + Supertest (NestJS), Vitest/RTL (frontend), Playwright (E2E critical flows: browse → cart → checkout). CI must block merge/deploy on test failure.
3. **Secrets management** — environment variables via host platform (Vercel/Render env vars), never hardcoded credentials in repo.
4. **HTTPS everywhere** — enforced by default via Vercel/Render.
5. **Password/auth security** — if password auth is ever added, bcrypt/argon2 hashing; OTP-based auth avoids this need initially.
6. **Database backups** — Supabase automated daily backups enabled; test restore process at least once before go-live.
7. **Basic monitoring/alerting** — Sentry (free tier) for error tracking; uptime monitoring (e.g., UptimeRobot free tier).
8. **GST/invoice correctness** — validated against actual GST rules for pesticide/seed/fertilizer HSN codes before go-live.

### 2.9 Testing Strategy (Locked, Reference)

| Layer | Tool |
|---|---|
| Frontend unit | Vitest/Jest + React Testing Library |
| E2E | Playwright |
| Backend (NestJS) | Jest + Supertest |
| CI | GitHub Actions (test gate before deploy) |

### 2.10 Build Sequencing (Week 1 → Onward)

**Started in parallel, week 1 (paperwork, not code):**
- Submit Razorpay/PayU merchant KYC application immediately — approval timeline is outside your control (several business days to ~2 weeks), so this should not block on code readiness. Code integration itself happens last (see below).

**Week 1 — Storefront + Admin MVP (code)**
- Days 1–3: Core storefront (product listing, cart, checkout UI with COD/placeholder payment, phone/OTP auth) + admin CRUD (products, orders)
- Days 4–7: Hardening — validation, error states, concurrency-safe stock updates, responsive polish, core tests, deploy to Vercel/Render, connect custom domain

**Payment gateway integration — deliberately last**
- Build and test in Razorpay/PayU sandbox mode once KYC is approved and everything else is functional. Checkout flow already supports COD, so this isn't a launch blocker — it slots in once ready.

**Post-Launch (Phase 1.5)**
- Monitor real usage, fix issues, gather feedback from actual customers (family's existing base first)
- Track online vs. offline cannibalization/growth signal

**Phase 2+ (Future Scope — see Section 3)**

---

## 3. Future Scope (Explicitly Deferred, Gated by Evidence)

These are intentionally **not** part of the Phase 1 build. Each is gated behind a validation signal from the prior phase — not built on a fixed timeline.

### 3.1 Marg ERP Integration
- **Trigger:** Manual inventory updates in the admin dashboard become a real operational burden.
- **Approach:** Investigate Marg API Integration module or MargBooks Open API (real-time sync) vs. ERP Bridger (batch file import/export), depending on license tier access.
- **Design principle:** Marg remains source of truth for stock; website reads/writes via API rather than maintaining a fully separate inventory database.

### 3.2 Region-Tagged Content / "Farming Tips" Section
- **Trigger:** Storefront is live and stable; family wants to add value beyond product listings.
- **Approach:** Lightweight video/content library (not a social feed) — content tagged by region, crop type, and season; shown to farmers filtered by their saved pincode/district. No likes/comments/follows.
- **Content source:** Family answering real in-store customer questions on video — authentic, low-cost to produce.

### 3.3 Diagnosis-First Product Discovery
- **Trigger:** Post-launch, if customer feedback indicates difficulty self-selecting the right product.
- **Approach:** Simple symptom-checklist or photo-upload flow ("what's wrong with your crop") → suggested product + short explanatory video, turning the family's real diagnostic expertise into a product feature.

### 3.4 "Instagram for Farmers" — Standalone Social Platform
- **Trigger:** Only if the region-tagged content section (3.2) shows strong, real engagement after Phase 1.5.
- **Scope:** A fully separate application — not a feature bolted onto the storefront. Would include farmer-generated content, feed, and community interaction.
- **Content moderation approach (realistic framing):** Multi-layered moderation, not "bulletproof AI verification" — which is not achievable even at Meta/YouTube/TikTok scale. Layers would include:
  - Automated duplicate/re-upload detection (perceptual hashing / video fingerprinting)
  - Basic automated spam/explicit-content filtering
  - Verified-account requirements (real phone number, tied to location)
  - Human review (family or small moderator team) for flagged content
- This platform would be evaluated as a **separate product decision** — including whether the goal is to compete with DeHaat/BharatAgri directly or stay focused as a trusted local shop's digital extension.

### 3.5 Native Mobile Application
- **Trigger:** Web storefront proven, validated demand, and a clear case that a native app (vs. mobile-responsive web) adds meaningful value (e.g., push notifications, offline catalog browsing).
- **Approach:** Build after web learnings are incorporated — avoid building both blind, in parallel.

### 3.6 AWS Migration
- **Trigger:** Sustained free-tier limit breaches on Vercel/Render, need for custom background workers/cron jobs, or a clear cost crossover point at real scale.
- **Approach:** Migrate to AWS Amplify/Fargate + RDS. Supabase (Postgres) can remain unchanged through this migration since it's already AWS-backed infrastructure underneath.

---

## 4. Open Action Items Before Go-Live

1. Confirm UP pesticide dealer license covers online sale/delivery (or obtain required endorsement).
2. Verify GST HSN codes and rates for full product catalog.
3. Purchase custom domain.
4. Set up Razorpay/PayU merchant account (KYC required — start early, can take several days).
5. Decide initial delivery radius (start with in-store pickup + immediate district delivery, expand later).

---

## 5. Engineering Standards & Implementation Discipline

Every feature built for Bhagwati Kisan Mart — whether by hand or via an agentic tool like Antigravity — follows this lifecycle rather than "write code, ship it":

**Understand → Assess → Design → Secure → Implement → Test → Review → Cleanup → Re-test → Verify**

### 5.1 Pre-Implementation Assessment
Before writing or modifying any code:
- Understand the existing architecture and implementation flow (reference Section 2 of this document).
- Identify all affected modules, services, functions, APIs, database interactions, and dependencies.
- Check whether similar functionality already exists before creating anything new — reuse existing logic (e.g., the Repository/Strategy patterns in 2.5) rather than duplicating it.
- Identify potential security, performance, data-consistency, and backward-compatibility risks.
- Define expected behavior and acceptance criteria before implementation begins.

**Rule:** Do not introduce a new function, class, utility, API, configuration, or dependency unless there is a clear and justified need for it — this includes not building anything from Section 3 (Future Scope) until its trigger condition is actually met.

### 5.2 Security First
No feature is complete just because it works. Before marking anything done, verify:
- Authentication and authorization requirements (role-based access per 2.4)
- Input validation and sanitization (DTOs per 2.5.2)
- Sensitive data handling (customer phone numbers, addresses, payment references)
- Secrets and credentials exposure (never hardcoded, per 2.7/2.8)
- Logging of sensitive information (structured logs must not leak PII or payment details)
- API access and permission boundaries
- Injection and manipulation risks
- Error handling and information leakage (no raw stack traces or DB errors to the client, per 2.5.9)
- Dependency and third-party library risks
- Any impact on existing security controls

### 5.3 Minimal & Purposeful Changes
- Keep implementation as small and focused as possible.
- No premature abstractions, no functions "for future use" without a current requirement.
- No duplicate logic, no unnecessary configuration or dependencies.
- Avoid modifying unrelated components.
- Every newly introduced function or component should have a clearly identifiable consumer.

### 5.4 Post-Implementation Cleanup
After a feature is implemented, a dedicated cleanup pass checks for: unused functions/classes/variables, dead code, duplicate implementations, obsolete helpers, unused imports, temporary debugging code, redundant configuration, unused dependencies, unreachable deprecated logic, stale feature flags, and comments/docs that no longer reflect the implementation.

### 5.5 Usage & Reference Verification
Before removing or modifying any existing function: check direct references, indirect references, API consumers, background jobs/event listeners (per 2.5.7), tests, and external integrations (payment webhooks, Marg — once built). A function is only removed once confirmed unused; every newly created function is verified to actually be consumed somewhere.

### 5.6 Regression & Validation
After implementation and cleanup: run relevant unit/integration tests (per 2.9), validate affected API request/response flows, test existing behavior for regressions, verify edge cases and failure scenarios (including the concurrency-safe stock update in 2.5.3), verify security-sensitive paths, and check logs/error handling.

### 5.7 Standardized Checkpoints (Keywords)

These can be invoked at any point during development — with Antigravity or with any future collaborator/developer — to trigger a specific check without ambiguity:

| Keyword | Action |
|---|---|
| `SECURITY_CHECK` | Perform a security assessment of the implementation |
| `IMPACT_CHECK` | Identify affected modules, services, APIs, and dependencies |
| `USAGE_CHECK` | Identify where functions/classes/components are currently used |
| `DEAD_CODE_CHECK` | Identify unused or unreachable code |
| `DUPLICATE_CHECK` | Identify duplicate or overlapping implementations |
| `CLEANUP_CHECK` | Review the implementation for unnecessary code/configuration |
| `REGRESSION_CHECK` | Validate that existing behavior has not been broken |
| `FEATURE_REVIEW` | Perform a complete post-implementation review |
| `FINAL_CHECK` | Run the complete engineering checklist before considering the feature complete |

**Recommended core set (simplified):** `PLAN → SECURE → BUILD → VERIFY → AUDIT → CLEAN → FINALIZE`

**Master keyword:** `GUARD` — triggers the entire process (Plan → Security → Implementation → Verification → Audit → Cleanup → Final validation). Use `GUARD this feature before marking it complete` as the standard sign-off instruction for any feature, including when directing Antigravity.

**Core principle:** Do not just make the feature work — make sure it's secure, necessary, correctly integrated, tested, and clean after implementation. Every implementation should leave the codebase in a state equal to or better than the state in which it was found.

---

## 6. Implementation Context & Knowledge Base

Alongside the GUARD engineering discipline (Section 5), every non-trivial feature/change gets a dedicated **context entry** — a living record of *why* something was built the way it was, not just what the code does. This exists so that neither Digvijay nor a future collaborator (or Antigravity, across separate agent runs) has to reconstruct reasoning from commit history or old conversations.

**Where it lives:** `/docs/context/` in the repo, one file per feature (e.g., `checkout-flow.md`, `inventory-stock-lock.md`, `admin-order-management.md`), following the template in the companion file `Bhagwati_Kisan_Mart_Context_Template.md`.

**What it is not:** a general notes folder or a restatement of code comments. Each entry must answer five questions on demand:
1. Why does this exist?
2. How does it work?
3. What does it depend on?
4. What decisions were made, and why?
5. What should an engineer know before changing it?

**Structure per entry:** IDENTITY, INTENT, ARCHITECTURE, DECISIONS, IMPLEMENTATION, SECURITY, VALIDATION, CLEANUP, DEPENDENCIES, HISTORY, OPEN_ITEMS — full field definitions are in the template file.

**Maintenance rule:** whenever code tied to a feature is added, modified, removed, refactored, deprecated, or replaced, its context entry is reviewed and updated in the same work session — a context entry describing implementation that no longer exists is worse than no entry at all, since it actively misleads. This update is part of the `CLEAN`/`FINALIZE` steps in the GUARD process (Section 5), not a separate optional task.

**Relationship to Section 5 (GUARD):** the DECISIONS, SECURITY, and VALIDATION fields in a context entry are populated directly from the SECURE, BUILD, and VERIFY steps of that feature's GUARD pass — this is where that reasoning gets preserved rather than lost once the agent session ends.

---

*This document reflects decisions made through iterative planning discussions. Update as decisions evolve — particularly Section 3 triggers, which should be revisited after each phase based on real usage data, not assumptions.*
