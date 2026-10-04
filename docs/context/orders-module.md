# Context Entry: Orders Module (Checkout, Concurrency-Safe Stock, State Machine & Strategy Patterns)

## IDENTITY
- **Feature/change name:** Order Placement, State Machine Enforcement, Inventory Concurrency, and Payment/Fulfillment Strategy Patterns
- **Unique identifier:** CTX-010
- **Status:** complete
- **Owner:** Digvijay
- **Created:** 2026-10-02 / **Last updated:** 2026-10-02

## INTENT
- **Problem being solved:** 
  1. Rural agri-input sales require strict inventory accuracy for regulated, limited-stock chemicals (pesticides, seeds, fertilizers). A naive read-then-write check results in race conditions and overselling.
  2. Order states cannot be arbitrary; invalid jumps (e.g. `placed -> delivered`) corrupt order history and disputes.
  3. External payment gateway approvals (Razorpay/PayU KYC) take days to weeks; the checkout must function flawlessly on COD right now without requiring structural rewrites when live gateways are activated.
  4. Network retries and double-clicks on slow 2G/3G/4G connections risk duplicate order placement.
- **Objective:** Provide a bulletproof checkout engine supporting atomic inventory decrements, idempotency keys, explicit status transitions, and decoupled event handling.
- **Expected behavior:**
  - `POST /api/v1/orders` checks idempotency key; executes atomic conditional stock decrement (`UPDATE products SET stock_qty = stock_qty - $1 WHERE id = $2 AND stock_qty >= $1 AND is_active = true`); generates GST invoice number (`BKM-INV-YYYY-XXXXXX`); initiates COD payment strategy; records line items; and emits `order.placed` event.
  - Insufficient stock rolls back the transaction and returns `409 Conflict`.
  - `GET /api/v1/orders` returns paginated order history for the authenticated customer.
  - `GET /api/v1/orders/:id` verifies customer ownership and returns line items with product details.
  - `PATCH /api/v1/orders/:id/cancel` verifies customer can cancel (`placed` or `confirmed` states only); rolls back stock atomically; executes refund strategy; and emits `order.status_changed` event.
- **Scope:** `OrdersController`, `OrdersService`, `OrdersRepository`, `OrderStateMachine`, `PaymentFactoryService`, `CODProvider`, `RazorpayProvider`, `PayUProvider`, `FulfillmentFactoryService`, `DeliveryStrategy`, `PickupStrategy`, `OrderEventsListener`.
- **Explicitly out-of-scope:** Real-time webhook verification for live Razorpay/PayU transactions (deferred pending merchant KYC approval), Marg ERP automatic inventory synchronization (out of scope for Phase 1).

## ARCHITECTURE
- **Affected services/modules:**
  - `src/modules/orders/`: Controller, Service, Repository, DTOs, Enums, Entities
  - `src/modules/orders/state-machine/`: `OrderStateMachine`
  - `src/modules/orders/payments/`: Strategy pattern (`PaymentProvider`, `CODProvider`, `RazorpayProvider`, `PayUProvider`, `PaymentFactoryService`)
  - `src/modules/orders/fulfillment/`: Strategy pattern (`FulfillmentStrategy`, `DeliveryStrategy`, `PickupStrategy`, `FulfillmentFactoryService`)
  - `src/modules/orders/events/`: `OrderPlacedEvent`, `OrderStatusChangedEvent`, `OrderEventsListener`
  - `src/database/`: PostgreSQL connection pooler and transactional queries
- **Data flow:**
  1. `POST /api/v1/orders` $\rightarrow$ `JwtAuthGuard` validates customer $\rightarrow$ `OrdersService.createOrder` $\rightarrow$ checks idempotency $\rightarrow$ verifies customer address/pincode via `FulfillmentStrategy` $\rightarrow$ acquires DB client $\rightarrow$ `BEGIN` transaction $\rightarrow$ atomic stock decrement on each item $\rightarrow$ inserts `orders` & `order_items` $\rightarrow$ `COMMIT` $\rightarrow$ initiates `CODProvider` $\rightarrow$ emits `order.placed` event $\rightarrow$ returns `OrderResponseDto`.
  2. Cancellation $\rightarrow$ `PATCH /api/v1/orders/:id/cancel` $\rightarrow$ `OrderStateMachine.canCustomerCancel` $\rightarrow$ `OrdersRepository.cancelOrderAndRestoreStock` $\rightarrow$ `UPDATE orders SET status = 'cancelled'` $\rightarrow$ `UPDATE products SET stock_qty = stock_qty + quantity` $\rightarrow$ `paymentProvider.refund()` $\rightarrow$ emits `order.status_changed`.

## DECISIONS

| Decision | Reason | Alternatives considered | Why preferred | Trade-offs |
|---|---|---|---|---|
| Atomic conditional SQL decrement (`stock_qty >= :qty`) within Postgres transaction | Completely eliminates race conditions and overselling under concurrent checkout | Naive read-then-write in app layer, or Redis distributed locks | Simplest, most reliable pattern in Postgres; guaranteed by ACID engine | Requires all item decrements to succeed before transaction commits |
| Idempotency key handling via database check and unique constraint | Farmers on spotty rural cellular connections frequently double-tap checkout | Ignore retries or rely on frontend button disabling | Prevents accidental duplicate charges and multi-order creation | Client must supply or header must provide `x-idempotency-key` |
| Finite State Machine in application service layer | Guarantees delivery and pickup orders only progress through valid operational steps | Unrestricted enum updates | Keeps fulfillment workflow audit trail trustworthy and prevents invalid jumps | Requires status checks prior to every status transition |
| Strategy pattern for Payment Providers (`CODProvider`, `RazorpayProvider`, `PayUProvider`) | Launching immediately with COD while keeping code structure 100% ready for online gateways post-KYC | Hardcoding `if (method === 'cod')` branching across services | Isolates payment-specific SDKs and logic into dedicated provider classes | Adds factory abstraction layer |
| Strategy pattern for Fulfillment (`DeliveryStrategy` vs `PickupStrategy`) | Delivery requires address validation, postal code formatting, and fee logic; in-store pickup does not | Monolithic checkout validator | Independent testing and easy addition of custom courier integrations later | Distinct validation rules per strategy |
| Decoupled side effects via `@nestjs/event-emitter` | Order creation shouldn't block or fail if an external notification listener errors | Synchronous inline SMS calls in `createOrder` | Decouples critical path from telemetry and communication services | Async events require proper error handling in listeners |

## IMPLEMENTATION
- **Files created:**
  - `backend/src/modules/orders/enums/order.enums.ts`
  - `backend/src/modules/orders/entities/order.entity.ts`
  - `backend/src/modules/orders/entities/order-item.entity.ts`
  - `backend/src/modules/orders/state-machine/order-state-machine.ts`
  - `backend/src/modules/orders/payments/payment-provider.interface.ts`
  - `backend/src/modules/orders/payments/cod.provider.ts`
  - `backend/src/modules/orders/payments/razorpay.provider.ts`
  - `backend/src/modules/orders/payments/payu.provider.ts`
  - `backend/src/modules/orders/payments/payment-factory.service.ts`
  - `backend/src/modules/orders/fulfillment/fulfillment-strategy.interface.ts`
  - `backend/src/modules/orders/fulfillment/delivery.strategy.ts`
  - `backend/src/modules/orders/fulfillment/pickup.strategy.ts`
  - `backend/src/modules/orders/fulfillment/fulfillment-factory.service.ts`
  - `backend/src/modules/orders/events/order-events.ts`
  - `backend/src/modules/orders/events/order-events.listener.ts`
  - `backend/src/modules/orders/dto/create-order.dto.ts`
  - `backend/src/modules/orders/dto/order-response.dto.ts`
  - `backend/src/modules/orders/dto/list-orders-query.dto.ts`
  - `backend/src/modules/orders/dto/cancel-order.dto.ts`
  - `backend/src/modules/orders/orders.repository.ts`
  - `backend/src/modules/orders/orders.service.ts`
  - `backend/src/modules/orders/orders.controller.ts`
  - `backend/src/modules/orders/orders.module.ts`
  - Unit test suites (`order-state-machine.spec.ts`, `payment-factory.service.spec.ts`, `fulfillment-factory.service.spec.ts`, `orders.service.spec.ts`, `orders.controller.spec.ts`)
  - Integration E2E test suite (`test/orders.e2e-spec.ts`)

## VERIFICATION
- **Commands executed:**
  - `npm test`: 17 test suites, 75 unit tests passed.
  - `npm run test:e2e`: 4 test suites, 21 E2E tests passed.
  - `npm run build`: NestJS build succeeded cleanly.
- **Frontend Audit (October 2026):**
  - Confirmed checkout strictly enforces Cash on Delivery (COD) and Dukaan Pickup / Village Delivery strategies; no live Razorpay/PayU UI exposed (`CTX-004` compliant).
  - Confirmed order lifecycle state machine in UI only permits valid graph transitions per `order-state-machine.md` (`placed` → `confirmed` → `packed` → `ready_for_pickup`/`out_for_delivery` → `picked_up`/`delivered`); direct invalid jumps (e.g. `placed` → `delivered`) are prohibited and not offered by UI.
  - Cart and Order Tracking views upgraded with structured skeleton loaders (`animate-pulse`).
