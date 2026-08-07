# Plan 04 / Task 14 — Unrecorded Resolution and Three-Day Conversion

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Resolve expired Unrecorded sessions into Automatic Skipped after the authoritative three-local-calendar-day window without treating that automatic outcome as a manual user skip.

## Files

- `src/features/sessions/application/resolve-expired-unrecorded.ts`
- `tests/features/sessions/resolve-expired-unrecorded.test.ts`
- Signed-in repository/database integration as required.

## Rules

- Unrecorded remains unresolved before `resolutionDueAt`.
- Resolution uses the owner's authoritative local calendar context.
- Expired unresolved sessions become `automatic_skipped`.
- Automatic Skipped is distinct from Manual Skipped.
- Automatic Skipped must not create a Manual Skipped history event.
- Automatic Skipped must not increment the manual Recovery trigger counter.
- Re-running resolution must be idempotent.

## Steps

- [ ] Write failing before/after-window tests first.
- [ ] Implement the application service through `ProductRepository`.
- [ ] Call the authoritative database/domain function for account data.
- [ ] Verify exact boundary behavior around the three-day deadline.
- [ ] Verify repeated execution produces no duplicate transitions/history.
- [ ] Verify Automatic Skipped remains read-only in Today.
- [ ] Verify history/read models distinguish automatic from manual skipped.
- [ ] Add Recovery-counter regression coverage.

## Verification

```bash
pnpm vitest run tests/features/sessions/resolve-expired-unrecorded.test.ts
pnpm test:sessions
pnpm test:today
pnpm db:test
pnpm typecheck
pnpm lint
```

## Completion Gate

- [ ] Before deadline: remains Unrecorded.
- [ ] After deadline: becomes Automatic Skipped.
- [ ] Resolution is idempotent.
- [ ] No manual-skip history or Recovery increment is created.
- [ ] Focused and database tests pass.
