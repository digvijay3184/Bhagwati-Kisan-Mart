# Frontend Architecture & End-to-End Integration

## 1. Overview & Architectural Principles

The frontend for **Maa Bhagwati Kisan Seva Kendra** (`Bhagwati-Kisan-Mart`) is built with **Next.js 16 (App Router)**, **React 19**, and **TypeScript**, specifically designed for rural Western Uttar Pradesh (UP) agricultural ergonomics. It integrates seamlessly with the Phase 1 NestJS backend running on port `4000` (`http://localhost:4000/api/v1`).

### Scope Boundaries (Phase 1 Compliant)
- **Included**: Storefront catalog, dosage calculator, localized cart with free village delivery threshold, COD and dukaan pickup checkout, phone + OTP authentication, customer order tracking timeline, customer profile with address management, and high-density operator admin panel (Order state machine, product inventory, and staff RBAC).
- **Explicitly Excluded**: Video/content feeds, social features, prescription file uploads, and photo AI diagnosis.

---

## 2. Directory Structure & Key Files

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with AuthProvider, CartProvider, LoginModal
│   │   ├── page.tsx                # Home / Storefront Landing page
│   │   ├── products/
│   │   │   ├── page.tsx            # Catalog with search, category filtering & price sorting
│   │   │   └── [id]/page.tsx       # Product detail with chemical specs, lab tests, buy now
│   │   ├── cart/page.tsx           # Cart with free delivery progress meter & order summary
│   │   ├── checkout/page.tsx       # Checkout with Pickup/Delivery toggle, COD terms & idempotency
│   │   ├── orders/
│   │   │   ├── page.tsx            # Order history with active/delivered/cancelled filter tabs
│   │   │   └── [id]/page.tsx       # Order confirmation & 5-stage tracking lifecycle
│   │   ├── profile/page.tsx        # Farmer profile with verified KCC badge & inline address editing
│   │   └── admin/page.tsx          # Operator / Owner portal with Orders, Products & Staff tabs
│   ├── components/
│   │   ├── Header.tsx              # Brand header, search, cart badge, login/profile menu
│   │   ├── Footer.tsx              # Rural UP trust seal, depôt license, emergency helpline
│   │   ├── LoginModal.tsx          # Phone number + 6-digit OTP modal dialog
│   │   └── ProductCard.tsx         # Reusable card with stock status, MRP, discount badge
│   ├── context/
│   │   ├── AuthContext.tsx         # Phone OTP auth state, token persistence, role checking
│   │   └── CartContext.tsx         # Cart items in localStorage, quantity controls, delivery math
│   └── lib/api/
│       ├── client.ts               # Axios instance unwrapping `{ success, data, error }`
│       ├── auth.ts                 # OTP send/verify, me, logout
│       ├── products.ts             # Fetch products, detail, stock update, create product
│       ├── orders.ts               # Create order, get order, list orders, advance status
│       ├── users.ts                # Profile fetch & patch
│       └── types.ts                # Full TypeScript schema matching backend DTOs & entities
└── tests/
    ├── admin-flows.spec.ts         # 4 automated E2E tests for admin workflows
    └── customer-flows.spec.ts      # 5 automated E2E tests for customer storefront & checkout
```

---

## 3. Rural UP UX Ergonomics

1. **Dual-Language Clarity (Hindi + English)**:
   - High-priority operational labels and actions are in Hindi (`ऑर्डर दर्ज करें`, `सामान मिलने पर नकद भुगतान`, `दवा डोज कैलकुलेटर`) paired with English subtext for unambiguous readability.
2. **High-Contrast Agricultural Design Tokens**:
   - Deep forest green (`#00501a`), warm harvest gold (`#ffba39`), and earth tones reflecting trust, government authorization, and authenticity.
3. **Purity & Authenticity Seals**:
   - Every product highlights `प्रयोगशाला परीक्षित` (Lab Tested), `होलोग्राम सील पैक` (Tamper Proof), and `प्राधिकृत डीपो` (Govt. Licensed) with HSN codes and GST percentages.
4. **Calculators & Clear Stock Indicators**:
   - Acre-based insecticide/fertilizer dosage calculator on the landing page prevents chemical overuse and waste.
   - Real-time stock counters (`मंडी डिपो में उपलब्ध (15 नग शेष)`) eliminate out-of-stock confusion.

---

## 4. Backend Integration & Data Contract

### API Envelope Unwrapping
All backend responses conform to `{ success: boolean, data: T, error?: string }`. The Axios client in `frontend/src/lib/api/client.ts` automatically unwraps `response.data.data` so calling services receive typed data directly.

### Authentication & Token Management
- Authentication uses phone numbers (`+91XXXXXXXXXX`) and 6-digit OTP.
- Development/test mode supports deterministic OTP (`123456`) with a relaxed rate limiter for testing speed.
- Access tokens are passed via standard `Authorization: Bearer <token>` headers.
- Tokens and user profiles are synchronized with `localStorage`.

### Idempotency & Order Submission
- Checkout generates UUID v4 idempotency keys (`crypto.randomUUID()`) sent in the `idempotency-key` header on `POST /api/v1/orders`.
- The checkout component features an `isOrderPlaced` ref guard preventing empty-cart redirect race conditions when `clearCart()` is invoked prior to navigating to `/orders/[id]`.

### Order State Machine Implementation
The UI enforces the strict backend finite state machine:
- **Pickup Flow**: `placed` $\to$ `confirmed` $\to$ `packed` $\to$ `ready_for_pickup` $\to$ `picked_up`
- **Delivery Flow**: `placed` $\to$ `confirmed` $\to$ `packed` $\to$ `out_for_delivery` $\to$ `delivered`
- **Cancellation**: Permitted from early states (`placed`, `confirmed`), releasing reserved stock back to inventory.

---

## 5. Automated E2E Testing Suite (Playwright)

Run the test suite from `/frontend`:
```bash
# Run all tests
npx playwright test

# Run customer flows only
npx playwright test tests/customer-flows.spec.ts

# Run admin flows only
npx playwright test tests/admin-flows.spec.ts
```

### Test Coverage Matrix (9/9 Tests Passing - 100%)

| Test Suite | Flow Name | Description | Status |
| :--- | :--- | :--- | :---: |
| **Admin** | Flow 1: Auth Guard & Login | Tests `/admin` route guard, modal trigger, Owner OTP login, and dashboard access | **PASSED** |
| **Admin** | Flow 2: Order Lifecycle | Creates order, fetches in admin, advances through state machine steps to terminal state | **PASSED** |
| **Admin** | Flow 3: Inventory Stock | Edits product stock quantity inline and verifies persistence | **PASSED** |
| **Admin** | Flow 4: Staff Management | Owner assigns and manages staff roles (`operator`, `manager`) | **PASSED** |
| **Customer** | Flow 1: Landing Page | Verifies rural UP branding, GSTIN, category grid, dosage calculator, live products | **PASSED** |
| **Customer** | Flow 2: Catalog & Detail | Verifies catalog search, filtering, and navigation to product detail with lab seals | **PASSED** |
| **Customer** | Flow 3: Cart Management | Verifies adding items, badge count updates, quantity modifications, free delivery bar | **PASSED** |
| **Customer** | Flow 4: Checkout & COD | Farmer OTP login, pickup/delivery toggle, COD terms, order placement & tracking timeline | **PASSED** |
| **Customer** | Flow 5: Farmer Profile | Profile view, verified KCC account status badge, and inline address editing | **PASSED** |

---

## 6. Frontend Anti-Pattern & Scope Boundary Audit (October 2026)

A comprehensive audit was performed across all 13 in-scope screens and shared layout components against the 28 design anti-patterns, Phase 1 scope boundaries, and frontend engineering best practices.

### Fixes Applied During Audit
1. **Next.js `<Image>` Adoption**: Replaced raw `<img>` tags in `ProductCard.tsx`, `app/products/[id]/page.tsx`, and `app/cart/page.tsx` with Next.js `<Image>` featuring automatic optimization, sizing, and lazy loading (`next.config.ts` updated with wildcard HTTPS remote patterns).
2. **Skeleton Loading States**: Upgraded spinner-only loading states to structured, animated skeleton loaders (`animate-pulse`) across Product Detail (`/products/[id]`), Shopping Cart (`/cart`), Order History (`/orders`), and Order Tracking (`/orders/[id]`).
3. **Typography & Accent Cleanliness**:
   - Replaced em dash (`—`) in hero headline on `app/page.tsx` with Devanagari bullet separator (`•`).
   - Replaced multi-hue gradient banner accent on `app/profile/page.tsx` with a solid primary accent bar matching Stitch tokens.
4. **End-to-End Test Suite Robustness**:
   - Adjusted Playwright OTP and navigation timeouts to accommodate remote cloud database and SMS gateway latency.
   - All 9 critical customer and admin flows pass 100%.

### Open Items & Architectural Recommendations
1. **Compliance (Terms of Service & Privacy Policy)**: Links to Terms of Service and Privacy Policy are currently absent from the footer. Because this application facilitates regulated agrochemical distribution (CIB&RC compliance) and collects customer PII (phone number, village, delivery coordinates), real legal policies must be provided by Digvijay before public production deployment.
2. **Refresh Token Cookie Storage**: The Phase 1 NestJS backend returns access and refresh tokens in the JSON response payload, stored by the client in `localStorage`. For production hardening, transition refresh token transmission to an `httpOnly`, `secure`, `SameSite=Strict` cookie via the backend or a Next.js route handler proxy to prevent potential XSS extraction.
