# Plan 04 / Task 10 — Today Read Models and Ordering

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Build a deterministic Today read model that distinguishes action-required, recorded, empty, and completed states.

## Files

- `src/features/today/application/get-today-read-model.ts`
- `src/features/today/today-ordering.ts`
- `src/features/today/today-types.ts`
- `tests/features/today/get-today-read-model.test.ts`

## Steps

- [ ] Write failing Today read-model tests first.
- [ ] Read Today data only through `ProductRepository`.
- [ ] Distinguish no habits, no eligible sessions, active sessions, and all-recorded states.
- [ ] Order action-required sessions deterministically before completed/recorded sessions according to product rules.
- [ ] Preserve Full, Minimum, Manual Skipped, Automatic Skipped, Excused, and Unrecorded distinctions.
- [ ] Never expose Automatic Skipped as a user-recordable action.
- [ ] Surface active habit count and tier limit where needed by UI.
- [ ] Keep ordering logic framework-independent and unit-testable.

## Verification

```bash
pnpm vitest run tests/features/today/get-today-read-model.test.ts
pnpm test:today
pnpm typecheck
pnpm lint
```

## Completion Gate

- [ ] Ordering is deterministic.
- [ ] Empty/completed/action-required states remain distinct.
- [ ] Automatic Skipped is read-only.
- [ ] Account ownership is respected through the repository contract.
- [ ] Focused tests pass.
