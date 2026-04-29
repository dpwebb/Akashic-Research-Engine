# Akashic Research Engine

This repository is configured for deployment on **Hostinger VPS** with the custom domain:

- Domain: `akashicresearch.info`
- Repository: `https://github.com/dpwebb/Akashic-Research-Engine.git`

## Included Configuration

- GitHub Actions workflow at `.github/workflows/deploy-production.yml` deploys the exact GitHub commit to Hostinger VPS.
- TypeScript app entry at `src/main.ts` compiles to `dist/main.js`.
- `index.html` shell loads the compiled TypeScript output.
- `scripts/build-site.mjs` creates the deployable `site/` artifact.
- `Dockerfile` and `docker-compose.yml` define the Hostinger Docker/Traefik service.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Type-check:
   ```bash
   npm run typecheck
   ```
3. Build TypeScript:
   ```bash
   npm run build
   ```
4. Build the static site artifact:
   ```bash
   npm run build:site
   ```

## Hostinger VPS Deployment

See `HOSTINGER_DEPLOYMENT.md` for the Hostinger Docker/Traefik deployment flow.
See `docs/github-source-of-truth.md` for the GitHub source-of-truth rules shared by the online applications.

Before deploying from this PC:

```bash
npm run check:source-of-truth
```

## DNS Records

At your DNS provider for `akashicresearch.info`, add:

- `A` record: `@` -> `<Hostinger VPS IPv4>`
- `A` record: `www` -> `<Hostinger VPS IPv4>`

Alternatively, `www` can be a CNAME to the root domain:

- `CNAME` record: `www` -> `akashicresearch.info`
