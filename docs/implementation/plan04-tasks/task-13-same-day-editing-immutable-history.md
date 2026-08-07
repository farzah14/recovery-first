# Plan 04 / Task 13 — Same-Day Check-in Editing and Immutable History

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Allow eligible same-day check-in edits while preserving immutable prior check-in history and enforcing revision safety.

## Files

- `src/features/check-ins/application/edit-check-in.ts`
- `src/features/check-ins/components/edit-check-in-dialog.tsx`
- `tests/features/check-ins/edit-check-in.test.ts`
- Related repository/database integration tests.

## Steps

- [ ] Write failing edit/history tests first.
- [ ] Validate authenticated owner and session ownership.
- [ ] Validate expected session revision and current check-in revision.
- [ ] Restrict edits to the owner's local same-day window.
- [ ] Replace only the current projection while preserving the prior history row/event.
- [ ] Reject stale edits and closed-window edits with typed errors.
- [ ] Reuse Full/Minimum/Skipped validation rules.
- [ ] Build an accessible edit dialog with clear current and replacement outcomes.
- [ ] Refresh Today/detail/history reads after success without mutating historical records client-side.

## Verification

```bash
pnpm vitest run tests/features/check-ins/edit-check-in.test.ts
pnpm test:check-ins
pnpm test:habits
pnpm typecheck
pnpm lint
```

## Completion Gate

- [ ] Same-day edits work only inside the allowed local-date window.
- [ ] Prior history remains immutable.
- [ ] Stale revisions are rejected.
- [ ] Closed edit windows are explained clearly.
- [ ] Focused tests pass.
