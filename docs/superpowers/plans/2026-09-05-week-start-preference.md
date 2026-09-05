# Week-Start Preference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every weekly range and Weekly Overview honor the signed-in account's persisted weekday week-start preference.

**Architecture:** Normalize the existing `profiles.week_start` value into account context, pass it to the date and repository boundaries, and derive the shell's day labels from the resulting dates. Missing or invalid values fall back to Monday so existing accounts retain current behavior.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase, Vitest, React Testing Library.

---

### Task 1: Extend the account and date contracts

**Files:**
- Modify: `src/lib/auth/account-context.ts`
- Modify: `src/components/account/account-state.tsx`
- Modify: `src/lib/dates/local-week.ts`
- Test: `tests/unit/auth/account-context.test.ts` (create if absent)
- Test: `tests/unit/dates/local-week.test.ts`

- [x] **Step 1: Write failing tests**

Add account-context cases showing `week_start: 7` maps to `weekStart: 7`, missing profile data maps to `1`, and an invalid value maps to `1`. Add date cases showing `getLocalWeekRange('2026-08-06', 7)` returns Sunday 2026-08-02 through Saturday 2026-08-08 while the existing Monday case remains unchanged.

- [x] **Step 2: Run the focused tests and confirm the expected RED**

```bash
pnpm exec vitest run tests/unit/auth/account-context.test.ts tests/unit/dates/local-week.test.ts
```

Expected: the new account assertion fails because `weekStart` is absent, and the Sunday range assertion fails because `getLocalWeekRange` is Monday-only.

- [x] **Step 3: Implement the normalized contracts**

Define `WeekStartDay = 1 | 2 | 3 | 4 | 5 | 6 | 7`, add `weekStart` to `AccountContext` and `AccountState`, and normalize profile input with `profile?.week_start` when it is in the `1–7` range, otherwise `1`. Change `getLocalWeekRange(localDate, weekStart = 1)` to subtract `(day - weekStart + 7) % 7` and return seven dates.

- [x] **Step 4: Run the focused tests and typecheck**

```bash
pnpm exec vitest run tests/unit/auth/account-context.test.ts tests/unit/dates/local-week.test.ts
pnpm typecheck
```

Expected: all focused tests pass and TypeScript reports no errors.

### Task 2: Load and pass the saved preference through application data reads

**Files:**
- Modify: `src/app/(app)/app/layout.tsx`
- Modify: `src/app/(app)/onboarding/layout.tsx`
- Modify: `src/lib/repositories/product-repository.ts`
- Modify: `src/lib/repositories/signed-in/supabase-product-repository.ts`
- Modify: `src/features/today/today-dashboard.tsx`
- Modify: `src/features/habits/habits-management.tsx`
- Modify: `src/components/layout/app-shell.tsx`
- Test: `tests/unit/repositories/supabase-product-repository.test.ts`
- Test: `tests/component/weekly-overview.test.tsx`

- [x] **Step 1: Write failing repository and shell tests**

Add a repository test that calls `getWeeklyOverview(owner, '2026-08-06', 7)` and asserts the sessions query uses `2026-08-02` and `2026-08-08`. Add an AppShell test with an account whose `weekStart` is `7` and a Thursday reference date; assert the first row is Sunday and the last row is Saturday. Keep a Saturday (`6`) account covered by the date-range unit test to prove all persisted weekdays are supported.

- [x] **Step 2: Run affected tests and confirm RED**

```bash
pnpm exec vitest run tests/unit/repositories/supabase-product-repository.test.ts tests/component/weekly-overview.test.tsx
```

Expected: the repository call does not accept the third argument yet and the shell still renders Monday-first ordering.

- [x] **Step 3: Implement data propagation**

Select `week_start` in both authenticated layouts. Add an optional `weekStart` argument to `ProductRepository.getWeeklyOverview`, pass it into `getLocalWeekRange`, and update Today and Habits to call it with `account.weekStart`. Use the same preference when Today and Habits calculate their session horizon. Give AppShell a `weekStart` prop defaulting to `1`, build fallback dates with `getLocalWeekRange`, and derive each row's weekday label from its `localDate`.

- [x] **Step 4: Run affected tests and typecheck**

```bash
pnpm exec vitest run tests/unit/repositories/supabase-product-repository.test.ts tests/component/weekly-overview.test.tsx tests/unit/auth/account-context.test.ts tests/unit/dates/local-week.test.ts
pnpm typecheck
```

Expected: all affected tests pass and TypeScript reports no errors.

### Task 3: Verify the complete change

**Files:**
- Modify: `docs/superpowers/plans/2026-09-05-week-start-preference.md`

- [x] **Step 1: Run formatting and lint checks**

```bash
pnpm format:check
pnpm lint
```

Expected: both commands pass.

Verification: `pnpm format:check` and `pnpm lint` passed with no errors or warnings.

- [x] **Step 2: Run the complete application verification**

```bash
pnpm verify
```

Expected: the full Vitest suite, repository checks, and production build pass.

Verification: `pnpm verify` passed with 87 test files, 356 tests, repository policy checks, and `next build`.

- [x] **Step 3: Run the database suite**

```bash
pnpm db:test
```

Expected: all Supabase migrations and pgTAP tests pass; no migration is required because `profiles.week_start` already exists.

Verification: GitHub Actions `Supabase database` passed all migration and pgTAP checks. The local command could not connect because no local Supabase/Postgres instance is running; Docker is not installed in this environment.

- [x] **Step 4: Run the browser smoke suite if the shell layout changes snapshots**

```bash
pnpm test:e2e
```

Expected: browser smoke tests pass with no unexplained visual changes.

Verification: GitHub Actions `Browser smoke tests` passed with the hosted Supabase and browser environment. The local command could not run authenticated cases because the required Supabase environment variables are absent.

- [x] **Step 5: Review, mark the plan, and commit**

Run `git diff --check`, mark completed checkboxes only after their commands pass, then commit:

```bash
git add docs/superpowers/specs/2026-09-05-week-start-preference-design.md docs/superpowers/plans/2026-09-05-week-start-preference.md src/lib/auth/account-context.ts src/components/account/account-state.tsx src/lib/dates/local-week.ts 'src/app/(app)/app/layout.tsx' 'src/app/(app)/onboarding/layout.tsx' src/lib/repositories/product-repository.ts src/lib/repositories/signed-in/supabase-product-repository.ts src/features/today/today-dashboard.tsx src/features/habits/habits-management.tsx src/components/layout/app-shell.tsx tests/unit/auth/account-context.test.ts tests/unit/dates/local-week.test.ts tests/unit/repositories/supabase-product-repository.test.ts tests/component/weekly-overview.test.tsx
git diff --cached --check
git commit -m "fix: honor account week start preference"
```
