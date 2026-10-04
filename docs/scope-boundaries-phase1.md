# Context Entry: Phase 1 Scope Boundaries

## IDENTITY
- **Feature/change name:** Phase 1 Scope Boundaries (What NOT to Build)
- **Unique identifier:** CTX-006
- **Status:** complete (ongoing reference — recheck before starting any new feature)
- **Owner:** Digvijay
- **Created:** 2026-08 / **Last updated:** 2026-09

## INTENT
- **Problem being solved:** Several adjacent, genuinely good ideas (video/content, social features, diagnosis-first discovery, a full "Instagram for farmers" app, Marg ERP sync, native mobile app) were discussed during planning and are easy to accidentally reintroduce mid-build — especially since the Stitch UI design includes video-related screens that must not be implemented in Phase 1.
- **Objective:** Keep Phase 1 scoped to a working storefront + admin dashboard, with every deferred idea gated behind an explicit evidence trigger rather than a fixed date.
- **Expected behavior:** Any session (human or agent) encountering a design screen, feature idea, or code path related to the items below should skip it and flag it, not implement a "lightweight version just in case."

## INTENT — Explicitly Out of Scope for Phase 1

| Item | Why deferred | Trigger to revisit |
|---|---|---|
| Video/content upload, "farming tips" section | Significant scope expansion (hosting, moderation) unrelated to core storefront | Storefront live and stable; family wants to add value beyond product listings |
| Social features (feed, comments, follows, likes) | Full social platform is a different product/engineering problem than e-commerce | Only if region-tagged content section (once built) shows strong real engagement |
| "Instagram for farmers" standalone app | Separate product decision — competes directly with funded players (DeHaat, BharatAgri) unless hyperlocal trust angle is validated first | Content section proven; explicit decision to build a second, separate application |
| Diagnosis-first / photo-based crop problem checker | Adds a new interaction pattern before the core catalog/checkout is validated | Post-launch customer feedback indicates difficulty self-selecting products |
| Marg ERP integration / automated inventory sync | External dependency (API docs, license tier, Marg support timelines) outside developer control; manual inventory via admin dashboard is a working interim solution | Manual inventory updates become a real operational burden |
| Native mobile application | Avoid building web and mobile blind, in parallel, before web learnings are incorporated | Web storefront proven, validated demand, clear case for native-specific value (push notifications, offline browsing) |
| Multi-language (i18n) UI engine | Hindi-primary hardcoded content is sufficient for launch; a full i18n engine is unnecessary complexity at this stage | Expansion beyond the initial Hindi-primary user base requires true multi-language support |
| AWS/Kubernetes migration | Addressed in `tech-stack-selection.md` — not a feature, but a deferred infrastructure decision | Sustained free-tier limit breaches, custom background worker needs, or cost crossover at real scale |

## DECISIONS

| Decision | Reason | Alternatives considered | Why preferred | Trade-offs |
|---|---|---|---|---|
| Every deferred item gated by an evidence trigger, not a calendar date | Avoids building speculative features before real usage data justifies the investment | Fixed roadmap with target dates for each future feature | A date-based roadmap would pressure building features before they're validated, especially risky for a solo developer's limited time | Deferred items may take longer than hoped if triggers are conservative — accepted as the right trade-off for a real business, not a growth-at-all-costs startup |
| Scope boundaries recorded as a standing context entry, not just a PRD section | Design assets (Stitch) include out-of-scope screens; a standing, explicitly-referenced entry reduces the chance of accidental implementation across separate agent sessions | Rely on PRD Sections 1.6/3 alone | A dedicated context entry is what gets checked at the start of every build session per the engineering rules' session-start checklist | None meaningful |

## SECURITY
- N/A — this entry concerns scope discipline, not a security surface directly. (Note: deferred social/content features would each need their own security review — e.g., content moderation — when and if they're eventually built; not relevant until then.)

## VALIDATION
- N/A — this is a scope-governance entry, not an implementation.

## CLEANUP
- N/A.

## DEPENDENCIES
Referenced by: every feature-level context entry going forward, and the session-start checklist in the Antigravity kickoff prompts.

## HISTORY

| Date | What changed | Why | Initiated by | Related decision/issue |
|---|---|---|---|---|
| 2026-08 | Video+social idea proposed, then explicitly deferred | Scope discipline discussion | Planning conversation | Risk of folding too much into Week 1 |
| 2026-08 | "Instagram for farmers" proposed as a separate future app, not a bolt-on feature | Avoid competing with funded players before hyperlocal trust angle validated | Planning conversation | Realistic framing of AI content moderation ("bulletproof" rejected as unachievable) |
| 2026-09 | Formalized as PRD Section 3 (Future Scope) and this context entry | Needed a single, explicitly-referenced source of truth for what not to build | Digvijay | Antigravity engineering rules explicitly reference this |

## OPEN_ITEMS
- None currently — this entry should be re-read, not edited, unless a deferred item's trigger is actually met and a decision is made to begin that work (at which point a new feature-level context entry should be created, and this table updated to reflect the change in status).
