# Plan 04 / Task 12 — Full, Minimum, and Skipped Check-ins

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Implement user-recordable check-ins with idempotent commands, optional friction capture, and authoritative account persistence.

## Files

- `src/features/check-ins/application/record-check-in.ts`
- `src/features/check-ins/components/check-in-action-group.tsx`
- `src/features/check-ins/components/check-in-confirmation.tsx`
- `src/features/check-ins/components/friction-dialog.tsx`
- `src/features/check-ins/forms/friction-form-schema.ts`
- `src/features/check-ins/check-in-command.ts`
- `tests/features/check-ins/record-check-in.test.ts`
- `tests/features/check-ins/friction-form-schema.test.ts`
- `tests/features/check-ins/check-in-components.test.tsx`

## Steps

- [ ] Write failing application and friction-form tests first.
- [ ] Generate/use a stable UUID `commandId` for each mutation intent.
- [ ] Include `expectedSessionRevision`.
- [ ] Support `full`, `minimum`, and `manual_skipped` from the core Today UI.
- [ ] Treat Minimum as a successful continuity outcome.
- [ ] Make friction capture optional for Skipped.
- [ ] Use controlled friction codes from the Plan 03 domain contract.
- [ ] Keep free-text friction notes private and outside analytics-facing payloads.
- [ ] Make command replay with the same ID/payload idempotent.
- [ ] Surface stale revision/conflict errors without silently overwriting data.

## Verification

```bash
pnpm test:check-ins
pnpm test:today
pnpm typecheck
pnpm lint
```

## Completion Gate

- [ ] Full, Minimum, and Skipped persist distinctly.
- [ ] Minimum counts as success.
- [ ] Duplicate submission does not duplicate history.
- [ ] Stale revisions are rejected.
- [ ] Friction note privacy boundary is preserved.
- [ ] Focused tests pass.
