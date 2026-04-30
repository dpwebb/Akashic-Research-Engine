# Akashic Research Engine

This repository is configured for deployment on **Hostinger VPS** with the custom domain:

- Domain: `akashicresearch.info`
- Repository: `https://github.com/dpwebb/Akashic-Research-Engine.git`

## Stack

- Vite, React, and TypeScript for the research UI.
- Hono and TypeScript for API routes and production serving.
- PostgreSQL planned as the source/citation database.
- Kysely types are included for the database access layer.
- Docker, Traefik, and GitHub Actions match the Hostinger VPS management pattern used by the other apps.

## Included Configuration

- GitHub Actions workflow at `.github/workflows/deploy-production.yml` deploys the exact GitHub commit to Hostinger VPS.
- React app entry at `src/main.tsx`.
- Hono production server at `server.ts`.
- Shared research taxonomy and seeded dataset in `src/shared/`.
- Database schema draft in `docs/database-schema.sql`.
- Shared provider/secret naming standard in `docs/hostinger-api-access-standard.md`.
- `Dockerfile` and `docker-compose.yml` define the Hostinger Docker/Traefik service.

## Local Development

1. Install dependencies:
   ```bash
   corepack enable
   corepack prepare pnpm@10 --activate
   pnpm install
   ```
2. Type-check:
   ```bash
   pnpm run typecheck
   ```
3. Build:
   ```bash
   pnpm run build
   ```
4. Run the production server locally after building:
   ```bash
   pnpm start
   ```

## Hostinger VPS Deployment

See `HOSTINGER_DEPLOYMENT.md` for the Hostinger Docker/Traefik deployment flow.
See `docs/github-source-of-truth.md` for the GitHub source-of-truth rules shared by the online applications.

Before deploying from this PC:

```bash
pnpm run check:source-of-truth
```

## DNS Records

At your DNS provider for `akashicresearch.info`, add:

- `A` record: `@` -> `<Hostinger VPS IPv4>`
- `A` record: `www` -> `<Hostinger VPS IPv4>`

Alternatively, `www` can be a CNAME to the root domain:

- `CNAME` record: `www` -> `akashicresearch.info`
