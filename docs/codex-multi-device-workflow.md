# Codex Multi-Device Workflow (Windows Desktop + iPhone)

This project supports a **desktop-primary** workflow with optional iPhone updates.

## Recommended model

- Use **Codex Desktop on Windows** for most implementation and validation work.
- Use **Codex Online on iPhone** for focused edits, triage, and quick route/content updates.
- Keep GitHub as the source of truth by always using short-lived branches and pull requests.

## Branching convention

Use explicit prefixes so changes are easy to review from either device:

- `feature/*` for new functionality
- `fix/*` for bug fixes
- `chore/*` for maintenance
- `hotfix/*` for urgent production changes

Examples:

- `fix/router-mobile-nav`
- `feature/admin-config-drilldown`

## Device handoff checklist

When switching between desktop and iPhone:

1. Commit and push your current branch.
2. Open/update a PR draft with a short status note.
3. On the other device, fetch and checkout the same branch.
4. Continue edits and commit with clear scope.
5. Run local checks on desktop before final merge:
   - `pnpm run typecheck`
   - `pnpm run build`
   - `pnpm run check:source-of-truth` (pre-deploy)

## Routing changes safety checklist

When modifying routes from iPhone:

1. Update route definitions and any navigation links together.
2. Verify restricted routes still honor tier gating (`Free`, `Researcher`, `Enterprise`).
3. Include before/after paths in the PR description.
4. Re-run full checks on desktop before merge.

## Merge policy

- Merge to `main` only through PR after checks pass.
- Do not deploy from unreviewed, device-local changes.
