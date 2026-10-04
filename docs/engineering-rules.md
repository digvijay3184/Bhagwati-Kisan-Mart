# Engineering Implementation & Cleanup Rules
## Bhagwati Kisan Mart — Project Rules for Antigravity Agent

**Purpose:** These rules govern how features are implemented for this project. Follow them for every feature, enhancement, refactor, or behavioral change — do not skip steps because a task looks small.

**Project scope reminder:** Build only what's in the PRD's Phase 1 in-scope list (storefront, cart, checkout, phone/OTP auth, admin dashboard, GST invoicing). Do **not** implement video/content upload, social feed features, Marg ERP sync, or any other item listed under "Future Scope" / "Out of Scope" in the project PRD — even if referenced in the design files — unless explicitly instructed otherwise in a specific task.

---

## Feature Lifecycle

Every feature follows this lifecycle. Do not consider a feature complete immediately after the implementation step — cleanup and verification are mandatory, not optional polish.

**Understand → Assess → Design → Secure → Implement → Test → Review → Cleanup → Re-test → Verify**

---

## 1. Pre-Implementation Assessment

Before writing or modifying any code:
- Understand the existing architecture and implementation flow.
- Identify all affected modules, services, functions, APIs, database interactions, and dependencies.
- Check whether similar functionality already exists before creating anything new.
- Reuse existing functionality where appropriate instead of introducing duplicate logic.
- Identify potential security, performance, data-consistency, and backward-compatibility risks.
- Clearly define the expected behavior and acceptance criteria before implementation.

**Rule:** Do not introduce a new function, class, utility, API, configuration, or dependency unless there is a clear and justified current need for it. No "future use" scaffolding.

## 2. Security First

Every implementation follows a security-first approach. Before considering a feature complete, verify:
- Authentication and authorization requirements
- Input validation and sanitization
- Sensitive data handling (customer phone numbers, addresses, payment references — this is a regulated agri-inputs business, treat customer data carefully)
- Secrets and credentials exposure
- Logging of sensitive information (never log full payment details, OTPs, or raw PII)
- API access and permission boundaries (customer vs. admin roles)
- Injection and manipulation risks
- Error handling and information leakage (never leak stack traces or raw DB errors to the client)
- Dependency and third-party library risks
- Any impact on existing security controls

**Rule:** A feature is not complete simply because it works. It must work without weakening the existing security posture.

## 3. Minimal & Purposeful Changes

- Keep the implementation as small and focused as possible.
- Do not create abstractions prematurely.
- Do not add functions "for future use" without a current requirement.
- Do not duplicate existing logic.
- Do not introduce unnecessary configuration.
- Do not add dependencies unless required.
- Avoid modifying unrelated components.
- Prefer simple, readable solutions over unnecessarily complex designs.

Every newly introduced function or component should have a clearly identifiable consumer.

## 4. Post-Implementation Cleanup

After implementing the feature, perform a dedicated cleanup and review phase. Explicitly check for:
- Unused functions, classes, variables
- Dead code
- Duplicate implementations
- Obsolete helper methods
- Unused imports
- Temporary debugging code
- Redundant configuration
- Unused dependencies
- Deprecated logic that is no longer reachable
- Feature flags or temporary workarounds that are no longer required
- Comments/documentation that no longer reflect the implementation

**Important:** Do not assume newly added code is automatically necessary. After implementation, reassess the entire affected flow and remove anything no longer required.

## 5. Usage & Reference Verification

Before removing or modifying any existing function, perform a proper usage analysis. Check:
- Direct references
- Indirect references
- API consumers
- Background jobs / event listeners
- Configuration-based invocation
- Dynamic imports or function resolution
- Tests
- External integrations (payment gateway webhooks, and Marg ERP once that integration exists)

A function should only be removed when confident it is no longer required. Every newly created function should be verified to ensure it is actually used.

## 6. Regression & Validation

After implementation and cleanup:
- Run relevant unit tests
- Run integration tests where applicable
- Validate the affected API/request-response flows
- Test existing behavior that could be impacted
- Verify edge cases and failure scenarios — including concurrent stock updates (two customers checking out the same low-stock product simultaneously must not oversell)
- Verify security-sensitive paths
- Check logs and error handling
- Confirm cleanup has not introduced regressions

The final implementation should contain only the code and configuration required for the feature and its supported behavior.

## 7. Standardized Checkpoints (Keywords)

Use these to trigger specific checks during development, so behavior is consistent and unambiguous:

| Keyword | Action |
|---|---|
| `SECURITY_CHECK` | Perform a security assessment of the implementation |
| `IMPACT_CHECK` | Identify affected modules, services, APIs, and dependencies |
| `USAGE_CHECK` | Identify where functions/classes/components are currently used |
| `DEAD_CODE_CHECK` | Identify unused or unreachable code |
| `DUPLICATE_CHECK` | Identify duplicate or overlapping implementations |
| `CLEANUP_CHECK` | Review the implementation for unnecessary code/configuration |
| `REGRESSION_CHECK` | Validate that existing behavior has not been broken |
| `FEATURE_REVIEW` | Perform a complete post-implementation review |
| `FINAL_CHECK` | Run the complete engineering checklist before considering the feature complete |

**Simplified core set:** `PLAN → SECURE → BUILD → VERIFY → AUDIT → CLEAN → FINALIZE`

**Master keyword:** `GUARD` = Plan → Security → Implementation → Verification → Audit → Cleanup → Final validation.

Use `GUARD this feature before marking it complete` as the standard instruction before accepting any feature as done.

---

## Core Principle

Do not just make the feature work. Make sure it is secure, necessary, correctly integrated, tested, and clean after implementation.

Every implementation should leave the codebase in a state equal to or better than the state in which it was found.

Before marking any feature complete, be able to answer:

- **PLAN** — analyzed requirements, architecture, impact, and risks before implementation
- **SECURE** — performed security checks before/during implementation
- **BUILD** — implemented the feature
- **VERIFY** — validated functionality, edge cases, and regressions
- **AUDIT** — inspected the implementation and its integration
- **CLEAN** — removed unused functions, dead code, duplicate logic, imports, configs
- **TRACE** — identified where functions, classes, APIs, and dependencies are actually used
- **PRUNE** — safely identified and removed obsolete/unused code
- **FINALIZE** — performed the complete final review before considering the feature done
