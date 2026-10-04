# Bhagwati Kisan Mart — Postman Collection & Testing Guide

This folder contains the complete, production-grade Postman collection and environment for testing all Phase 1 backend endpoints of **Bhagwati Kisan Mart**.

---

## Files Included

1. **`Bhagwati_Kisan_Mart.postman_collection.json`** — Postman Collection v2.1.0 containing all 21 endpoints grouped into 7 functional folders with pre-configured request bodies, query parameters, headers, and automatic token management test scripts.
2. **`Bhagwati_Kisan_Mart_Local.postman_environment.json`** — Environment preset configured for local development (`http://localhost:4000/api/v1`).

---

## Quick Import Instructions

1. Open **Postman**.
2. Click **Import** (top left).
3. Drag & drop or select both files:
   - `Bhagwati_Kisan_Mart.postman_collection.json`
   - `Bhagwati_Kisan_Mart_Local.postman_environment.json`
4. In the top right corner of Postman, select the **Bhagwati Kisan Mart (Local)** environment.

---

## Automatic Variable Chaining (Zero Copy-Pasting)

The collection includes automated **Post-response Scripts (Tests)** that keep your session in sync:

- **Login (`1.2 Verify OTP`):** Automatically extracts `data.tokens.accessToken` and `data.tokens.refreshToken` and writes them into `access_token` and `refresh_token` variables. All protected endpoints immediately inherit the token!
- **Token Refresh (`1.3 Refresh Access Token`):** Automatically rotates and updates the `access_token`.
- **Product Browsing (`2.1 List Products`):** Automatically grabs the first product's UUID and saves it into `product_id`.
- **Order Placement (`4.1 Place Order`):** Automatically saves the newly created order's UUID into `order_id` for immediate detail and cancellation testing.
- **Staff Registration (`7.2 Register Staff`):** Automatically captures `staff_id` for deletion testing.

---

## Recommended Testing Sequence

### 1. Customer Authentication Flow
1. Run **`1.1 Send OTP`** (`POST /api/v1/auth/otp/send`) — Sends 6-digit OTP to mobile number.
2. Run **`1.2 Verify OTP`** (`POST /api/v1/auth/otp/verify`) — In development/testing, check terminal logs or SMS. Saves JWT token automatically!
3. Run **`1.4 Get Current Session`** (`GET /api/v1/auth/me`) — Confirms customer identity.

### 2. Product Browsing
1. Run **`2.1 List Products`** (`GET /api/v1/products?category=herbicide`) — Returns paginated catalog and saves `product_id`.
2. Run **`2.2 Get Product by ID`** (`GET /api/v1/products/{{product_id}}`) — Returns dosage, brand, pricing, and stock.

### 3. Customer Profile & Shipping Address
1. Run **`3.1 Get Profile`** (`GET /api/v1/users/profile`) — Checks `isProfileComplete` status.
2. Run **`3.2 Update Profile`** (`PATCH /api/v1/users/profile`) — Sets delivery address and 6-digit Indian PIN code.

### 4. Checkout & Order Lifecycle
1. Run **`4.1 Place Order`** (`POST /api/v1/orders`) — Concurrency-safe atomic checkout with Cash on Delivery (COD). Generates GST invoice and saves `order_id`.
2. Run **`4.2 List Customer Orders`** (`GET /api/v1/orders`) — Lists current customer's order history.
3. Run **`4.3 Get Order by ID`** (`GET /api/v1/orders/{{order_id}}`) — Returns full order breakdown.
4. Run **`4.4 Cancel Order`** (`PATCH /api/v1/orders/{{order_id}}/cancel`) — Cancels placed order and automatically restores stock to the catalog.

### 5. Admin Operations (RBAC: Owner & Staff)
*(Note: To test admin endpoints, login with a phone number registered in `admin_users` table with `role: owner` or `role: staff`)*
1. Run **`5.1 List All Products`** (`GET /api/v1/admin/products`) — View catalog including inactive items.
2. Run **`5.2 Create Product`** (`POST /api/v1/admin/products`) — Add new item (Owner only).
3. Run **`5.4 Update Stock Quantity`** (`PATCH /api/v1/admin/products/{{product_id}}/stock`) — Restock inventory (Owner/Staff).
4. Run **`6.1 List All Orders`** (`GET /api/v1/admin/orders`) — View all orders across all customers.
5. Run **`6.3 Advance Order Status`** (`PATCH /api/v1/admin/orders/{{order_id}}/status`) — Step order through state machine (`placed` $\to$ `confirmed` $\to$ `packed` $\to$ `out_for_delivery` $\to$ `delivered`).
6. Run **`7.1 List Staff Members`** (`GET /api/v1/admin/staff`) — Manage store employees (Owner only).
