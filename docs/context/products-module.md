# Context Entry: Products Module & Backend Core Scaffold

## IDENTITY
- **Feature/change name:** Backend Scaffold, Database Migrations & ProductsModule
- **Unique identifier:** CTX-007
- **Status:** complete
- **Owner:** Digvijay
- **Created:** 2026-10-02 / **Last updated:** 2026-10-02

## INTENT
- **Problem being solved:** Establish the foundational backend architecture, environment validation, database migration pipeline, and customer-facing product catalog API for Bhagwati Kisan Mart.
- **Objective:** Provide a secure, production-grade NestJS backend structured in `/backend` to support shared frontend/backend workspace, ensuring API versioning (`/api/v1`), consistent response envelopes, fail-fast configuration, and concurrency-safe database patterns.
- **Expected behavior:**
  - App fails fast at boot if required environment variables (`DATABASE_URL`, `JWT_SECRET`, etc.) are missing.
  - Endpoints follow `/api/v1` prefix and wrap all responses in `{ success: true, data: T, error: null }` or `{ success: false, data: null, error: { message, code, details? } }`.
  - Sensitive data (credentials, DB stack traces) is never leaked in HTTP responses or structured logs.
  - Customers can browse and search active products with pagination (`page`, `limit`), filtering by category (insecticide, fungicide, herbicide, bactericide, nematicide, pgr, seed, fertilizer) and brand.
  - Inactive products are hidden from public catalog endpoints (404 on direct ID access).
  - Database schema enforces `CHECK (stock_qty >= 0)` and includes atomic stock decrement capability for upcoming order placement.
- **Scope:** Project scaffold, configuration module, logging and request ID middlewares, exception filters, response interceptors, initial PostgreSQL database migrations, and ProductsModule (Controller, Service, Repository, DTOs, Entities).
- **Explicitly out-of-scope:** Product creation/update/deletion endpoints for customers (reserved for AdminModule), live payment gateways, Marg ERP sync, video/content features.

## ARCHITECTURE
- **Affected services/modules:**
  - `src/config/`: `AppConfigModule`, `environmentValidationSchema` (Joi validation)
  - `src/common/`: `TransformInterceptor`, `LoggingInterceptor`, `HttpExceptionFilter`, `RequestIdMiddleware`, pagination DTOs
  - `src/database/`: `DatabaseService` (Postgres pool with `pg`), migrations runner, `001_initial_schema.sql`
  - `src/modules/products/`: `ProductsController`, `ProductsService`, `ProductsRepository`, `ProductEntity`, `ProductQueryDto`, `ProductResponseDto`
- **Data flow:**
  1. Client sends request with optional `x-request-id` header to `GET /api/v1/products?category=...&page=1&limit=20`.
  2. `RequestIdMiddleware` injects/propagates `x-request-id`.
  3. `ValidationPipe` parses and validates query parameters against `ProductQueryDto`.
  4. `ProductsController` delegates to `ProductsService`.
  5. `ProductsService` delegates query execution to `ProductsRepository`.
  6. `ProductsRepository` executes parameterized SQL against PostgreSQL (`is_active = true`), fetching paginated items and count.
  7. Results map to `ProductResponseDto` (camelCase API presentation).
  8. `TransformInterceptor` envelopes payload into `{ success: true, data: { items, meta }, error: null }`.
  9. `LoggingInterceptor` emits structured latency log with `x-request-id`.

## DECISIONS

| Decision | Reason | Alternatives considered | Why preferred | Trade-offs |
|---|---|---|---|---|
| Place backend in dedicated `/backend` directory | Repository is a monorepo workspace shared by both backend and future frontend | Keep backend directly in root | Clean separation of concerns between Next.js frontend and NestJS backend | Commands must run within `backend/` or via root scripts |
| Use `pg` driver with explicit Repository pattern | Maximum transparency and control over SQL, transactions, and atomic updates (`UPDATE products SET stock_qty = stock_qty - :qty WHERE id = :id AND stock_qty >= :qty`) | Heavy ORMs (TypeORM/Prisma) | Direct control over concurrency-safe inventory operations without ORM abstraction overhead or migration drift | Manual SQL query construction in repository |
| Envelope every response in `{ success, data, error }` | Client frontend and mobile app parse responses uniformly | Raw payload responses | Predictable error and data contracts across all endpoints | Requires client to unwrap `data` field |
| Redact raw errors in `HttpExceptionFilter` | Prevent leakage of database structure, internal IP/ports, or stack traces | Default NestJS exception handler | Essential security practice for production systems | Debugging relies on server-side structured logs via `x-request-id` |
| Fail-fast environment validation via Joi | Catches missing secrets or malformed DB URLs at boot before serving traffic | Soft defaults or reading `process.env` ad-hoc | Prevents unpredictable runtime crashes mid-request | Application will not boot without valid `.env` |

## IMPLEMENTATION
- **Files created:**
  - `backend/src/config/env.validation.ts`
  - `backend/src/config/configuration.ts`
  - `backend/src/config/config.module.ts`
  - `backend/src/common/dto/api-response.dto.ts`
  - `backend/src/common/dto/pagination.dto.ts`
  - `backend/src/common/interceptors/transform.interceptor.ts`
  - `backend/src/common/interceptors/logging.interceptor.ts`
  - `backend/src/common/filters/http-exception.filter.ts`
  - `backend/src/common/middleware/request-id.middleware.ts`
  - `backend/src/database/database.service.ts`
  - `backend/src/database/database.module.ts`
  - `backend/src/database/migrations/001_initial_schema.sql`
  - `backend/src/modules/products/dto/product-category.enum.ts`
  - `backend/src/modules/products/dto/product-query.dto.ts`
  - `backend/src/modules/products/dto/product-response.dto.ts`
  - `backend/src/modules/products/entities/product.entity.ts`
  - `backend/src/modules/products/products.repository.ts`
  - `backend/src/modules/products/products.service.ts`
  - `backend/src/modules/products/products.controller.ts`
  - `backend/src/modules/products/products.module.ts`
  - `backend/src/app.module.ts`
  - `backend/src/main.ts`

## SECURITY
- **Validation:** All inputs passed through `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`.
- **SQL Injection Prevention:** 100% parameterized SQL queries in `ProductsRepository` using `$1, $2, ...` placeholders.
- **Data Protection:** Soft-delete enforcement (`is_active = true`) ensures inactive products are inaccessible through public endpoints.
- **Traceability:** Request ID correlation (`x-request-id`) across middleware, filters, and logs without logging PII.
- **Information Leakage:** All internal/database errors caught and replaced with generic 500 error messages while logging actual details server-side.

## VALIDATION
- **Unit Tests:**
  - `src/config/env.validation.spec.ts` (pass: valid config, fail: missing DB URL, short JWT secret, invalid env)
  - `src/common/interceptors/transform.interceptor.spec.ts` (pass: wrapping, null handling, non-double wrapping)
  - `src/common/filters/http-exception.filter.spec.ts` (pass: 404 formatting, validation error details, raw error redaction)
  - `src/common/middleware/request-id.middleware.spec.ts` (pass: ID generation, ID reuse)
  - `src/modules/products/products.service.spec.ts` (pass: pagination calculation, single product retrieval, 404 handling)
  - `src/modules/products/products.repository.spec.ts` (pass: filter parameterization, atomic stock decrement success & failure)
  - `src/modules/products/products.controller.spec.ts` (pass: service delegation)
- **Integration / E2E Tests:**
  - `test/products.e2e-spec.ts` (pass: `GET /api/v1/products`, `GET /api/v1/products/:id`, 404 handling, 400 validation error on invalid category)
- **Build Status:** Clean TypeScript compilation with `nest build` (zero errors).
- **Frontend Audit (October 2026):**
  - Confirmed product catalog and detail screens render authentic UP agronomic attributes, lab testing seals, and live pricing.
  - Replaced raw `<img>` tags with Next.js `<Image>` utilizing automatic optimization and lazy loading.
  - Upgraded product detail screen from spinner to structured 2-column skeleton loader (`animate-pulse`).

## CLEANUP
- Verified zero dead code, zero unused imports, zero console.log debugging statements in production code.
- Tested path mappings in `tsconfig.json` and `jest.config`.

## DEPENDENCIES
`ProductsController → ProductsService → ProductsRepository → DatabaseService → PostgreSQL (Supabase)`
`AppModule → AppConfigModule, DatabaseModule, ProductsModule`

## HISTORY

| Date | What changed | Why | Initiated by | Related decision/issue |
|---|---|---|---|---|
| 2026-10-02 | Initial scaffold, database schema v1, ProductsModule | First module in backend build sequence | Antigravity / Digvijay | PRD Section 2.3, 2.4, 2.5, 2.6 |

## OPEN_ITEMS
- Next build sequence step: `AuthModule` (Phone/OTP flow via MSG91, Redis rate limiting, JWT issuance).
