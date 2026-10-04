# Context Entry: Tech Stack Selection

## IDENTITY
- **Feature/change name:** Phase 1 Tech Stack Selection
- **Unique identifier:** CTX-001
- **Status:** complete (decision locked)
- **Owner:** Digvijay
- **Created:** 2026-08 / **Last updated:** 2026-09

## INTENT
- **Problem being solved:** Choose a hosting/infrastructure stack for a solo-developer MVP that is production-reliable without requiring dedicated ops capacity.
- **Objective:** Ship a real, live e-commerce system for an operating family business within a short timeframe, on a stack that can later migrate to more scalable infrastructure without a rewrite.
- **Expected behavior:** Reliable storefront + admin dashboard, deployable and maintainable by one person.
- **Scope:** Hosting, database, cache, file storage, CI/CD, and domain decisions for Phase 1.
- **Explicitly out-of-scope:** Kubernetes-based orchestration, raw AWS EC2/RDS management, Marg ERP infrastructure.

## ARCHITECTURE
- **Affected services/modules:** Entire system — frontend hosting, backend hosting, database, cache, file storage, CI/CD.
- **Dependencies:** Vercel (frontend), Render/Railway (backend), Supabase (Postgres), Upstash (Redis), Cloudflare R2 (file storage), GitHub Actions (CI/CD).
- **Integration points:** Supabase is AWS-backed infrastructure underneath, keeping a future AWS migration low-friction.

## DECISIONS

| Decision | Reason | Alternatives considered | Why this was preferred | Trade-offs |
|---|---|---|---|---|
| Vercel (frontend) + Render/Railway (backend) over raw AWS | Managed platforms handle servers, scaling, SSL, deployments with near-zero ops work for a solo developer | AWS EC2/ECS/RDS managed directly | Raw AWS requires ongoing server management, patching, networking, security groups — a real ops tax on top of building the product | AWS free tier is 12 months only and easy to exceed accidentally; Vercel/Render free tiers have their own usage limits |
| AWS + Devtron (Kubernetes-native CD) rejected for launch | Devtron requires an existing Kubernetes cluster (typically EKS); EKS control plane alone costs ~$73/month minimum before worker nodes; Kubernetes has a steep operational learning curve even for experienced engineers | Devtron on EKS, explicitly proposed before this decision | Kubernetes is standard for companies with multiple services/teams and traffic that justifies the ops overhead — not for a single NestJS backend serving a regional shop's first launch | Revisit if/when the system grows multiple services, multiple teams, or traffic that justifies the overhead |
| Supabase (Postgres) over AWS RDS initially | Managed Postgres, generous free tier, genuinely production-grade, and already built on AWS infrastructure | AWS RDS directly | Avoids managing a database server while keeping a clear migration path later (Supabase → RDS touches only the repository layer per the Repository pattern) | Migration to RDS still a future task if/when AWS migration trigger is hit |
| Custom domain purchased immediately, hosting stays on free tier | Domain credibility matters for a real business regardless of hosting tier; hosting tier upgrade is a separate, later decision gated by actual usage | Delaying domain purchase until a paid hosting tier is needed | A `.vercel.app` URL looks unfinished to real customers; domain cost (₹800–1,500/year) is trivial and independent of hosting tier | None significant |

## SECURITY
- HTTPS enforced by default via Vercel/Render.
- Secrets/env vars managed via host platform, never hardcoded.
- Migration path to AWS Secrets Manager planned for when AWS migration trigger is hit.

## VALIDATION
- N/A — pre-implementation, infrastructure decision only.

## CLEANUP
- N/A — pre-implementation.

## DEPENDENCIES
`Entire system → Frontend (Vercel) / Backend (Render/Railway) → Database (Supabase/Postgres) → Cache (Upstash) → File storage (Cloudflare R2) → CI/CD (GitHub Actions)`

## HISTORY

| Date | What changed | Why | Initiated by | Related decision/issue |
|---|---|---|---|---|
| 2026-08 | AWS + Devtron/Kubernetes proposed | Desire for "industry standard" infra | Digvijay | Scope/complexity mismatch for solo dev, pre-launch MVP |
| 2026-08 | Reverted to Vercel + Render + Supabase | Right-sized to actual team size (one person) and unvalidated traffic | Planning discussion | Migration path to AWS kept open, gated by evidence |

## OPEN_ITEMS
- **Migration trigger (not yet met):** sustained free-tier limit breaches, need for custom background workers/cron jobs, or a clear cost crossover at real scale.
- **Risk:** none currently identified at this decision's scope.
- **Follow-up:** revisit this entry if/when AWS migration trigger is hit; do not migrate speculatively.
