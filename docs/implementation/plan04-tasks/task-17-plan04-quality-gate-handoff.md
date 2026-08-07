# Plan 04 / Task 17 — Plan 04 Quality Gate and Handoff

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Run the complete Plan 04 verification gate from a clean checkout and record the handoff only after all Tasks 01–16 are complete.

## Preconditions

- [ ] Tasks 01–16 are implemented.
- [ ] No task is marked complete from code inspection alone.
- [ ] Guest assumptions in Tasks 05 and 16 have been replaced by authenticated account behavior.
- [ ] Free/Lite/Premium limits are `5 / 10 / 30`.

## Final Verification

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:templates
pnpm test:habits
pnpm test:sessions
pnpm test:today
pnpm test:check-ins
pnpm test:core-loop
pnpm test:unit
pnpm test:component
pnpm test:integration
pnpm test:accessibility
pnpm test:e2e
pnpm test:visual
pnpm build
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:types:check
pnpm db:lint
pnpm db:stop
pnpm check:repository
git status --short
```

Use the repository's actual script names if they differ; do not silently skip an equivalent required gate.

## Acceptance Checklist

- [ ] Editable Normal and Minimum template definitions work.
- [ ] Five-step route-backed wizard works.
- [ ] React Hook Form + Zod validation is active.
- [ ] Draft save/restore/discard/continue works.
- [ ] Drafts consume no active slot and generate no sessions.
- [ ] Account-owned Dexie cache/draft/pending-operation boundaries are correct.
- [ ] Habit creation is atomic and tier limits are enforced.
- [ ] Session generation is deterministic, bounded, timezone-safe, DST-tested, and duplicate-safe.
- [ ] Today states and ordering are deterministic.
- [ ] Full, Minimum, and Manual Skipped remain distinct; Minimum is success.
- [ ] Friction is optional and private notes are excluded from analytics-facing payloads.
- [ ] Check-ins are idempotent and stale revisions are rejected.
- [ ] Same-day edits preserve immutable history.
- [ ] Closed edit windows are enforced and explained.
- [ ] Three-day unresolved conversion produces Automatic Skipped distinctly from Manual Skipped.
- [ ] Habit detail/history/version reads preserve historical records.
- [ ] Signed-in Supabase adapter has no Plan 04 stubs/no-ops.
- [ ] No browser service-role client exists.
- [ ] Authenticated desktop/mobile E2E and accessibility coverage pass.
- [ ] Clean-checkout verification passes.
- [ ] Working tree is clean.

## Handoff

Only after every gate above passes:

- [ ] Update `docs/implementation/IMPLEMENTATION-PLAN.md` Plan 04 status to `Verified complete`.
- [ ] Record verification evidence/commit SHA.
- [ ] Confirm Plan 05 prerequisites are satisfied.

## Completion Gate

**Plan 04 is complete only when every required check above has fresh passing evidence.**
