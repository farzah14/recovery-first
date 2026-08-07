# Plan 04 / Task 07 — Habit Draft and Creation Application Services

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Implement framework-independent application services for saving habit drafts, creating habits atomically, applying active-slot limits, and starting the session horizon.

## Files

- `src/features/habits/application/create-habit.ts`
- `src/features/habits/application/save-habit-draft.ts`
- `src/features/habits/application/activate-habit.ts`
- `tests/features/habits/create-habit.test.ts`
- `tests/features/habits/save-habit-draft.test.ts`

## Steps

- [ ] Write failing service tests first.
- [ ] Implement account-owned draft save/load/delete orchestration.
- [ ] Ensure drafts consume no active slot and generate no sessions.
- [ ] Implement atomic habit creation through `ProductRepository`.
- [ ] Enforce Free `5`, Lite `10`, Premium `30` slot limits through shared/server-authoritative rules.
- [ ] Map active-limit failures to non-destructive UI-safe errors.
- [ ] Trigger bounded session generation only after successful activation.
- [ ] Delete only the successfully consumed draft after creation.
- [ ] Prevent partial habit/version/session records on failed creation.

## Verification

```bash
pnpm vitest run tests/features/habits/create-habit.test.ts tests/features/habits/save-habit-draft.test.ts
pnpm test:habits
pnpm test:sessions
pnpm typecheck
pnpm lint
```

## Completion Gate

- [ ] Draft persistence works for authenticated owners.
- [ ] Drafts do not consume active slots.
- [ ] Creation is atomic.
- [ ] Tier limits are enforced correctly.
- [ ] Failed limit checks leave no partial records.
- [ ] Focused tests pass.
