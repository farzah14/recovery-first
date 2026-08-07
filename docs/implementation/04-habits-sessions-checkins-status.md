# Plan 04 — Habits, Sessions, and Check-ins Status Audit

**Repository:** `farzah14/recovery-first`  
**Branch audited:** `main`  
**Audit date:** 2026-08-07  
**Purpose:** Record what is currently implemented, partially implemented, unfinished, or obsolete in Plan 04 after the Plan 04 rollback.

---

## Status Legend

- ✅ **Verified complete** — implemented and has passed the Plan 04 task/quality gate.
- 🟡 **Partially implemented** — meaningful implementation exists on `main`, but the task is not complete or not freshly verified against the Plan 04 acceptance criteria.
- ❌ **Not finished** — required Plan 04 implementation is absent, stubbed, or missing its required verification.
- 🔁 **Rewrite required** — the original task is based on the obsolete Guest runtime model and must be rewritten for authenticated Free/Lite/Premium accounts before execution.

---

## Executive Summary

Plan 04 contains **17 tasks**.

| Classification | Count |
|---|---:|
| ✅ Verified complete | 0 |
| 🟡 Partially implemented | 8 |
| ❌ Not finished | 7 |
| 🔁 Rewrite required | 2 |
| **Total** | **17** |

Plan 04 must **not** be marked `Verified complete` yet.

The repository contains meaningful pre-existing Today/Habits/Supabase work, but the dedicated Plan 04 implementation was merged in PR #5 and then rolled back by PR #6. Therefore, any Plan 04 task must be considered incomplete until its current `main` implementation is reconciled with the amended authenticated-account requirements and freshly verified.

---

# Task-by-Task Status

## Task 1 — Add Core-Loop Dependencies and Focused Test Commands

**Status:** ❌ **Not finished**

### Required

- Add/confirm:
  - `react-hook-form`
  - `zod`
  - `@hookform/resolvers`
  - `@tanstack/react-query`
- Add focused scripts:
  - `test:templates`
  - `test:habits`
  - `test:sessions`
  - `test:today`
  - `test:check-ins`
  - `test:core-loop`
- Run baseline verification before continuing.

### Current `main`

The dedicated Plan 04 focused scripts are not present, and the full dependency/tooling task has not passed its Plan 04 gate.

### Remaining work

- [ ] Add missing Plan 04 dependencies.
- [ ] Add focused Plan 04 scripts.
- [ ] Run repository/static verification.
- [ ] Commit only after the task gate passes.

---

## Task 2 — Define Account-Neutral Product Repository Contracts

**Status:** 🟡 **Partially implemented**

### Already present

`src/lib/repositories/product-repository.ts` currently defines substantial contracts, including:

- `ProductOwner`
- `CreateHabitCommand`
- `UpdateHabitVersionCommand`
- `SetHabitLifecycleCommand`
- `SessionSummary`
- `TodayRepositoryRead`
- `WeeklyOverviewRead`
- check-in commands/results
- `ProductRepository`

### Remaining work

- [ ] Reconcile the contract against the amended Plan 03A account-only architecture.
- [ ] Add/restore the Plan 04 repository contract tests.
- [ ] Verify error-code mapping and ownership constraints.
- [ ] Run focused tests, typecheck, and lint.

---

## Task 3 — Implement the Basic Habit Template Catalog

**Status:** ❌ **Not finished**

### Required

- `src/features/templates/catalog.ts`
- `src/features/templates/template-card.tsx`
- `src/features/templates/template-picker.tsx`
- template tests

### Current `main`

The dedicated Plan 04 template catalog modules are not present.

### Remaining work

- [ ] Create deterministic basic templates.
- [ ] Ensure each template has distinct editable Normal and Minimum definitions.
- [ ] Add search/filter behavior.
- [ ] Add component and catalog tests.

---

## Task 4 — Define Habit Wizard Schema, Defaults, and Mapping

**Status:** ❌ **Not finished**

### Required

- Zod form schema
- inferred form types
- deterministic defaults
- form-to-repository command mapping
- validation/mapping tests

### Current `main`

The dedicated Plan 04 habit wizard form modules are not present.

### Remaining work

- [ ] Create `habit-form-schema.ts`.
- [ ] Create `habit-form-types.ts`.
- [ ] Create `habit-form-defaults.ts`.
- [ ] Create `habit-form-mapper.ts`.
- [ ] Update all historical Guest examples to authenticated account ownership.
- [ ] Add focused tests.

---

## Task 5 — Implement the Guest Dexie Product Repository

**Status:** 🔁 **Rewrite required**

### Why the original task is obsolete

Plan 03A changed the runtime identity model to authenticated accounts only:

- Free
- Lite
- Premium

Guest is no longer a normal product identity. Legacy browser-local data is recovery/export data only.

### Replace Task 5 with

**Implement Account-Owned Dexie Cache, Draft, and Pending-Operation Contracts**

### New required scope

- [ ] Account-owned Dexie records using authenticated `ownerId`.
- [ ] Habit draft persistence.
- [ ] Durable cache records.
- [ ] Pending-operation/outbox contracts where required by current architecture.
- [ ] No new Guest canonical writes.
- [ ] Preserve legacy local data without silently attaching it to an account.
- [ ] Add ownership and migration tests.

---

## Task 6 — Implement Deterministic Bounded Session Generation

**Status:** 🟡 **Partially implemented**

### Already present

The signed-in Supabase repository currently contains session-horizon/session-generation logic and calls the authoritative session RPC.

### Still missing for Plan 04 completion

- [ ] Dedicated Plan 04 session-generation application module.
- [ ] Explicit bounded-horizon acceptance tests.
- [ ] Timezone snapshot tests.
- [ ] DST regression tests.
- [ ] Duplicate-safe/idempotent generation evidence.
- [ ] Existing-session immutability verification.

---

## Task 7 — Implement Habit Draft and Creation Application Services

**Status:** ❌ **Not finished**

### Required

- `create-habit.ts`
- `save-habit-draft.ts`
- activation/active-limit orchestration
- focused tests

### Current blocker/evidence

The current signed-in repository still contains unfinished draft behavior:

```ts
async saveHabitDraft(): Promise<void> {
  throw new ProductRepositoryError(
    'repository_unavailable',
    'drafts_are_not_part_of_this_core_loop',
  );
}
```

and:

```ts
async getHabitDraft(): Promise<unknown | null> {
  return null;
}
```

### Remaining work

- [ ] Implement account-owned draft save/load/delete behavior.
- [ ] Implement creation orchestration.
- [ ] Map Free/Lite/Premium active-limit failures correctly.
- [ ] Ensure successful creation removes only the intended draft.
- [ ] Add focused tests.

---

## Task 8 — Build the Route-Backed Habit Creation Wizard

**Status:** ❌ **Not finished**

### Required five-step flow

1. Goal and name
2. Normal and Minimum
3. Schedule and cue
4. Optional reminder
5. Review and create

### Current `main`

The dedicated Plan 04 `HabitWizard` implementation is not present. Existing habit creation UI does not satisfy this task by itself.

### Remaining work

- [ ] Build with React Hook Form + Zod.
- [ ] Preserve values across steps.
- [ ] Implement save/discard/continue behavior.
- [ ] Implement account-tier active-limit resolution.
- [ ] Add mobile-safe sticky controls.
- [ ] Add accessibility/component/build verification.

---

## Task 9 — Implement Habit List, Detail, Versions, and History Reads

**Status:** 🟡 **Partially implemented**

### Already present

- Habits route exists.
- Signed-in repository implements `listHabits()`.
- Signed-in repository implements `getHabitDetail()`.
- Existing Habits management UI exists.

### Remaining work

- [ ] Complete Plan 04 detail/history/version surfaces.
- [ ] Ensure historical versions are immutable in UI.
- [ ] Ensure history clearly distinguishes Full, Minimum, Manual Skipped, Automatic Skipped, and Unrecorded.
- [ ] Add owner-scoped tests.
- [ ] Add accessibility/build verification.

---

## Task 10 — Implement Today Read Models and Ordering

**Status:** 🟡 **Partially implemented**

### Already present

A substantial Today dashboard and repository-backed Today read path already exist.

### Remaining work

- [ ] Implement/reconcile the dedicated deterministic Today read model.
- [ ] Verify ordering rules for unrecorded/action-required/recorded sessions.
- [ ] Verify no-habits, no-eligible-sessions, all-recorded, and active states remain distinct.
- [ ] Verify Automatic Skipped is never exposed as a user action.
- [ ] Add focused Today model tests.

---

## Task 11 — Build the Today Dashboard and Session Card States

**Status:** 🟡 **Partially implemented**

### Already present

`TodayDashboard` exists and contains substantial UI, authenticated repository reads, session mapping, and action presentation.

### Remaining work

- [ ] Reconcile implementation with the Plan 04 stable session-card anatomy.
- [ ] Verify Full/Minimum/Skipped actions are always keyboard reachable.
- [ ] Verify same-day Edit state.
- [ ] Verify pending/failed/conflict status presentation where applicable.
- [ ] Verify no-habit/no-session/all-recorded states.
- [ ] Add focused component/accessibility/visual coverage.

---

## Task 12 — Implement Full, Minimum, and Skipped Check-ins

**Status:** 🟡 **Partially implemented**

### Already present

The signed-in Supabase repository implements `recordCheckIn()` and calls the authoritative database function.

### Remaining work

- [ ] Complete Plan 04 check-in application service.
- [ ] Implement/verify stable command-ID handling.
- [ ] Implement/verify optional friction code and private note behavior.
- [ ] Add user-facing confirmation semantics.
- [ ] Add duplicate submission tests.
- [ ] Add stale revision tests.
- [ ] Confirm free-text friction never enters analytics-facing payloads.

---

## Task 13 — Implement Same-Day Check-in Editing and Immutable History

**Status:** 🟡 **Partially implemented**

### Already present

The repository exposes `editCheckIn()`.

### Important gap

The current adapter delegates edit behavior directly to `recordCheckIn()`, so the complete Plan 04 edit contract has not been demonstrated.

### Remaining work

- [ ] Implement explicit same-day edit orchestration.
- [ ] Validate current check-in revision.
- [ ] Validate session revision.
- [ ] Preserve the prior check-in row.
- [ ] Reject edits after the owner-local same-day window.
- [ ] Implement the edit dialog and entry points.
- [ ] Add immutable-history tests.

---

## Task 14 — Implement Unrecorded Resolution and Three-Day Conversion

**Status:** ❌ **Not finished**

### Required

- Unrecorded stays unresolved before `resolutionDueAt`.
- After the three-day window, unresolved sessions become `automatic_skipped`.
- Automatic Skipped must not create a Manual Skipped history event.
- Automatic Skipped must not increment the manual Recovery trigger counter.
- Re-running resolution must be idempotent.

### Current blocker/evidence

The current signed-in repository still contains:

```ts
async resolveExpiredUnrecorded(): Promise<number> {
  return 0;
}
```

### Remaining work

- [ ] Implement authoritative automatic resolution.
- [ ] Add repository/application integration.
- [ ] Add idempotency tests.
- [ ] Add Recovery-counter regression tests.
- [ ] Add distinct history presentation.

---

## Task 15 — Implement the Signed-in Supabase Repository Adapter Contract

**Status:** 🟡 **Partially implemented**

### Already present

`src/lib/repositories/signed-in/supabase-product-repository.ts` contains substantial implementation for:

- habit creation
- habit redesign
- lifecycle updates
- habit listing
- habit detail
- session horizon generation
- Today reads
- weekly overview
- record check-in
- edit check-in entry point

### Remaining work

- [ ] Complete draft methods.
- [ ] Complete expired-Unrecorded resolution.
- [ ] Confirm same-day edit/history behavior.
- [ ] Add/restore Plan 04 adapter contract tests.
- [ ] Verify database/RLS/generated-type gates.

---

## Task 16 — Add Accessibility and End-to-End Coverage for the Guest Core Loop

**Status:** 🔁 **Rewrite required**

### Why the original task is obsolete

The original E2E plan assumes:

- entering Guest mode;
- Guest active-habit limits;
- Guest canonical IndexedDB data.

Those assumptions conflict with Plan 03A.

### Replace Task 16 with

**Authenticated Free/Lite/Premium Core-Loop Accessibility and E2E Coverage**

### New required scenarios

- [ ] Authenticated Free account creates a custom habit.
- [ ] Habit appears in Today.
- [ ] Record Minimum.
- [ ] Reload and confirm persistence.
- [ ] Edit same-day result to Full.
- [ ] Verify immutable history.
- [ ] Verify Free sixth-active-habit limit behavior.
- [ ] Verify Lite and Premium limits where required.
- [ ] Verify draft recovery.
- [ ] Verify mobile 390 px behavior.
- [ ] Verify keyboard/focus/zoom/target-size/accessibility expectations.

---

## Task 17 — Run the Plan 04 Quality Gate and Record the Handoff

**Status:** ❌ **Not finished**

Plan 04 must not be marked complete until all applicable tasks above are complete and freshly verified.

### Required final gate

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] Plan 04 focused suites
- [ ] unit tests
- [ ] component tests
- [ ] integration tests
- [ ] accessibility tests
- [ ] E2E tests
- [ ] visual tests
- [ ] production build
- [ ] Supabase reset
- [ ] database tests
- [ ] generated database-type check
- [ ] Supabase database lint
- [ ] repository policy checks
- [ ] clean-checkout verification
- [ ] clean working tree
- [ ] update master roadmap only after fresh evidence passes

---

# Recommended Execution Order

1. Rewrite stale Guest requirements for authenticated account ownership.
2. Finish Task 1 — dependencies and focused test commands.
3. Finish Task 3 — template catalog.
4. Finish Task 4 — habit form contracts.
5. Rewrite and execute Task 5 — account-owned Dexie cache/drafts/pending operations.
6. Finish Task 6 — deterministic session generation.
7. Finish Task 7 — habit draft and creation services.
8. Finish Task 8 — five-step creation wizard.
9. Finish Task 9 — list/detail/version/history.
10. Finish Task 10 — Today read model.
11. Finish Task 11 — Today UI states.
12. Finish Task 12 — Full/Minimum/Skipped check-ins.
13. Finish Task 13 — same-day edits and immutable history.
14. Finish Task 14 — three-day Automatic Skipped resolution.
15. Finish Task 15 — signed-in Supabase adapter.
16. Rewrite and execute Task 16 — authenticated accessibility/E2E.
17. Execute Task 17 — full Plan 04 quality gate.

---

# Completion Decision

**Current decision:** ❌ **Plan 04 is NOT verified complete.**

Do **not** start Plan 05 as a verified dependent phase until the amended Plan 04 requirements have passed the final quality gate.

---

## Historical Note

- PR #5 implemented a draft Plan 04 core loop but explicitly remained unverified.
- PR #6 reverted PR #5 and restored the repository tree to the earlier `main` state.
- This audit therefore evaluates current `main`, not the reverted PR #5 branch state.
