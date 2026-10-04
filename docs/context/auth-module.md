# Context Entry: Auth Module (Phone/OTP, Rate Limiting & JWT Session)

## IDENTITY
- **Feature/change name:** Phone/OTP Authentication, Redis Rate Limiting & JWT Sessions
- **Unique identifier:** CTX-008
- **Status:** complete
- **Owner:** Digvijay
- **Created:** 2026-10-02 / **Last updated:** 2026-10-02

## INTENT
- **Problem being solved:** Rural farmers in Uttar Pradesh face high cognitive and operational friction with password-based authentication. Phone/OTP is the universal standard for rural and regional e-commerce in India.
- **Objective:** Provide a secure, friction-free login and registration flow via Indian mobile numbers, protected against brute-force attacks and SMS gateway flooding via Upstash Redis rate-limiting and timing-safe verification.
- **Expected behavior:**
  - Customer submits 10-digit Indian mobile number to `POST /api/v1/auth/otp/send`.
  - Rate limiting enforced: max 1 send per 60s (cooldown) and max 5 sends per hour per phone number.
  - 6-digit cryptographically random OTP generated and stored in Redis with 5-minute TTL as an HMAC-SHA256 hash.
  - SMS dispatched via MSG91 v5 OTP API (with safe development/test fallback).
  - Customer submits OTP to `POST /api/v1/auth/otp/verify`.
  - Attempts throttled (max 5 failed attempts before OTP invalidation).
  - Timing-safe HMAC comparison verifies OTP.
  - Customer account automatically created in `users` table on first login (`users.phone_number` unique).
  - JWT access token (15m expiry) and rotating refresh token (7d expiry, hashed in Redis) returned.
  - Protected endpoints guard customer context via `JwtAuthGuard` and `@CurrentUser()`.
- **Scope:** Phone/OTP delivery, verification, token issuance, refresh token rotation, logout, `JwtStrategy`, `JwtAuthGuard`, `UsersRepository`, `RedisService`, and `SmsService`.
- **Explicitly out-of-scope:** Social logins (Google/Facebook), password auth, email auth, customer profile modification (handled in UsersModule).

## ARCHITECTURE
- **Affected services/modules:**
  - `src/modules/auth/`: `AuthController`, `AuthService`, `JwtStrategy`, `JwtAuthGuard`, `SmsService`
  - `src/modules/users/`: `UsersRepository`, `UserEntity`
  - `src/database/`: `RedisService` (Upstash Redis integration), `DatabaseService` (Postgres users table)
- **Data flow:**
  1. `POST /api/v1/auth/otp/send` $\rightarrow$ `SendOtpDto` normalizes phone $\rightarrow$ `AuthService` checks Redis `otp_cooldown` and `otp_hour_count` $\rightarrow$ generates OTP $\rightarrow$ saves HMAC in Redis $\rightarrow$ `SmsService` calls MSG91 API $\rightarrow$ returns `{ success: true, data: { message, cooldownSeconds } }`.
  2. `POST /api/v1/auth/otp/verify` $\rightarrow$ `VerifyOtpDto` $\rightarrow$ `AuthService` checks Redis `otp_attempts` and compares HMAC $\rightarrow$ deletes OTP keys $\rightarrow$ `UsersRepository.findByPhoneNumber` or `create` $\rightarrow$ generates access & refresh tokens $\rightarrow$ stores refresh token hash in Redis $\rightarrow$ returns tokens and user summary.
  3. Subsequent requests $\rightarrow$ `Authorization: Bearer <accessToken>` $\rightarrow$ `JwtStrategy` validates signature and attaches `{ userId, phoneNumber, role }` to `req.user`.

## DECISIONS

| Decision | Reason | Alternatives considered | Why preferred | Trade-offs |
|---|---|---|---|---|
| Phone/OTP as sole authentication method | Password friction is unacceptable for rural farmer demographic (PRD 1.4, 1.5) | Password + Email login | Matches target audience behavior (WhatsApp familiarity) | Requires SMS gateway operational costs (~₹0.15/SMS) |
| Store OTP as HMAC-SHA256 hash in Redis, not plaintext | Prevents exposure of active OTPs if Redis data or telemetry is inspected | Plaintext OTP string in Redis | Defense-in-depth security | Slight hashing CPU overhead (negligible) |
| Multi-layer rate limiting (60s cooldown + 5/hour cap) in Redis | Protects business from financial drain (SMS flooding) and prevents phone harassment | Simple per-minute limiter | Stops both rapid burst spam and prolonged automated enumeration | Legitimate users who mistype frequently must wait after 5 attempts |
| Max 5 verification attempts per OTP | Neutralizes brute-force 6-digit guessing attacks ($10^6$ combinations) | Unlimited attempts until expiry | With 5 attempts max, probability of guessing a 6-digit code is $5 / 10^6 = 0.0005\%$ | Users who forget their code must wait for a new OTP |
| Refresh token rotation with Redis revocation tracking | Limits blast radius of stolen access tokens while allowing seamless session renewal | Stateless long-lived JWTs | Compromised refresh tokens are immediately revoked upon rotation or reuse | Requires Redis lookup on token refresh |

## IMPLEMENTATION
- **Files created:**
  - `backend/src/database/redis.service.ts`
  - `backend/src/modules/users/entities/user.entity.ts`
  - `backend/src/modules/users/users.repository.ts`
  - `backend/src/modules/auth/dto/send-otp.dto.ts`
  - `backend/src/modules/auth/dto/verify-otp.dto.ts`
  - `backend/src/modules/auth/dto/refresh-token.dto.ts`
  - `backend/src/modules/auth/dto/auth-response.dto.ts`
  - `backend/src/modules/auth/services/sms.service.ts`
  - `backend/src/modules/auth/jwt.strategy.ts`
  - `backend/src/modules/auth/decorators/public.decorator.ts`
  - `backend/src/modules/auth/decorators/current-user.decorator.ts`
  - `backend/src/modules/auth/guards/jwt-auth.guard.ts`
  - `backend/src/modules/auth/auth.service.ts`
  - `backend/src/modules/auth/auth.controller.ts`
  - `backend/src/modules/auth/auth.module.ts`

## SECURITY
- **Sensitive Data Handling:** Full OTPs and auth tokens are strictly excluded from logs and exception filter responses.
- **Timing-Attack Resistance:** OTP hashes are compared using `crypto.timingSafeEqual` after buffer length verification.
- **Input Sanitization:** Indian phone numbers validated by regex `/^(?:\+91|91)?[6-9]\d{9}$/` and transformed to E.164.
- **Short-Lived Access Tokens:** 15-minute access token lifespan minimizes window of vulnerability.

## VALIDATION
- **Unit Tests (`src/modules/auth/auth.service.spec.ts`, `jwt.strategy.spec.ts`, `auth.controller.spec.ts`):**
  - Rate limiting cooldown enforcement (429 Too Many Requests).
  - Hourly cap enforcement (429 Too Many Requests).
  - Verification attempt throttling (400 Bad Request after 5 failed attempts).
  - Invalid OTP rejection (401 Unauthorized).
  - Valid OTP verification, user creation, and JWT issuance.
  - Refresh token revocation and logout.
  - Strategy payload validation.
- **Integration / E2E Tests (`test/auth.e2e-spec.ts`):**
  - `POST /api/v1/auth/otp/send` format rejection (400).
  - `POST /api/v1/auth/otp/send` success and cooldown enforcement (429).
  - `POST /api/v1/auth/otp/verify` valid vs invalid handling.
  - `GET /api/v1/auth/me` Bearer token authentication & unauthorized rejection without token (401).
- **All tests passing:** 34 unit tests, 9 E2E tests, clean TypeScript compilation.
- **Frontend Audit (October 2026):**
  - Confirmed phone/OTP modal dialogs (Step 1 phone input and Step 2 6-digit OTP verification) function seamlessly with backend SMS gateway and dev fallback.
  - Access token and user session synchronized with React state and localStorage.

## CLEANUP
- Verified zero dead code, zero unused dependencies, clean separation between auth and user storage.

## DEPENDENCIES
`AuthController → AuthService → [RedisService, SmsService, UsersRepository, JwtService]`
`Protected Routes → JwtAuthGuard → JwtStrategy`

## HISTORY

| Date | What changed | Why | Initiated by | Related decision/issue |
|---|---|---|---|---|
| 2026-10-02 | AuthModule implemented with phone/OTP, MSG91, Redis rate limiting, JWT | Step 4 of backend build sequence | Digvijay / Antigravity | PRD Section 1.5, 2.1, 2.4 |

## OPEN_ITEMS
- Next build sequence step: `UsersModule` (profile CRUD for customer address, pincode, district) — Completed.
- **Refresh Token Storage Enhancement**: Currently, the NestJS backend issues `{ accessToken, refreshToken }` in JSON body, and the frontend client stores both in `localStorage`. Architecture recommendation for future hardening: configure backend `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict` or a Next.js BFF proxy to isolate refresh tokens from client JavaScript.
