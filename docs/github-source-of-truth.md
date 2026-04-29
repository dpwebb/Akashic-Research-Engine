# GitHub Source of Truth

This project treats GitHub as the canonical copy of the application code.
Hostinger should only run code that exists in GitHub at a known commit.

## Repository

- Local repo: `C:\Users\webbd\OneDrive\Documents\New project 3`
- GitHub remote: `https://github.com/dpwebb/Akashic-Research-Engine.git`
- Production branch: `main`

## Workflow

1. Make source changes in the local repo.
2. Run checks locally.
3. Commit the intended changes.
4. Push `main` to GitHub.
5. Deploy production from the pushed GitHub commit.
6. Roll back only to a known GitHub commit SHA.

## Rules

- Do not make long-lived manual edits on the server.
- If an emergency server edit is made, copy it back into this repo and commit it immediately.
- If a change is not in GitHub, treat it as temporary and unsafe.
- Before deploying, confirm the working tree exactly matches the GitHub upstream branch.

## Verify Before Deploy

Run:

```bash
npm run check:source-of-truth
```

The check passes only when:

- the repo has an upstream branch configured,
- the latest upstream state has been fetched,
- the working tree has no uncommitted changes,
- local `HEAD` exactly matches the upstream GitHub branch.

## Automatic Production Deploys

The production site is deployed by `.github/workflows/deploy-production.yml`.

When a commit is pushed to `main`:

1. GitHub Actions checks out the commit.
2. GitHub Actions installs dependencies and builds the app.
3. If the build passes, GitHub Actions connects to the Hostinger VPS.
4. The VPS checks out the exact pushed commit.
5. The VPS installs dependencies, builds, and restarts the Docker container.

Required GitHub environment secrets for `production`:

- `PRODUCTION_HOST`
- `PRODUCTION_USER`
- `PRODUCTION_SSH_PRIVATE_KEY`

Optional GitHub environment secret:

- `PRODUCTION_SSH_PORT` defaults to `22` when omitted

## Rollback

Use the `Deploy production` GitHub Actions workflow manually and enter a previous commit SHA in `rollback_sha`.

That redeploys the selected commit to `/opt/akashic-research-engine/app` and restarts the production container.
