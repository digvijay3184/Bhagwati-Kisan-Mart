# Context Entry: Users Module (Profile Management & Demographic Context)

## IDENTITY
- **Feature/change name:** Customer Profile Retrieval and Management
- **Unique identifier:** CTX-009
- **Status:** complete
- **Owner:** Digvijay
- **Created:** 2026-10-02 / **Last updated:** 2026-10-02

## INTENT
- **Problem being solved:** In rural Indian e-commerce (agri-inputs), accurate delivery requires detailed local geographical metadata: village name/address, 6-digit Indian PIN code, district, and regional agricultural zone. Farmers register initially with only their mobile number; they must subsequently provide or update their delivery details.
- **Objective:** Provide secure, authenticated endpoints for customers to view and update their profile and shipping address, validating inputs according to Indian postal formats and sanitizing updates.
- **Expected behavior:**
  - `GET /api/v1/users/profile` returns the authenticated customer's profile, including `isProfileComplete` status flag (true when name, address, pincode, and district are populated).
  - `PATCH /api/v1/users/profile` allows partial updates to `name`, `address`, `pincode`, `district`, and `region`.
  - Pincode is strictly validated against Indian 6-digit postal code format (`^[1-9][0-9]{5}$`).
  - All endpoints are guarded by `JwtAuthGuard` and operate strictly on `@CurrentUser('userId')` to prevent horizontal privilege escalation.
- **Scope:** `UsersController`, `UsersService`, `UsersRepository`, `UpdateProfileDto`, `UserProfileResponseDto`, `UserEntity`.
- **Explicitly out-of-scope:** Staff/admin management of customer accounts (reserved for AdminModule), profile picture uploads (reserved for Media/R2 integration).

## ARCHITECTURE
- **Affected services/modules:**
  - `src/modules/users/`: `UsersController`, `UsersService`, `UsersRepository`, `UserEntity`, DTOs
  - `src/modules/auth/`: Consumes `UsersModule` for finding and creating user entities during OTP flow
  - `src/database/`: `DatabaseService` (Postgres queries against `users` table)
- **Data flow:**
  1. `GET /api/v1/users/profile` $\rightarrow$ `JwtAuthGuard` validates Bearer token and extracts `userId` $\rightarrow$ `UsersService.getProfile(userId)` $\rightarrow$ `UsersRepository.findById(userId)` $\rightarrow$ maps to `UserProfileResponseDto` with computed `isProfileComplete` flag.
  2. `PATCH /api/v1/users/profile` $\rightarrow$ `ValidationPipe` validates payload $\rightarrow$ `UsersService.updateProfile(userId, dto)` $\rightarrow$ `UsersRepository.update(userId, dto)` dynamically updates Postgres columns $\rightarrow$ returns refreshed `UserProfileResponseDto`.

## DECISIONS

| Decision | Reason | Alternatives considered | Why preferred | Trade-offs |
|---|---|---|---|---|
| User identity derived strictly from `@CurrentUser('userId')` in JWT | Prevents Insecure Direct Object Reference (IDOR) attacks where a customer alters another user's profile | Accepting `:userId` in route parameters | Impossible for a user to spoof another customer's ID | Admins cannot use this exact endpoint to edit other users (admin endpoints will be in `AdminModule`) |
| Dynamic SQL query builder in repository for `PATCH` | Only modified fields are written to the database | Overwriting entire record | Avoids clearing existing fields when receiving partial updates | Requires dynamic parameter indexing (`$1, $2, ...`) |
| Strict 6-digit Indian PIN code regex (`^[1-9][0-9]{5}$`) | Indian postal codes cannot start with 0 and must be exactly 6 digits | Freeform string | Prevents invalid addresses from entering downstream logistics and courier booking | Does not verify whether pincode exists in India Post database at this stage |
| Calculated `isProfileComplete` helper | Checkout flow needs an immediate boolean to determine if customer must enter shipping address | Frontend calculates completeness | Centralized business logic ensures checkout guards in OrdersModule are consistent | Computes boolean on every profile retrieval |

## IMPLEMENTATION
- **Files created:**
  - `backend/src/modules/users/entities/user.entity.ts`
  - `backend/src/modules/users/users.repository.ts`
  - `backend/src/modules/users/users.service.ts`
  - `backend/src/modules/users/users.controller.ts`
  - `backend/src/modules/users/users.module.ts`
  - `backend/src/modules/users/dto/update-profile.dto.ts`
  - `backend/src/modules/users/dto/user-profile-response.dto.ts`
  - `backend/src/modules/users/users.service.spec.ts`
  - `backend/src/modules/users/users.controller.spec.ts`
  - `backend/test/users.e2e-spec.ts`
- **Files modified:**
  - `backend/src/modules/auth/auth.module.ts` (imports `UsersModule`)
  - `backend/src/app.module.ts` (imports `UsersModule`)

## VERIFICATION
- **Commands executed:**
  - `npm test`: 12 test suites, 41 unit tests passed.
  - `npm run test:e2e`: 3 test suites, 14 E2E tests passed.
  - `npm run build`: NestJS build succeeded cleanly.
