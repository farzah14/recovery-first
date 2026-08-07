# Plan 04 / Task 11 — Today Dashboard and Session Card States

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Build the Today dashboard presentation around the deterministic Task 10 read model and stable session-card states.

## Files

- `src/features/today/components/daily-progress-card.tsx`
- `src/features/today/components/first-check-in-guide.tsx`
- `src/features/today/components/today-empty-state.tsx`
- `src/features/today/components/today-page-client.tsx`
- `src/features/today/components/today-session-card.tsx`
- `tests/features/today/today-page.test.tsx`
- `tests/features/today/today-session-card.test.tsx`

## Steps

- [ ] Write failing Today component tests first.
- [ ] Render the deterministic Today read model without duplicating domain/database invariants.
- [ ] Keep Full, Minimum, and Skipped actions visible and keyboard reachable for unrecorded sessions.
- [ ] Show recorded outcomes distinctly.
- [ ] Show same-day Edit entry points only when eligible.
- [ ] Surface pending, failed, conflict, and synced states where applicable.
- [ ] Implement no-habits, no-eligible-sessions, and all-recorded states separately.
- [ ] Avoid punitive streak-loss language.
- [ ] Verify 390 px mobile layout, zoom, target sizes, focus, and reduced-motion behavior.

## Verification

```bash
pnpm vitest run tests/features/today/today-page.test.tsx tests/features/today/today-session-card.test.tsx
pnpm test:today
pnpm test:accessibility
pnpm test:visual
pnpm typecheck
pnpm build
```

## Completion Gate

- [ ] Session-card anatomy is stable across states.
- [ ] Full/Minimum/Skipped actions are accessible.
- [ ] Same-day Edit state is correct.
- [ ] Empty/completed states are distinct.
- [ ] Mobile/accessibility/visual checks pass.
