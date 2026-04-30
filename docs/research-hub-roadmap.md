# Akashic Research Hub Roadmap

This project is moving from a static seed corpus toward a durable research hub. The static TypeScript data remains the current runtime source, but the database schema now models the entities needed for a central reference system.

## Implemented Foundation

- Canonical sources, claims, genealogy nodes, and genealogy edges.
- Structured index data for people, movements, terms, timeline events, and bibliography.
- Discovery search across local corpus, structured index, and public web.
- Review queue for discovery candidates before promotion into trusted sources.
- Evidence-grade, source-class, source, and claim filters in the UI.

## Durable Storage Targets

The database should eventually store:

- `sources`
- `claims`
- `research_people`
- `research_movements`
- `research_terms`
- `timeline_events`
- `bibliographic_records`
- `source_claim_links`
- `entity_source_links`
- `review_queue_items`
- `source_full_texts`

## Next Migration Steps

1. Add Kysely table types for every schema table.
2. Create seed import scripts that upsert the current static corpus into Postgres.
3. Read canonical sources and claims from the database when `DATABASE_URL` is configured.
4. Keep static data as a fallback for local demos and deployments without a database.
5. Add full-text extraction jobs for public-domain source URLs.
6. Promote approved review queue items into `sources` through an explicit approval action.

## Research Quality Requirements

Every promoted source should preserve:

- Source classification.
- Confidence level.
- Citation notes.
- Review status and reviewer notes.
- Bibliographic metadata.
- Page or chapter references where available.
- Explicit warnings for testimony, metaphysical claims, speculation, and commercial material.
