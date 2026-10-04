# Context Entry: Order State Machine

## IDENTITY
- **Feature/change name:** Order Status State Machine
- **Unique identifier:** CTX-005
- **Status:** complete (implemented and verified in OrdersModule CTX-010)
- **Owner:** Digvijay
- **Created:** 2026-09 / **Last updated:** 2026-10-02

## INTENT
- **Problem being solved:** `order.status` as a free-form enum any code can set arbitrarily risks invalid transitions (e.g., jumping `placed → delivered` directly), which would corrupt order history and admin dashboard reliability.
- **Objective:** Make order history genuinely trustworthy — every status change reflects a real, valid operational step.
- **Expected behavior:** Status can only move through valid transitions; invalid transition attempts are rejected by `OrdersService`.
- **Scope:** `orders.status` field and its transition logic.
- **Explicitly out-of-scope:** Notifications tied to each transition (handled separately via the event-driven side-effects pattern, see below).

## ARCHITECTURE
- **Affected services/modules:** `OrdersModule` — specifically a dedicated state-machine component within `orders/state-machine/` (per PRD Section 2.6 folder structure).
- **Integration points:** Emits `EventEmitter` events on transition (e.g., `OrderConfirmedEvent`) per PRD Section 2.5.7, consumed by separate listeners for SMS notification, admin dashboard updates, etc.

## DECISIONS

| Decision | Reason | Alternatives considered | Why preferred | Trade-offs |
|---|---|---|---|---|
| Explicit finite state machine: `placed → confirmed → packed → out_for_delivery/ready_for_pickup → delivered/picked_up`, with `cancelled` reachable only from early states | Prevents an entire class of admin-dashboard bugs (invalid status jumps) and keeps order history trustworthy | Free-form status enum with no enforced transition rules | A free-form enum allows any code path to set any status, including accidental or buggy direct-to-`delivered` jumps | Requires explicit transition-validation logic in `OrdersService`, slightly more code than a bare enum |
| Transition logic enforced in `OrdersService`, not in the database layer | Business logic (what's a valid next state) belongs in the service layer; the DB only needs the enum type itself | Enforce via DB trigger/constraint | Keeps transition rules in application code where they're easier to read, test, and evolve as fulfillment workflow changes | DB alone cannot prevent an invalid transition if a bug bypasses the service layer — acceptable given the service layer is the single write path for this field |

## SECURITY
- Prevents a specific trust/fraud concern: an order cannot be marked `delivered` without passing through `packed`/`out_for_delivery` first, which matters for dispute resolution with customers.

## VALIDATION
- **Scenarios to cover once implemented:** valid transition sequence succeeds; invalid transition (e.g., `placed → delivered`) is rejected with a clear error; `cancelled` is reachable only from early states as designed; `delivery` vs. `pickup` paths diverge correctly after `packed`.

## CLEANUP
- N/A — pending implementation.

## DEPENDENCIES
`OrdersModule → OrdersService → state-machine component → orders.status`
`OrdersService → EventEmitter → notification listeners (SMS, admin dashboard)`

## HISTORY

| Date | What changed | Why | Initiated by | Related decision/issue |
|---|---|---|---|---|
| 2026-09 | State machine specified in PRD Section 2.5.5 | "Best practices, design patterns, system design" requested | Digvijay | PRD v1.2 update |

## OPEN_ITEMS
- Not yet implemented — part of the OrdersModule build step.
- Exact SMS copy for each transition's notification not yet drafted (business/content task, not a technical one).
