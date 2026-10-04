# Context Entry: Admin Module (Role-Based Access Control, Catalog & Order Operations, Staff Admin)

## IDENTITY
- **Feature/change name:** Admin Module with Role-Based Access Control (`owner` vs `staff`), Product CRUD, Order Status Advancement, and Staff Management
- **Unique identifier:** CTX-011
- **Status:** complete
- **Owner:** Digvijay
- **Created:** 2026-10-02 / **Last updated:** 2026-10-02

## INTENT
- **Problem being solved:** Store owners and staff operate the physical store and fulfill digital orders. Staff must be able to view orders across all customers, update stock levels, and advance order fulfillment statuses through the state machine. However, high-risk actions (creating/deleting products, price changes, creating staff accounts) must be restricted strictly to business owners (`owner`). Customer accounts must never access admin APIs.
- **Objective:** Provide secure, role-guarded admin endpoints enforcing fine-grained separation of privileges between `owner` and `staff`.
- **Expected behavior:**
  - `RolesGuard` and `@Roles('owner' | 'staff')` decorator enforce RBAC on top of `JwtAuthGuard`.
  - Customer attempts to access any `/api/v1/admin/*` endpoint return `403 Forbidden`.
  - Staff can list all orders, view order details with customer contact info, update product stock (`PATCH /api/v1/admin/products/:id/stock`), and advance order statuses through the finite state machine (`PATCH /api/v1/admin/orders/:id/status`).
  - Owner exclusively can create products (`POST /api/v1/admin/products`), update product pricing/details (`PATCH /api/v1/admin/products/:id`), soft-delete products (`DELETE /api/v1/admin/products/:id`), and manage staff accounts (`GET/POST/DELETE /api/v1/admin/staff`).
- **Scope:** `AdminController`, `AdminService`, `AdminRepository`, `RolesGuard`, `@Roles()`, `AdminUserEntity`, DTOs.
- **Explicitly out-of-scope:** Marg ERP automated synchronization, complex analytics dashboards (Phase 2).

## ARCHITECTURE
- **Affected services/modules:**
  - `src/modules/admin/`: Controller, Service, Repository, DTOs, Entity
  - `src/common/guards/`: `RolesGuard`
  - `src/common/decorators/`: `Roles`
  - `src/modules/orders/`: `OrdersService` (delegates order status advancement and state machine transition rules)
  - `src/modules/auth/`: `AuthService` (checks `admin_users` during OTP verification to embed `role: 'owner' | 'staff'` in JWT tokens)
- **Data flow:**
  1. Login $\rightarrow$ `AuthService.verifyOtp` $\rightarrow$ checks `admin_users.phone_number` $\rightarrow$ attaches role to JWT payload.
  2. Request to `/api/v1/admin/*` $\rightarrow$ `JwtAuthGuard` validates token $\rightarrow$ `RolesGuard` inspects `@Roles()` metadata against `req.user.role` $\rightarrow$ permits or throws `403 Forbidden`.
  3. Status advancement $\rightarrow$ `AdminController.updateOrderStatus` $\rightarrow$ `AdminService` $\rightarrow$ `OrdersService.updateOrderStatus` $\rightarrow$ `OrderStateMachine` validates transition $\rightarrow$ `OrdersRepository` updates status (or cancels and restores stock) $\rightarrow$ emits `order.status_changed`.

## DECISIONS

| Decision | Reason | Alternatives considered | Why preferred | Trade-offs |
|---|---|---|---|---|
| Explicit role distinction (`owner` vs `staff`) stored in Postgres `admin_users` table | Prevents staff employees from accidentally or maliciously altering pricing, deleting products, or adding unauthorized staff | Single generic `admin` boolean flag | Protects core business margins and catalog integrity | Requires role check on admin endpoints |
| Embed role directly inside short-lived JWT access token (15m) | Eliminates DB query on every guarded request while keeping revocation window short | Querying database on every single request | Zero latency overhead on guarded admin requests | If an admin's role is demoted, access persists until token expiry (max 15 mins) |
| Order status advancement delegates directly to `OrdersService` | Reuses finite state machine transition rules and inventory restoration logic without code duplication | Re-implementing update logic in `AdminService` | Single source of truth for order transitions; stock is guaranteed restored if admin cancels order | Tight coupling between `AdminService` and `OrdersService` |
| Soft-delete products via `is_active = false` | Preserves historical integrity for past orders, GST invoices, and reporting (PRD CTX-002) | Hard delete (`DELETE FROM products`) | Hard deletes would break foreign key constraints or cascade delete historical line items | Inactive products must be filtered out of customer catalog queries |

## IMPLEMENTATION
- **Files created:**
  - `backend/src/common/decorators/roles.decorator.ts`
  - `backend/src/common/guards/roles.guard.ts`
  - `backend/src/common/guards/roles.guard.spec.ts`
  - `backend/src/modules/admin/entities/admin-user.entity.ts`
  - `backend/src/modules/admin/dto/create-product.dto.ts`
  - `backend/src/modules/admin/dto/update-product.dto.ts`
  - `backend/src/modules/admin/dto/update-stock.dto.ts`
  - `backend/src/modules/admin/dto/update-order-status.dto.ts`
  - `backend/src/modules/admin/dto/create-staff.dto.ts`
  - `backend/src/modules/admin/dto/admin-order-detail-response.dto.ts`
  - `backend/src/modules/admin/admin.repository.ts`
  - `backend/src/modules/admin/admin.service.ts`
  - `backend/src/modules/admin/admin.controller.ts`
  - `backend/src/modules/admin/admin.module.ts`
  - `backend/src/modules/admin/admin.service.spec.ts`
  - `backend/src/modules/admin/admin.controller.spec.ts`
  - `backend/test/admin.e2e-spec.ts`
- **Files modified:**
  - `backend/src/modules/auth/auth.service.ts` (queries `admin_users` on OTP verification and issues role-aware JWT)
  - `backend/src/modules/auth/auth.module.ts` (imports `AdminModule`)
  - `backend/src/app.module.ts` (imports `AdminModule`)

## VERIFICATION
- **Commands executed:**
  - `npm test`: 20 test suites, 91 unit tests passed.
  - `npm run test:e2e`: 5 test suites, 31 E2E tests passed.
  - `npm run build`: Clean TypeScript build.
- **Frontend Audit (October 2026):**
  - Confirmed admin routes guarded independently by client-side auth check (`useEffect`) and backend `JwtAuthGuard` + `RolesGuard` (`@Roles('owner')`, `@Roles('owner', 'staff')`).
  - Direct API calls without tokens return `401 Unauthorized`; non-owner/non-staff return `403 Forbidden`.
  - All 4 Playwright admin flows (auth guard, order lifecycle, stock update, staff RBAC) passing 100%.
