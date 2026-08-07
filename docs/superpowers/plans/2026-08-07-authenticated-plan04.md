# Authenticated Plan 04 Amendment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking progress.

**Goal:** Finish Plan 04's authenticated account core loop in the existing `foundation/04-habits-sessions-checkins-next` worktree, with Supabase PostgreSQL as the canonical source and Free/Lite/Premium limits enforced authoritatively.

**Architecture:** Preserve the already-built deterministic domain services and reusable UI from the historical Plan 04 commits. Replace Guest-only route ownership and acceptance evidence with an account-owned repository provider that uses the authenticated Supabase client; Dexie remains limited to signed-in cache, drafts, and pending-operation durability. All invariant-changing account writes use transactional Supabase functions with RLS and idempotency.

**Tech Stack:** Next.js App Router, React, TypeScript strict mode, Supabase Auth/PostgreSQL, PostgreSQL migrations and pgTAP, Dexie, React Hook Form, Zod, Vitest, React Testing Library, Playwright, pnpm.

**Approved scope correction:** The user selected the authenticated-account revision on 2026-08-07. This amendment supersedes Guest-only execution steps in `docs/implementation/04-habits-sessions-checkins.md` for account-core-loop behavior. Historical Guest commits remain in this isolated branch as reusable domain/UI work, but no new account behavior may use Guest ownership, the Guest limit, or a browser-local canonical record.

---

## Task 1: Record the approved amendment and checkpoint

**Files:**

- Modify: `docs/implementation/04-habits-sessions-checkins.md`
- Modify: `docs/implementation/IMPLEMENTATION-PLAN.md` only if the active Plan 04 row needs the amendment reference
- Create: `docs/superpowers/plans/2026-08-07-authenticated-plan04.md`

- [x] **Step 1: Add the amendment to the active detailed plan**

State that account identity is required, Supabase is canonical, Dexie is cache/drafts/pending-only for signed-in users, and active limits are Free `5`, Lite `10`, Premium `30`.

- [x] **Step 2: Verify the worktree checkpoint**

Run `git status --short`, `git log --oneline -18`, and the Plan 04 checkbox count. Do not reset or discard existing dirty changes.

- [x] **Step 3: Commit only the documentation amendment**

Use `git add docs/implementation docs/superpowers/plans/2026-08-07-authenticated-plan04.md` and commit with `docs: amend plan 04 for authenticated account core loop` after the documentation check passes.

---

## Task 2: Implement authenticated same-day editing and immutable history

**Files:**

- Create: one immutable migration under `supabase/migrations/` for the edit function and any required indexes/privileges
- Modify: `src/lib/repositories/product-repository.ts`
- Modify: `src/lib/repositories/signed-in/supabase-product-repository.ts`
- Modify: `src/features/check-ins/application/edit-check-in.ts` only where the account contract requires it
- Modify: `src/features/today/components/today-page-client.tsx`
- Modify: `src/features/today/components/today-session-card.tsx`
- Create or modify: signed-in adapter and database tests

- [x] **Step 1: Write failing adapter and database tests**

Prove that an authenticated edit calls `edit_same_day_check_in` with the current check-in revision, rejects a stale revision, rejects edits after the session timezone's local-day cutoff, appends `check_in_history`, and updates only the current projection.

- [x] **Step 2: Run the focused tests and confirm the expected failure**

Run the adapter test and the focused Supabase database test. The failure must identify the missing RPC/behavior.

- [x] **Step 3: Add the transactional SQL function**

Lock the owner-scoped session and current check-in in a consistent order, validate `auth.uid()`, expected session/check-in revisions, same-day eligibility using the session timezone snapshot, friction rules, and idempotency, then append history and update the current projection atomically.

- [x] **Step 4: Wire the signed-in repository adapter**

Call the new RPC, map provider errors to `same_day_edit_closed`, `stale_revision`, `idempotency_conflict`, and `repository_unavailable`, and return authoritative IDs/revisions.

- [x] **Step 5: Run focused and regression checks**

Run the adapter tests, signed-in integration test, database reset/tests, typecheck, lint, and affected Today/check-in suites.

- [x] **Step 6: Commit the authenticated edit boundary**

Commit with `feat: support authenticated same day check in edits`.

---

## Task 3: Implement authenticated Automatic Skipped resolution

**Files:**

- Create: one immutable migration under `supabase/migrations/` for the owner-scoped resolution function and privileges
- Modify: `src/lib/repositories/signed-in/supabase-product-repository.ts`
- Modify: `src/features/sessions/application/resolve-expired-unrecorded.ts`
- Modify: account Today/Review entry points as required by the approved flow
- Create or modify: signed-in adapter and database tests

- [x] **Step 1: Write failing resolution tests**

Prove that only expired owner-scoped `unrecorded` sessions become `automatic_skipped`, the operation is idempotent, no Manual Skipped check-in or Recovery counter increment is created, and another user's sessions are denied.

- [x] **Step 2: Run the focused tests and confirm failure**

Run the focused database and adapter tests and capture the expected missing-function failure.

- [x] **Step 3: Add the authoritative SQL function**

Use a short transaction, lock eligible sessions deterministically, update status/source/revision, preserve timezone/version references, and return the count. Grant execution only to the approved server/authenticated boundary.

- [x] **Step 4: Wire and map the signed-in adapter**

Call the function, return the authoritative count, and map authorization and provider failures without exposing private details.

- [x] **Step 5: Run focused and regression checks**

Run database reset/tests, adapter tests, sessions/domain/Today tests, typecheck, and lint.

- [x] **Step 6: Commit Automatic Skipped resolution**

Commit with `feat: resolve authenticated expired sessions`.

---

## Task 4: Complete account-owned repository/UI wiring

**Files:**

- Modify: account application routes and repository provider boundaries
- Modify: Today and Habits client entry points so account owners use the signed-in repository and plan tier from verified profile/entitlement state
- Modify: account-compatible component tests
- Do not add new Guest canonical writes to account routes

- [x] **Step 1: Write failing account-boundary tests**

Prove that authenticated Today/Habits creation, reads, Full/Minimum/Skipped actions, edits, and resolution use Supabase; Guest repositories remain isolated; and active limits use the account plan tier.

- [x] **Step 2: Run the focused tests and confirm failure**

Run the account route/repository/component suites and capture the failing ownership or persistence assertions.

- [x] **Step 3: Implement the narrow provider boundary**

Select the repository from authenticated server/session context, keep browser-only Dexie access behind a client boundary, and preserve explicit pending/error states.

- [x] **Step 4: Run focused accessibility and regression checks**

Run Today/Habits/check-in/component/accessibility suites, typecheck, lint, and build.

- [x] **Step 5: Commit account-owned wiring**

Commit with `feat: wire authenticated plan 04 core loop`.

---

## Task 5: Replace Guest-only acceptance coverage and close the quality gate

**Files:**

- Modify: Plan 04 accessibility and E2E tests to exercise the authenticated account flow against local Supabase
- Modify: `docs/implementation/04-habits-sessions-checkins.md`
- Modify: `docs/implementation/IMPLEMENTATION-PLAN.md`

- [ ] **Step 1: Add authenticated accessibility and browser tests**

Cover Full, Minimum, Skipped friction, same-day edit, Automatic Skipped distinction, Free/Lite/Premium limit presentation, keyboard focus, mobile layout, and no color-only status.

Current evidence covers the action/friction/accessibility semantics, account Today/Habits reads, Free-limit presentation, mobile navigation, and the same-day/Automatic Skipped database and adapter contracts. Browser-level edit/resolution flows and complete tier-presentation coverage remain open.

- [ ] **Step 2: Run all Plan 04 verification commands**

Run formatting, lint, typecheck, unit/domain, component, integration, accessibility, E2E, visual, database reset/tests/types/lint, repository policy checks, and production build.

- [ ] **Step 3: Mark only freshly verified account acceptance items**

Update Plan 04 status to authenticated-account verified only when every required command succeeds and the worktree is clean.

- [ ] **Step 4: Commit the verified handoff**

Commit with `docs: record authenticated plan 04 verification`.

### Verification snapshot — 2026-08-07

- Finished: Tasks 1–4 and Task 5 Step 1. Commits are `385d2e2`, `2de96df`, `82c0610`, `0a14c4b`, and `fb81373`.
- Finished gates: local Supabase reset; pgTAP `98/98`; generated types; core-loop `59/59`; unit `128/128`; integration `7/7`; accessibility `9/9`; lint; strict typecheck; repository policy; environment-example check; env-configured production build; authenticated E2E `29 passed, 1 skipped`.
- Not finished: Task 5 Steps 2–4. `pnpm format:check` reports 38 pre-existing unformatted files, and the default full `pnpm test` reports 254 passed / 2 dashboard-component timeouts (the focused rerun passes with a 20-second timeout). The worktree also retains six unrelated pre-existing dirty files, so clean-checkout/clean-tree acceptance is not claimed.

---

## Verification and deviation rules

- Do not claim a hosted Supabase project, production credentials, DOKU, or authenticated external E2E readiness without live evidence.
- Do not mark historical Guest-only acceptance items as account completion.
- Do not edit merged migrations; all schema changes use new immutable migration files.
- Stop on a failing required check, preserve diagnostics, and report the blocker before continuing.
