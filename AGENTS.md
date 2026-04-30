# Akashic Research Engine Codex Rules

## Scope
- Work only in this repository: C:\Users\webbd\Projects\Akashic-Research-Engine
- Treat this local directory as the working copy for Codex chat changes.
- GitHub remains the source of truth for deployment after commits are pushed.

## Locked-In Flow
- Make requested code changes locally in this project directory.
- Commit automatically after completing requested code changes and passing the relevant local checks.
- Do not push automatically unless explicitly asked.
- When publishing is requested, commit and push to `main`; the existing GitHub Actions and Hostinger path handle deployment.
- Do not add or require new secrets, tokens, deploy keys, Hostinger authentication, or GitHub authentication.

## Do Not Change Unless Explicitly Requested
- `.env`
- `.env.*`
- Docker, Traefik, or deployment credentials
- GitHub Actions secrets or environments

## Checks
- Prefer `pnpm run typecheck` and `pnpm run build` before publishing.
- Use `pnpm run check:source-of-truth` before manual deployment checks.
