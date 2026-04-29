# Akashic Research Engine

This repository is configured for deployment on **GitHub Pages** with the custom domain:

- Domain: `akashicresearch.info`
- Repository: `https://github.com/dpwebb/Akashic-Research-Engine.git`

## Included Configuration

- `CNAME` at repository root with `akashicresearch.info`.
- GitHub Actions workflow at `.github/workflows/pages.yml` to deploy Pages on push.
- Basic `index.html` landing page for initial Pages publishing.

## GitHub Pages Setup Steps

1. In GitHub, go to **Settings → Pages**.
2. Ensure **Build and deployment** uses **GitHub Actions**.
3. In **Custom domain**, set `akashicresearch.info`.
4. After DNS propagation, enable **Enforce HTTPS**.

## DNS Records

At your DNS provider for `akashicresearch.info`, add:

- `A` record: `@` → `185.199.108.153`
- `A` record: `@` → `185.199.109.153`
- `A` record: `@` → `185.199.110.153`
- `A` record: `@` → `185.199.111.153`
- `CNAME` record: `www` → `dpwebb.github.io`
