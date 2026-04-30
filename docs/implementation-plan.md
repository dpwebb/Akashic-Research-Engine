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

## Guardrails

- Never claim the Akashic Records are empirically proven.
- Never ridicule the subject.
- Separate documented history, source interpretation, subjective testimony, and speculation.
- Require citations for factual claims.
- Mark all AI-generated theories as speculative.

## Next Build Steps

1. Connect PostgreSQL with Kysely.
2. Add migrations and seed scripts using `docs/database-schema.sql`.
3. Replace static seed reads with database-backed repositories.
4. Add authenticated admin workflows for ingestion.
5. Add OpenAI API calls behind guardrail validators.
6. Add graph visualization for the genealogy map.
