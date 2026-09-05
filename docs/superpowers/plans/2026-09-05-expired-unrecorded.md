# Expired Unrecorded Session Resolution Implementation Plan

> **For agentic workers:** Execute this plan sequentially in the current worktree. Each checkbox is completed only after its fresh verification command passes.

**Goal:** Resolve overdue unrecorded sessions into locked Automatic Skipped sessions through an authorized, idempotent Supabase operation before signed-in Today and Habits reads.

**Architecture:** Add a security-definer PostgreSQL function that uses the database statement timestamp, updates only the authenticated owner’s overdue `unrecorded` sessions, records `status_source = system`, and writes one audit event per transition with the automatic-classification reason. The signed-in repository calls this RPC, and both signed-in read loaders invoke it before loading current data.

**Tech Stack:** PostgreSQL/Supabase migrations and pgTAP, TypeScript, Supabase RPC adapter, React effects, Vitest.

---

### Task 1: Add the failing database regression test

**Files:**
- Create: `supabase/tests/00045_unrecorded_resolution.test.sql`

- [x] **Step 1: Write the failing test**

Create deterministic owner-scoped sessions covering an overdue unrecorded row, an in-window unrecorded row, and an already-resolved row. Assert that the resolution operation changes only the overdue row, creates no check-in row, keeps the habit’s manual-skip counter unchanged, records the automatic source and reason, and returns zero on a repeat call.

- [x] **Step 2: Run the focused test before the implementation**

Run the test against the current migrated database:

```bash
psql -v ON_ERROR_STOP=1 -d recovery_windows_final -f supabase/tests/00045_unrecorded_resolution.test.sql
```

Expected: the test cannot execute because `public.resolve_expired_unrecorded` does not yet exist, proving the missing database operation.

### Task 2: Implement the server-authoritative expiration RPC

**Files:**
- Create: `supabase/migrations/20260905030000_resolve_expired_unrecorded.sql`
- Modify: `src/lib/supabase/database.types.ts`

- [x] **Step 1: Add the immutable migration**

Create `public.resolve_expired_unrecorded(p_now timestamptz)` as a security-definer function. Require `auth.uid()`, use `statement_timestamp()` as the effective time, update only rows owned by that user whose status is `unrecorded` and whose `resolution_due_at` has passed, set `status_source` to `system`, increment `revision`, and insert an audit event with `reason = not_recorded_within_three_days`. Return the number of transitioned sessions. Revoke public/anonymous execution and grant execution only to `authenticated`.

- [x] **Step 2: Update generated database types**

Add the RPC argument and integer return type to `Database['public']['Functions']` so the typed Supabase client accepts the adapter call.

- [x] **Step 3: Run the focused SQL test**

Apply the new migration to a clean local database and run:

```bash
psql -v ON_ERROR_STOP=1 -d recovery_windows_final -f supabase/tests/00045_unrecorded_resolution.test.sql
```

Expected: all assertions pass, including ownership, no check-in insertion, audit metadata, counter preservation, and idempotent replay.

### Task 3: Connect the repository and read paths

**Files:**
- Modify: `src/lib/repositories/signed-in/supabase-product-repository.ts`
- Modify: `src/features/today/today-dashboard.tsx`
- Modify: `src/features/habits/habits-management.tsx`
- Modify: `tests/unit/repositories/supabase-product-repository.test.ts`

- [x] **Step 1: Add the failing adapter test**

Assert that `resolveExpiredUnrecorded(owner, now)` calls the typed `resolve_expired_unrecorded` RPC with `p_now`, returns the integer count, and maps Supabase errors through the repository error mapper.

- [x] **Step 2: Implement the adapter method**

Call the RPC after owner validation and return the numeric result, mapping missing or malformed data to zero only when the RPC itself succeeds without a value.

- [x] **Step 3: Invoke resolution before signed-in reads**

In both read loaders, call `resolveExpiredUnrecorded(owner, new Date().toISOString())` before session horizon generation and before querying Today or the habit list. A repeat load must be safe because the SQL operation filters on `unrecorded`.

- [x] **Step 4: Run focused TypeScript tests**

```bash
pnpm exec vitest run tests/unit/repositories/supabase-product-repository.test.ts
pnpm typecheck
pnpm lint
```

Expected: all focused tests and static checks pass.

### Task 4: Run the complete quality gate and commit

**Files:**
- Verify all files above and the existing migration/test chain.

- [x] **Step 1: Run all SQL tests**

Run every `supabase/tests/*.sql` file against the clean migrated database; expected result is 15 files and 176 passing assertions.

- [x] **Step 2: Run the application verifier**

```bash
pnpm verify
```

Expected: formatting, ESLint, TypeScript, all Vitest tests, repository checks, and the production build pass.

- [x] **Step 3: Review and commit**

```bash
git diff --check
git status --short
git add supabase/migrations/20260905030000_resolve_expired_unrecorded.sql supabase/tests/00045_unrecorded_resolution.test.sql src/lib/supabase/database.types.ts src/lib/repositories/signed-in/supabase-product-repository.ts src/features/today/today-dashboard.tsx src/features/habits/habits-management.tsx tests/unit/repositories/supabase-product-repository.test.ts
git commit -m "fix: resolve expired unrecorded sessions"
```
