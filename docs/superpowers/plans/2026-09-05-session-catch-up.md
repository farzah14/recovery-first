# Session Horizon Catch-Up Implementation Plan

> **For agentic workers:** Execute this plan sequentially in the current worktree. Complete each checkbox only after its fresh verification command passes.

**Goal:** Resume signed-in session generation from the latest persisted session so missed dates are backfilled when a user returns after the prior rolling horizon.

**Architecture:** Treat the latest existing session date for each active habit/version as the durable generation cursor. Generate only scheduled dates after that cursor through the requested horizon, while retaining the existing deterministic `ensure_session` RPC for duplicate-safe writes. A habit with no sessions starts at its immutable version start date.

**Tech Stack:** TypeScript, Supabase PostgREST/RPC adapter, Vitest.

---

### Task 1: Add a failing catch-up regression test

**Files:**
- Modify: `tests/unit/repositories/supabase-product-repository.test.ts`

- [x] **Step 1: Write the failing test**

Create a daily active habit whose current version started before today and whose latest persisted session is two days behind the requested horizon. Assert that `ensureSessionHorizon` calls `ensure_session` for the missing dates through the horizon, including the first date after the persisted cursor.

- [x] **Step 2: Run the focused test**

```bash
pnpm exec vitest run tests/unit/repositories/supabase-product-repository.test.ts
```

Expected: the new test fails because the current implementation starts at today and skips the gap.

### Task 2: Use the latest persisted session as the cursor

**Files:**
- Modify: `src/lib/repositories/signed-in/supabase-product-repository.ts`

- [x] **Step 1: Query the owner-scoped current-version sessions**

For each active habit, load its existing `scheduled_local_date` values for the current version through `throughLocalDate`. Throw mapped repository errors from this read.

- [x] **Step 2: Calculate the catch-up start date**

Use the day after the latest persisted date when one exists; otherwise use the version’s `startLocalDate`. Never move before the immutable version start date.

- [x] **Step 3: Keep generation deterministic and duplicate-safe**

Run the existing recurrence filter and `ensure_session` RPC for dates from the cursor through `throughLocalDate`. Existing sessions remain untouched because the database identity constraint and RPC are already idempotent.

- [x] **Step 4: Run focused verification**

```bash
pnpm exec vitest run tests/unit/repositories/supabase-product-repository.test.ts
pnpm typecheck
pnpm lint
```

### Task 3: Run the complete quality gate and commit

**Files:**
- Verify all changed files and the existing SQL/application test suites.

- [x] **Step 1: Run the full application verifier**

```bash
pnpm verify
```

Expected: all formatting, lint, type, test, repository, and build checks pass.

- [x] **Step 2: Commit the catch-up fix**

```bash
git diff --check
git add docs/superpowers/plans/2026-09-05-session-catch-up.md src/lib/repositories/signed-in/supabase-product-repository.ts tests/unit/repositories/supabase-product-repository.test.ts
git commit -m "fix: catch up missed session dates"
```
