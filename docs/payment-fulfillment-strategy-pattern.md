# Context Entry: Payment & Fulfillment Strategy Pattern

## IDENTITY
- **Feature/change name:** Payment & Fulfillment Strategy Interfaces
- **Unique identifier:** CTX-004
- **Status:** complete (COD & Fulfillment strategies implemented and verified in OrdersModule CTX-010; live gateways deferred)
- **Owner:** Digvijay
- **Created:** 2026-09 / **Last updated:** 2026-10-02

## INTENT
- **Problem being solved:** Payment gateway integration (Razorpay/PayU) was explicitly deferred to avoid blocking the rest of the build on external KYC approval timelines, but checkout still needs to function (via COD) without the codebase requiring a rewrite once a gateway is added later.
- **Objective:** Checkout works end-to-end on COD now; adding a live gateway later touches one new class, not scattered conditional logic across the checkout flow.
- **Expected behavior:** `PaymentProvider` interface (`initiate()`, `verify()`, `refund()`) implemented by a `CODProvider` now; `RazorpayProvider`/`PayUProvider` stubbed but not wired to live APIs.
- **Scope:** Payment provider abstraction and a parallel `FulfillmentStrategy` interface (delivery vs. pickup).
- **Explicitly out-of-scope:** Live Razorpay/PayU API calls, webhook handling for real transactions — deferred until merchant KYC is confirmed approved.

## ARCHITECTURE
- **Affected services/modules:** New `PaymentsModule` (or `payments/` subfolder within Orders) — see `/docs/PRD.md` Section 2.6 folder structure (`payments/providers/`, `payment-provider.interface.ts`).
- **Integration points (future):** Razorpay/PayU REST APIs, webhook endpoint for async payment confirmation (not yet built).

## DECISIONS

| Decision | Reason | Alternatives considered | Why preferred | Trade-offs |
|---|---|---|---|---|
| Strategy pattern for payment providers | Avoids `if/else` branching on payment method scattered through checkout logic | Direct conditional logic per payment method inline in `OrdersService` | Adding/switching a gateway later touches one new class implementing the existing interface, not the checkout flow itself | Slight upfront abstraction cost for a feature (live gateways) not yet built — accepted because the interface shape is cheap to define now and expensive to retrofit later |
| COD treated as a "provider" that always succeeds, implementing the same interface | Keeps checkout flow uniform regardless of payment method chosen | Special-case COD outside the payment abstraction | Uniform interface means checkout code doesn't need to know whether it's talking to COD or a real gateway | None meaningful |
| Live gateway code deferred until after KYC approval | KYC approval is outside developer control (days to ~2 weeks) and unrelated to code readiness; building and testing full gateway integration before KYC approval risks wasted rework if requirements change during approval | Build gateway integration in parallel with KYC submission | Avoids blocking launch on an external, uncontrollable timeline while still keeping the codebase ready to slot in the real provider later | Checkout launches COD-only initially — acceptable since many target customers may prefer COD/trust it more than online payment anyway |
| Same Strategy pattern applied to `FulfillmentStrategy` (delivery vs. pickup) | Delivery-specific logic (courier assignment, delivery fee) should stay isolated from pickup logic | Inline conditional logic based on `fulfillment_type` | Keeps each fulfillment path's logic independently testable and extensible (e.g., adding a new delivery partner later) | None meaningful |

## SECURITY
- Payment provider interface must never expose raw gateway credentials to the client — all provider logic lives server-side.
- Webhook idempotency (per `/docs/PRD.md` Section 2.5.6) is a hard requirement once live gateways are implemented — not yet built, flagged here so it isn't missed later.

## VALIDATION
- COD provider: tested as part of OrdersModule test suite once implemented.
- Live gateway providers: not yet implemented, so no validation criteria apply yet — to be added as a new context entry when that work begins.

## CLEANUP
- N/A — pending implementation.

## DEPENDENCIES
`OrdersModule → PaymentProvider interface → CODProvider (active) / RazorpayProvider, PayUProvider (stubbed, inactive)`
`OrdersModule → FulfillmentStrategy interface → DeliveryStrategy / PickupStrategy`

## HISTORY

| Date | What changed | Why | Initiated by | Related decision/issue |
|---|---|---|---|---|
| 2026-08 | Decision to defer live payment gateway code to last in build sequence | Avoid blocking on external KYC timeline | Planning discussion | Payment gateway KYC onboarding flagged as a parallel, early-start task |
| 2026-09 | Strategy pattern formalized in PRD Section 2.5.4 | "Best practices, design patterns, system design" requested | Digvijay | PRD v1.2 update |

## OPEN_ITEMS
- Razorpay/PayU merchant KYC status — must be confirmed approved before live gateway implementation begins.
- Webhook endpoint and idempotency handling — not yet designed in detail, only referenced; needs its own context entry when built.
- Delivery fee calculation logic for `DeliveryStrategy` — not yet specified, pending decision on initial delivery radius (PRD Section 4, Open Action Items).
