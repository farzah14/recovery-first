# Plan 04 / Task 01 — Core-Loop Dependencies and Focused Test Commands

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Prepare the repository tooling required for the Plan 04 authenticated account core loop.

## Files

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

## Steps

- [ ] Verify the Plan 03A baseline and clean working tree.
- [ ] Add/confirm `react-hook-form`, `zod`, `@hookform/resolvers`, and `@tanstack/react-query`.
- [ ] Add focused scripts: `test:templates`, `test:habits`, `test:sessions`, `test:today`, `test:check-ins`, and `test:core-loop`.
- [ ] Ensure the focused core-loop script targets the authenticated account suites, not obsolete Guest suites.
- [ ] Run formatting, lint, typecheck, repository policy, and package verification.
- [ ] Commit only after fresh verification passes.

## Verification

```bash
pnpm verify
pnpm format:check
pnpm lint
pnpm typecheck
pnpm check:repository
pnpm build
git status --short
```

## Completion Gate

- [ ] Required dependencies are installed and lockfile is synchronized.
- [ ] Six Plan 04 focused test scripts exist.
- [ ] Existing scripts remain intact.
- [ ] All verification commands pass.
- [ ] Working tree is clean after commit.
