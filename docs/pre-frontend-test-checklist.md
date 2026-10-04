# Pre-Frontend Testing Checklist & Acceptance Test Cases
## Bhagwati Kisan Mart — Backend Validation Matrix (Phase 1)

This document establishes the exhaustive verification criteria and acceptance test cases that must be executed and confirmed passing before frontend development begins. 

Every test case can be validated using the automated test suite (`npm test`, `npm run test:e2e`) or manually executed via the Postman collection ([`backend/postman/Bhagwati_Kisan_Mart.postman_collection.json`](../backend/postman/Bhagwati_Kisan_Mart.postman_collection.json)).

---

## Summary Matrix

| Category | Suite ID | Test Case Count | Focus Area |
|---|---|---|---|
| **1. Authentication & Security** | `TC-AUTH` | 9 cases | Phone/OTP flow, Redis rate limits, brute-force mitigation, JWT rotation |
| **2. Profile & Demographic Validation** | `TC-USER` | 5 cases | Profile completeness, Indian PIN format, delivery addresses, IDOR protection |
| **3. Catalog & Search** | `TC-PROD` | 5 cases | Pagination, category filters, soft-delete filtering, detail lookup |
| **4. Concurrency & Checkout** | `TC-ORD` | 10 cases | Atomic stock decrement, race-condition immunity, idempotency, COD |
| **5. Order State Machine** | `TC-FSM` | 7 cases | Transition rules, fulfillment branching, cancellation stock reversal |
| **6. Role-Based Access Control** | `TC-RBAC` | 7 cases | Separation of `owner`, `staff`, and `customer` privileges |
| **7. GST & Regulatory Integrity** | `TC-REG` | 3 cases | Invoice generation, soft-delete historical audit, negative stock constraint |
| **8. System & API Envelope Standards** | `TC-SYS` | 4 cases | Standard envelope format, `x-request-id` tracing, error redaction |
| **Total** | | **50 test cases** | |

---

## 1. Authentication & Session Lifecycle (`TC-AUTH`)

| ID | Title | Precondition / Input | Execution Step | Expected Result |
|---|---|---|---|---|
| **TC-AUTH-01** | Standard OTP Send | Valid 10-digit Indian phone (e.g. `9876543210`) | `POST /api/v1/auth/otp/send` | Returns `200 OK`, `{ success: true, data: { cooldownSeconds: 60 } }`. OTP dispatched via MSG91 (or logged in dev). |
| **TC-AUTH-02** | 60-Second Cooldown Enforcement | Immediate re-request within 60s for same phone number | `POST /api/v1/auth/otp/send` | Returns `429 Too Many Requests`, `{ message: "Please wait 60 seconds before requesting another OTP" }`. |
| **TC-AUTH-03** | Hourly Rate Limit Cap | Exceed 5 OTP requests within 1 hour | `POST /api/v1/auth/otp/send` 6 times | Returns `429 Too Many Requests`, `{ message: "Maximum OTP request limit reached for this hour" }`. |
| **TC-AUTH-04** | Invalid Phone Number Formats | Phone: `"12345"`, `"+1234567890"`, `"abcdefghij"`, `"0987654321"` | `POST /api/v1/auth/otp/send` | Returns `400 Bad Request` with validation error: `"Please provide a valid 10-digit Indian mobile number"`. |
| **TC-AUTH-05** | Incorrect OTP Rejection | Active OTP exists; submit wrong code `000000` | `POST /api/v1/auth/otp/verify` | Returns `401 Unauthorized` with attempts countdown: `"Invalid OTP. 4 attempts remaining."` |
| **TC-AUTH-06** | Brute-Force Throttle (Max 5 Attempts) | Submit wrong OTP 5 consecutive times | `POST /api/v1/auth/otp/verify` | 5th failure invalidates OTP in Redis and returns `401 Unauthorized`: `"Too many failed attempts. Please request a new OTP."` |
| **TC-AUTH-07** | Successful OTP Verification & Account Creation | Submit correct 6-digit OTP | `POST /api/v1/auth/otp/verify` | Returns `200 OK`, user entity created in `users` table if first login, returns `accessToken` (15m expiry), `refreshToken` (7d expiry), and user profile. |
| **TC-AUTH-08** | Access Token Expiry & Refresh Token Rotation | Use valid `refreshToken` | `POST /api/v1/auth/refresh` | Returns `200 OK` with fresh `accessToken` and rotated `refreshToken`. Previous refresh token is revoked in Redis. |
| **TC-AUTH-09** | Refresh Token Reuse Attack Mitigation | Re-submit an already-used `refreshToken` | `POST /api/v1/auth/refresh` | Returns `401 Unauthorized`. Revokes all sessions for that user ID in Redis. |

---

## 2. Customer Profile & Demographic Validation (`TC-USER`)

| ID | Title | Precondition / Input | Execution Step | Expected Result |
|---|---|---|---|---|
| **TC-USER-01** | Get Current Profile | Authenticated with Bearer token | `GET /api/v1/users/profile` | Returns `200 OK` with customer ID, phone, name, address, pincode, district, region, and `isProfileComplete`. |
| **TC-USER-02** | Profile Completeness Calculation | User has name and phone, but missing address and pincode | `GET /api/v1/users/profile` | `isProfileComplete` is `false`. |
| **TC-USER-03** | Complete Profile Update | Payload with name, address, valid pincode (`209202`), and district | `PATCH /api/v1/users/profile` | Returns `200 OK` with updated fields; `isProfileComplete` becomes `true`. |
| **TC-USER-04** | Invalid Indian PIN Code Format | Pincode: `"12345"` (5 digits), `"012345"` (starts with 0), `"PIN123"` | `PATCH /api/v1/users/profile` | Returns `400 Bad Request`: `"Pincode must be a valid 6-digit Indian postal code"`. |
| **TC-USER-05** | IDOR Immunity | Customer tries to supply an alternate `:userId` | N/A (Endpoints take identity strictly from `@CurrentUser('userId')`) | Customer can only ever retrieve and update their own record. |

---

## 3. Product Catalog & Browsing (`TC-PROD`)

| ID | Title | Precondition / Input | Execution Step | Expected Result |
|---|---|---|---|---|
| **TC-PROD-01** | Catalog Listing Pagination | Query params `page=1&limit=2` | `GET /api/v1/products?page=1&limit=2` | Returns `200 OK`, `items` array of length 2, `total`, `page: 1`, `limit: 2`, `totalPages`. |
| **TC-PROD-02** | Category Filtering | Query param `category=herbicide` | `GET /api/v1/products?category=herbicide` | Returns only items matching category `herbicide`. |
| **TC-PROD-03** | Invalid Category Enum | Query param `category=smartphones` | `GET /api/v1/products?category=smartphones` | Returns `400 Bad Request`: `"category must be a valid enum value"`. |
| **TC-PROD-04** | Soft-Deleted Products Hidden from Storefront | Product in DB has `is_active = false` | `GET /api/v1/products` | Inactive product is omitted from storefront query results. |
| **TC-PROD-05** | Get Single Product Details | Valid UUID of existing active product | `GET /api/v1/products/:id` | Returns `200 OK` with description, dosage instructions, brand, price, MRP, and current stock count. |

---

## 4. Order Checkout & Concurrency-Safe Stock (`TC-ORD`)

| ID | Title | Precondition / Input | Execution Step | Expected Result |
|---|---|---|---|---|
| **TC-ORD-01** | Standard COD Checkout | Valid cart, fulfillment `delivery`, customer has address & pincode | `POST /api/v1/orders` | Returns `201 Created`, status `placed`, paymentStatus `pending`, paymentMethod `cod`, and unique GST invoice number `BKM-INV-YYYY-XXXXXX`. |
| **TC-ORD-02** | Delivery Fee Calculation Thresholds | Subtotal < ₹1,000 vs $\ge$ ₹1,000 | `POST /api/v1/orders` | Orders < ₹1,000 incur flat ₹50 delivery fee; orders $\ge$ ₹1,000 receive ₹0 free delivery. |
| **TC-ORD-03** | Delivery Address Completeness Guard | Customer profile lacks delivery address or PIN code | `POST /api/v1/orders` with `fulfillmentType: delivery` | Returns `400 Bad Request`: `"Delivery orders require a complete delivery address. Please update your profile before checkout."` |
| **TC-ORD-04** | In-Store Pickup Checkout | Customer has no delivery address; selects `fulfillmentType: pickup` | `POST /api/v1/orders` | Returns `201 Created` with delivery fee ₹0. No address check required. |
| **TC-ORD-05** | Atomic Stock Decrement | Product initial stock = 10; order quantity = 3 | `POST /api/v1/orders` | Database `stock_qty` reduces to 7 atomically within the transaction. |
| **TC-ORD-06** | Insufficient Stock Rejection | Product stock = 5; order quantity = 8 | `POST /api/v1/orders` | Returns `409 Conflict`: `"Insufficient stock for <Product>..."`. Stock remains 5. Zero partial decrements. |
| **TC-ORD-07** | High-Concurrency Race Condition | 2 concurrent checkout requests for the last 1 remaining unit | Execute both requests simultaneously | Exactly one request returns `201 Created`; the other returns `409 Conflict`. Final stock is 0 (never negative). |
| **TC-ORD-08** | Idempotency Key Guard | Double-tap "Place Order" with identical `x-idempotency-key` | `POST /api/v1/orders` with same key twice | Second request returns `201 Created` with identical existing order record. Stock is NOT decremented twice. |
| **TC-ORD-09** | Client Price Tampering Immunity | Client sends payload with manipulated price | `POST /api/v1/orders` | Line item unit price and order total are computed server-side directly from the `products` table. |
| **TC-ORD-10** | Cross-Customer Order Isolation | Customer B attempts `GET /api/v1/orders/:id` for Customer A's order | `GET /api/v1/orders/:id` | Returns `403 Forbidden`: `"You do not have permission to view this order"`. |

---

## 5. Order State Machine & Fulfillment Lifecycle (`TC-FSM`)

| ID | Title | Precondition / Input | Execution Step | Expected Result |
|---|---|---|---|---|
| **TC-FSM-01** | Valid Delivery State Flow | Order in `placed` | Advance: `placed` $\to$ `confirmed` $\to$ `packed` $\to$ `out_for_delivery` $\to$ `delivered` | Each step succeeds with `200 OK` and updates database status. |
| **TC-FSM-02** | Valid Pickup State Flow | Pickup order in `packed` | Advance: `packed` $\to$ `ready_for_pickup` $\to$ `picked_up` | Succeeds with `200 OK`. |
| **TC-FSM-03** | Illegal State Jump Rejection | Order in `placed` | Attempt to advance directly: `placed` $\to$ `delivered` | Returns `400 Bad Request`: `"Invalid order status transition from 'placed' to 'delivered'..."`. |
| **TC-FSM-04** | Fulfillment Path Cross-Contamination | Order has `fulfillment_type: delivery`; status `packed` | Attempt: `packed` $\to$ `ready_for_pickup` | Returns `400 Bad Request`: `"Invalid order status transition..."`. Delivery orders cannot jump to pickup states. |
| **TC-FSM-05** | Terminal State Immutability | Order is `delivered` or `cancelled` | Attempt transition to any other status | Returns `400 Bad Request`. Terminal states cannot be altered. |
| **TC-FSM-06** | Customer Cancellation & Stock Restoration | Order in `placed` or `confirmed`; product initial stock was 10 | `PATCH /api/v1/orders/:id/cancel` | Order status becomes `cancelled`. Product `stock_qty` is atomically restored back to 10. |
| **TC-FSM-07** | Cancellation Disallowed for Processed Orders | Order is `packed` or `out_for_delivery` | `PATCH /api/v1/orders/:id/cancel` | Returns `400 Bad Request`: `"Order cannot be cancelled because it is in 'packed' status"`. |

---

## 6. Role-Based Access Control (`TC-RBAC`)

| ID | Title | Precondition / Input | Execution Step | Expected Result |
|---|---|---|---|---|
| **TC-RBAC-01** | Unauthenticated Admin Access | No Authorization header | `GET /api/v1/admin/orders` | Returns `401 Unauthorized`. |
| **TC-RBAC-02** | Customer Denied Admin Access | Valid customer JWT token (`role: customer`) | `GET /api/v1/admin/orders` | Returns `403 Forbidden`: `"Access denied: Required role in [owner, staff]"`. |
| **TC-RBAC-03** | Staff Access to Order Queue | Staff JWT token (`role: staff`) | `GET /api/v1/admin/orders` | Returns `200 OK` with full order list across all customers. |
| **TC-RBAC-04** | Staff Denied Product Deletion | Staff JWT token (`role: staff`) | `DELETE /api/v1/admin/products/:id` | Returns `403 Forbidden`: `"Access denied: Required role in [owner]"`. |
| **TC-RBAC-05** | Owner Allowed Product Deletion | Owner JWT token (`role: owner`) | `DELETE /api/v1/admin/products/:id` | Returns `200 OK`. Product `is_active` set to `false`. |
| **TC-RBAC-06** | Staff Allowed Inventory Restocking | Staff JWT token (`role: staff`) | `PATCH /api/v1/admin/products/:id/stock` with `stockQty: 80` | Returns `200 OK`. Stock updated to 80. |
| **TC-RBAC-07** | Staff Denied Staff Account Creation | Staff JWT token (`role: staff`) | `POST /api/v1/admin/staff` | Returns `403 Forbidden` (only owner can recruit staff). |

---

## 7. GST & Regulatory Data Integrity (`TC-REG`)

| ID | Title | Precondition / Input | Execution Step | Expected Result |
|---|---|---|---|---|
| **TC-REG-01** | Unique GST Invoice Number Generation | Place 3 consecutive orders | `POST /api/v1/orders` | Each order receives a distinct, sequential sequence string (e.g. `BKM-INV-2026-XXXXXX`). |
| **TC-REG-02** | Database Foreign Key Safety on Inactive Products | Product referenced in past `order_items` is deactivated | Deactivate product via `DELETE /api/v1/admin/products/:id` | Past order line items remain fully intact and queryable with correct price and name audit history. |
| **TC-REG-03** | Database CHECK Constraint Backstop | SQL injection / raw query attempt to set `stock_qty = -1` | Attempt update bypassing app layer | PostgreSQL throws `chk_products_stock_qty` check violation. Prevents corrupt data. |

---

## 8. System & API Envelope Consistency (`TC-SYS`)

| ID | Title | Precondition / Input | Execution Step | Expected Result |
|---|---|---|---|---|
| **TC-SYS-01** | Uniform Success Envelope Format | Any successful request (`GET`, `POST`, `PATCH`) | Call any endpoint | Response JSON strictly follows: `{ "success": true, "data": <Payload>, "error": null }`. |
| **TC-SYS-02** | Uniform Error Envelope Format | Any bad request, validation error, or 404 | Call invalid route or malformed body | Response JSON strictly follows: `{ "success": false, "data": null, "error": { "code": "...", "message": "...", "timestamp": "...", "path": "..." } }`. |
| **TC-SYS-03** | End-to-End Correlation Tracing | Send custom `x-request-id: req-abc-123` | Inspect response headers | `x-request-id` response header matches `req-abc-123`. Included in structured server logs. |
| **TC-SYS-04** | Sensitive Information Redaction | Cause a 500 error or inspect logs | Check response body & Pino stdout | Never exposes raw database connection strings, stack traces, full passwords, or plain OTPs. |

---

## Acceptance Sign-Off Checklist Before Frontend Build

Before issuing frontend commands (`create-next-app` or equivalent):

- [x] Run `npm test` in `/backend` — All 20 test suites (91 unit tests) pass.
- [x] Run `npm run test:e2e` in `/backend` — All 5 E2E test suites (31 integration tests) pass.
- [x] Run `npm run build` in `/backend` — Clean TypeScript build with 0 errors.
- [x] Import `Bhagwati_Kisan_Mart.postman_collection.json` into Postman and execute complete customer order flow (OTP $\to$ Profile $\to$ Checkout $\to$ Cancel).
- [x] Ensure your real phone number is seeded in `admin_users` table with `role = 'owner'` to test admin dashboard during frontend integration.
