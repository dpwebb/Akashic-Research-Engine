# Akashic Research Engine Implementation Plan

## Current Direction

Build the platform using the Hostinger VPS pattern already used by the other applications:

- GitHub remains the source of truth.
- GitHub Actions deploys a known commit SHA.
- Hostinger runs Docker Compose behind Traefik.
- App code uses Vite, React, TypeScript, and Hono.
- PostgreSQL will store sources, claims, genealogy data, ingestion jobs, and assistant outputs.

## Product Modules

1. Source library for public online sources.
2. Claim extraction and classification.
3. Evidence grading from A through F.
4. Genealogy map for concept development.
5. AI Research Assistant prompt workflows.
6. Realistic Addition Builder for disciplined speculation.
7. Ingestion jobs for source collection and later worker automation.
8. Duplicate detection for source imports, review queue entries, ingestion jobs, and claim fingerprints.
9. Initial-release source catalogue with at least 300 review resources, stable citations, source classifications, tags, and required review actions.
10. Default-on seed automation that reviews, approves, and promotes curated seed resources into the runtime source dataset until `SEED_REVIEW_AUTOMATION=manual` revokes it.

## Guardrails

- Never claim the Akashic Records are empirically proven.
- Never ridicule the subject.
- Separate documented history, source interpretation, subjective testimony, and speculation.
- Require citations for factual claims.
- Mark all AI-generated theories as speculative.

## Next Build Steps

1. Finish Phase 2 Auth Foundation by replacing email/localStorage fallback access with server-owned sessions.
2. Complete Phase 3 Scopes & Paywall by applying shared scope middleware to every protected API route.
3. Connect PostgreSQL with Kysely and move account/session/entitlement records into durable storage.
4. Add migrations and seed scripts using `docs/database-schema.sql`.
5. Replace static seed reads with database-backed repositories.
6. Add authenticated admin workflows for ingestion.
7. Add OpenAI API calls behind guardrail validators.
8. Add graph visualization for the genealogy map.
9. Persist source aliases and duplicate review decisions in PostgreSQL.
10. Move the generated release review catalogue from runtime-state JSON seeding into PostgreSQL migrations once the repository layer is active.

## Commercial Launch Schedule

Updated May 1, 2026. The schedule is tracked in `src/shared/launchSchedule.ts` and exposed through `/api/launch-schedule` plus the Operations command center.

| Phase | Status | Target Window | Exit Criteria |
| --- | --- | --- | --- |
| Phase 0: Beta Safety | Complete | May 1, 2026 | Current beta user can sign in, reach every paid/admin workflow, and avoid checkout. |
| Phase 1: Public Shell | Complete | May 1, 2026 | Anonymous visitors see the commercial shell while signed-in users enter `/app`. |
| Phase 2: Auth Foundation | In progress | May 2-8, 2026 | Protected APIs can trust a server session without relying on localStorage tier state. |
| Phase 3: Scopes & Paywall | In progress | May 4-12, 2026 | Direct API calls fail without the required scope, even when UI controls are bypassed. |
| Phase 4: Billing | Scheduled | May 8-15, 2026 | Subscription lifecycle changes update account scopes without manual intervention. |
| Phase 5: Enterprise | Scheduled | May 15-22, 2026 | Enterprise users can be managed without granting system admin access. |
| Phase 6: Launch Hardening | Scheduled | May 22-29, 2026 | Production deploy is safe to market and support as a paid research product. |

## Current Schedule Notes

- Phase 0 is complete because runtime beta entitlement seeding, Beta Tester/Admin scopes, and controlled fallback testing are implemented.
- Phase 1 is complete because homepage, pricing, login, register, and `/app` workspace split are implemented.
- Phase 2 remains in progress until real session persistence, expiry, logout, and account recovery exist.
- Phase 3 remains in progress until every protected route uses shared server-side scope enforcement.
- Phase 4 should follow only after Phase 2 and the core Phase 3 guards are stable, because billing must update server-owned entitlements.
