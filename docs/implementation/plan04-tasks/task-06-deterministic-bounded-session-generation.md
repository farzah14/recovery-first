# Plan 04 / Task 06 — Deterministic Bounded Session Generation

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Generate habit sessions deterministically inside the Plan 04 rolling horizon while preserving version and timezone snapshots.

## Files

- `src/features/sessions/application/ensure-session-horizon.ts`
- `src/features/sessions/session-horizon.ts`
- `tests/features/sessions/ensure-session-horizon.test.ts`
- Signed-in repository/RPC integration as required.

## Locked Horizon

Generate the previous `3` local days, the current local day, and the next `31` local days: a bounded `35`-day window.

## Steps

- [ ] Write failing deterministic horizon tests first.
- [ ] Calculate the horizon from the owner's local calendar date and timezone.
- [ ] Generate only recurrence-eligible sessions.
- [ ] Preserve the Habit Version reference used when each session is generated.
- [ ] Preserve timezone snapshots on existing sessions.
- [ ] Make repeated generation duplicate-safe and idempotent.
- [ ] Verify DST transitions and timezone edge cases.
- [ ] Ensure React components never duplicate generation invariants.

## Verification

```bash
pnpm test:sessions
pnpm typecheck
pnpm lint
```

## Completion Gate

- [ ] Horizon is exactly bounded and deterministic.
- [ ] Duplicate generation is prevented.
- [ ] Existing sessions are not rewritten silently.
- [ ] Timezone/DST tests pass.
- [ ] Repository integration uses authoritative server behavior for account data.
