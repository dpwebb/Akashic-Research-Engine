# Hostinger API Access Standard

GitHub remains the source of truth for application code. API secrets stay outside Git.

## Runtime Secret Locations

Each Hostinger app should load a local, untracked environment file through Docker Compose:

- Production apps: `.env.production`
- Staging apps: `.env.staging`

These files live beside each app's `docker-compose.yml` on the VPS and must never be committed.

## Shared Provider Names

Use the same environment variable names across current and future apps:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `DATABASE_URL` for app-specific PostgreSQL databases
- `DOCSTRANGE_API_KEY`
- `GOOGLE_GEMINI_SA_KEY`
- `GCS_BUCKET_NAME`
- `GCS_SERVICE_ACCOUNT_KEY`
- `POSTGRID_API_KEY`
- `POSTGRID_WEBHOOK_SECRET`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

Do not share app-specific database URLs, JWT secrets, OAuth client secrets, or webhook secrets unless the apps intentionally use the same service boundary.

## GitHub Actions

GitHub Actions should deploy the exact commit SHA to Hostinger, then run Docker Compose on the VPS. The workflow should not print secrets and should not require API keys at build time unless a specific framework requires build-time public keys.

## Application Code

Server code may read provider keys from `process.env`.

Browser code must never receive secret keys. Only publishable keys, such as a Stripe publishable key, may be exposed to the frontend.

## Akashic Research Engine

Akashic now loads `.env.production` on Hostinger and exposes `/api/integrations` to report which providers are configured by name only. It does not expose secret values.
