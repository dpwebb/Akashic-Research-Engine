# Akashic Research Engine

This repository is configured for static deployment on **GitHub Pages** and **Hostinger VPS** with the custom domain:

- Domain: `akashicresearch.info`
- Repository: `https://github.com/dpwebb/Akashic-Research-Engine.git`

## Included Configuration

- `CNAME` at repository root with `akashicresearch.info`.
- GitHub Actions workflow at `.github/workflows/pages.yml` builds and deploys Pages on push.
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
4. Build the GitHub Pages artifact:
   ```bash
   npm run build:site
   ```

## GitHub Pages Setup Steps

1. In GitHub, go to **Settings -> Pages**.
2. Ensure **Build and deployment** uses **GitHub Actions**.
3. In **Custom domain**, set `akashicresearch.info`.
4. After DNS propagation, enable **Enforce HTTPS**.

## Hostinger VPS Deployment

See `HOSTINGER_DEPLOYMENT.md` for the Hostinger Docker/Traefik deployment flow.
See `docs/github-source-of-truth.md` for the GitHub source-of-truth rules shared by the online applications.

Before deploying from this PC:

```bash
npm run check:source-of-truth
```

## DNS Records

At your DNS provider for `akashicresearch.info`, add:

- `A` record: `@` -> `185.199.108.153`
- `A` record: `@` -> `185.199.109.153`
- `A` record: `@` -> `185.199.110.153`
- `A` record: `@` -> `185.199.111.153`
- `CNAME` record: `www` -> `dpwebb.github.io`
