# Context Entry: Concurrency-Safe Inventory Updates

## IDENTITY
- **Feature/change name:** Concurrency-Safe Stock Decrement
- **Unique identifier:** CTX-003
- **Status:** complete (implemented and verified in OrdersModule CTX-010)
- **Owner:** Digvijay
- **Created:** 2026-09 / **Last updated:** 2026-10-02

## INTENT
- **Problem being solved:** Two customers can attempt to check out the same low-stock pesticide at nearly the same moment. A naive read-then-write stock update (`read stock → check > 0 → decrement`) has a race condition that can oversell a regulated, limited-stock product.
- **Objective:** Guarantee `stock_qty` never goes negative and never oversells under concurrent checkout requests.
- **Expected behavior:** When two concurrent checkout attempts target the last unit of a product, exactly one succeeds and the other fails gracefully with an "out of stock" response.
- **Scope:** The stock decrement step inside order creation (`OrdersService.createOrder()`).
- **Explicitly out-of-scope:** Backorder/waitlist handling — not needed at Phase 1.

## ARCHITECTURE
- **Affected services/modules:** `OrdersModule` (specifically the order-creation flow), `products` table.
- **Data flow:** Checkout request → stock check-and-decrement → order + order_items creation → (future) payment confirmation.

## DECISIONS

| Decision | Reason | Alternatives considered | Why preferred | Trade-offs |
|---|---|---|---|---|
| Atomic SQL update: `UPDATE products SET stock_qty = stock_qty - :qty WHERE id = :id AND stock_qty >= :qty`, checking affected-row count | Simplest correct fix; no additional locking infrastructure required | `SELECT ... FOR UPDATE` row-level locking inside a DB transaction | Fewer moving parts, same correctness guarantee at current scale; a single-row atomic conditional update is sufficient when stock changes are per-product, not multi-row | Less flexible if future logic requires coordinated multi-row stock changes (e.g., bundle products) — would need `FOR UPDATE` at that point |
| DB-level `CHECK (stock_qty >= 0)` constraint as a backstop | Defense in depth — catches any application-layer bug that bypasses the atomic update path | Rely on application logic alone | A DB constraint fails safe even if a future code change introduces a bug in the decrement logic | None meaningful |

## SECURITY
- Prevents a correctness-based abuse vector: a user (or bot) rapidly re-submitting checkout requests cannot force negative stock or duplicate fulfillment of the same limited unit.

## VALIDATION
- **Scenarios to cover once implemented:** two concurrent requests for the last unit (exactly one succeeds); request for more units than available (fails cleanly); request during a stock update from admin dashboard (no lost update).
- **Known limitation to document post-implementation:** behavior under extremely high concurrency (far beyond this business's realistic traffic) not load-tested — not necessary at current scale.

## CLEANUP
- N/A — pre-implementation.

## DEPENDENCIES
`OrdersModule → OrdersService.createOrder() → ProductsRepository → products table (stock_qty, CHECK constraint)`

## HISTORY

| Date | What changed | Why | Initiated by | Related decision/issue |
|---|---|---|---|---|
| 2026-09 | Pattern specified in PRD Section 2.5.3 | "Best practices, design patterns, system design" requested | Digvijay | Flagged as a real business-correctness issue, not theoretical |

## OPEN_ITEMS
- Not yet implemented — first concrete task within the OrdersModule build step.
- Test coverage for the race condition itself (simulated concurrent requests) must be included in OrdersModule's test suite, not assumed from manual testing alone.
