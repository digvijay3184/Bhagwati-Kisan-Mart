# Context Entry: Database Schema v1

## IDENTITY
- **Feature/change name:** Core Database Schema (Phase 1)
- **Unique identifier:** CTX-002
- **Status:** complete (schema design locked, migrations not yet written)
- **Owner:** Digvijay
- **Created:** 2026-08 / **Last updated:** 2026-09

## INTENT
- **Problem being solved:** Define a schema sufficient for catalog browsing, cart/checkout, order fulfillment (delivery + pickup), and admin management, while staying extensible for future phases without requiring destructive migrations later.
- **Objective:** A schema that is correct under concurrent access and supports GST-compliant invoicing from day one.
- **Expected behavior:** Products, orders, and users are modeled with enough structure to support Phase 1 features cleanly.
- **Scope:** `users`, `products`, `orders`, `order_items`, `admin_users` tables.
- **Explicitly out-of-scope:** Content/video tables, social-feature tables (comments, follows) — deferred until those features are triggered (see `scope-boundaries-phase1.md`).

## ARCHITECTURE
- **Affected services/modules:** ProductsModule, OrdersModule, UsersModule, AdminModule — all read/write through the Repository pattern (see `/docs/PRD.md` Section 2.5.1).
- **Data flow:** Customer browses `products` → adds to cart (client-side/session state, not yet persisted server-side in Phase 1) → `orders` + `order_items` created at checkout → `products.stock_qty` decremented atomically.

## DECISIONS

| Decision | Reason | Alternatives considered | Why preferred | Trade-offs |
|---|---|---|---|---|
| `region`/`district` captured on `users` now, unused by any feature yet | Cheap to add at schema-design time, painful to retrofit once real user data exists | Add only when content/region features are actually built | Avoids a disruptive later migration on a growing users table | Slight schema "unused field" until Phase 2+ features consume it — acceptable, documented here explicitly so it isn't mistaken for dead code |
| Soft-delete via `products.is_active` rather than hard delete | Products referenced by historical orders must remain queryable for order history/invoicing | Hard delete with cascading order cleanup | Hard delete would corrupt historical order records — a real correctness issue for a GST-invoicing business | Requires UI/admin logic to filter inactive products from customer-facing views |
| DB-level `CHECK (stock_qty >= 0)` constraint, not application-only validation | Application-layer checks alone are not safe under concurrent requests | Application-layer validation only | A DB constraint is the last line of defense against overselling even if application logic has a bug | None meaningful — standard practice |
| Foreign keys with `ON DELETE RESTRICT` on `order_items → products` | Prevents accidental data loss that would break order history integrity | `ON DELETE CASCADE` | Cascade would silently delete order line items if a product row were ever removed — unacceptable for a regulated-goods business with invoicing obligations | None meaningful |

## IMPLEMENTATION
- **Database/schema changes:** Full schema specified in `/docs/PRD.md` Section 2.3 — `users(id, phone_number, name, address, pincode, district, region, created_at)`, `products(id, name, category, brand, description, dosage_info, price, mrp, stock_qty, hsn_code, gst_rate, image_urls[], is_active, created_at, updated_at)`, `orders(id, user_id, status, fulfillment_type, total_amount, payment_status, payment_method, gst_invoice_no, created_at)`, `order_items(id, order_id, product_id, quantity, unit_price, subtotal)`, `admin_users(id, name, phone_number, role, created_at)`.
- **Indexes specified:** `products.category`, `products.is_active`, `products.brand`; `orders.user_id`, `orders.status`, `orders.created_at`; unique constraint on `users.phone_number`.
- Migrations not yet written — this entry records the design decision ahead of implementation.

## SECURITY
- `users.phone_number` is the primary identity key — unique constraint required to prevent duplicate-account exploitation of OTP flow.
- No payment card data stored in schema — payment handled entirely via gateway tokens/references (`orders.payment_method`, future payment reference field), per PCI-scope avoidance.

## VALIDATION
- N/A — pre-implementation. Validation criteria for when migrations are written: constraints enforced at DB level (not just app level), foreign keys verified, index presence confirmed via `EXPLAIN ANALYZE` on primary query paths once data exists.

## CLEANUP
- N/A — pre-implementation.

## DEPENDENCIES
`Schema → ProductsModule / OrdersModule / UsersModule / AdminModule repositories → Supabase (Postgres)`

## HISTORY

| Date | What changed | Why | Initiated by | Related decision/issue |
|---|---|---|---|---|
| 2026-08 | Initial schema drafted | Needed for PRD technical requirements | Planning discussion | PRD Section 2.3 |
| 2026-09 | Indexing/constraints/design-patterns pass added | "Best practices, design patterns, system design" requested | Digvijay | PRD v1.2 update |

## OPEN_ITEMS
- Migrations not yet written — first concrete implementation task for the backend build sequence.
- Cart persistence model (session vs. DB-backed) not yet finalized — currently assumed client-side until checkout.
- HSN code / GST rate values need to be populated per actual product catalog before launch (business data entry task, not a schema task).
