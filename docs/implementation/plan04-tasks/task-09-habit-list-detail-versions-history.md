# Plan 04 / Task 09 — Habit List, Detail, Versions, and History Reads

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Complete authenticated habit list/detail/history reads while preserving immutable versions and check-in history.

## Files

- `src/features/habits/application/list-habits.ts`
- `src/features/habits/application/get-habit-detail.ts`
- `src/features/habits/components/habit-list.tsx`
- `src/features/habits/components/habit-card.tsx`
- `src/features/habits/components/habit-detail.tsx`
- `src/features/habits/components/habit-history.tsx`
- Habit list/detail/history routes
- `tests/features/habits/habit-list.test.tsx`
- `tests/features/habits/habit-detail.test.tsx`

## Steps

- [ ] Write owner-scoped read tests first.
- [ ] Implement habit list read service through `ProductRepository`.
- [ ] Implement habit detail read service including current and historical versions.
- [ ] Render lifecycle state and current Normal/Minimum definitions.
- [ ] Render immutable historical versions without silently rewriting them.
- [ ] Render history states distinctly: Full, Minimum, Manual Skipped, Automatic Skipped, Excused where supported, and Unrecorded.
- [ ] Ensure no account can read another account's habit data.
- [ ] Add loading, empty, and error states.

## Verification

```bash
pnpm vitest run tests/features/habits/habit-list.test.tsx tests/features/habits/habit-detail.test.tsx
pnpm test:habits
pnpm test:accessibility
pnpm typecheck
pnpm build
```

## Completion Gate

- [ ] List/detail/history reads are account-scoped.
- [ ] Historical versions remain immutable.
- [ ] Outcome/history states are visually distinct.
- [ ] Empty/error/loading states exist.
- [ ] Tests and build pass.
