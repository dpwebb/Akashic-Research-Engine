# Akashic Research Engine

This repository is configured for deployment on **GitHub Pages** with the custom domain:

- Domain: `akashicresearch.info`
- Repository: `https://github.com/dpwebb/Akashic-Research-Engine.git`

## GitHub Pages Custom Domain Configuration

### 1) Repository Settings
In GitHub:
1. Go to **Settings → Pages**.
2. Set **Source** to your deployment branch (commonly `main` / root).
3. Set **Custom domain** to `akashicresearch.info`.
4. Enable **Enforce HTTPS** after DNS propagates.

### 2) DNS Records
At your DNS provider for `akashicresearch.info`, add:

- `A` record: `@` → `185.199.108.153`
- `A` record: `@` → `185.199.109.153`
- `A` record: `@` → `185.199.110.153`
- `A` record: `@` → `185.199.111.153`
- `CNAME` record: `www` → `dpwebb.github.io`

### 3) Domain File in Repository
This repo includes a `CNAME` file at the root containing:

```txt
akashicresearch.info
```

GitHub Pages reads this file during publishing and preserves the custom domain.
