# Weekly Overview and Habit Card Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Weekly Overview count only sessions belonging to active, non-deleted habits and remove duplicate `Check-in` actions from Habits Library cards while keeping Today’s `Full`, `Min`, and `Skip` controls.

**Architecture:** Keep historical sessions in Supabase. At read time, resolve the authenticated owner’s active, non-deleted habit IDs and constrain the weekly session query to those IDs. Keep the existing habit detail/check-in implementation intact, but remove only the list-card action that duplicates Today’s outcome controls.

**Tech Stack:** Next.js, React, TypeScript, Supabase query builder, Vitest, Testing Library, Playwright visual snapshots.

---

### Task 1: Prove Weekly Overview excludes stale habit sessions

**Files:**
- Modify: `tests/unit/repositories/supabase-product-repository.test.ts`
- Test target: `SupabaseProductRepository.getWeeklyOverview`

- [ ] **Step 1: Add a failing test fixture with active and stale habits**

Add `habits` rows for one active non-deleted habit and one paused/deleted habit. Add sessions for both IDs on the same week, and assert only the active habit’s rows contribute to `totalCount` and `completedCount`.

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run `pnpm exec vitest run tests/unit/repositories/supabase-product-repository.test.ts -t "active, non-deleted habits"`. It must fail because the current implementation queries all owner sessions without an active-habit filter.

### Task 2: Filter the repository query at the data boundary

**Files:**
- Modify: `src/lib/repositories/signed-in/supabase-product-repository.ts:494-530`

- [ ] **Step 1: Resolve active habit IDs before reading weekly sessions**

Use the existing `activeLifecycleStates` list and the owner scope:

```ts
const { data: activeHabits, error: habitsError } = await client
  .from('habits')
  .select('id')
  .eq('user_id', owner.ownerId)
  .in('lifecycle_state', [...activeLifecycleStates])
  .is('deleted_at', null);
if (habitsError) throw mapError(habitsError);
const activeHabitIds = (activeHabits ?? []).map((habit) => habit.id);
```

- [ ] **Step 2: Constrain the session query and handle no active habits**

Return the existing zero-filled Monday-to-Sunday overview without querying sessions when `activeHabitIds` is empty. Otherwise select `habit_id,scheduled_local_date,status` and add `.in('habit_id', activeHabitIds)` alongside the existing owner/date filters.

- [ ] **Step 3: Run the repository test and verify it passes**

Run `pnpm exec vitest run tests/unit/repositories/supabase-product-repository.test.ts -t "active, non-deleted habits"` and the full repository test file. Both must pass.

### Task 3: Prove Habits Library cards no longer expose duplicate Check-in actions

**Files:**
- Modify: `tests/component/habits-management-page.test.tsx`

- [ ] **Step 1: Add the list-view assertion before changing the component**

In the existing list rendering test, assert:

```ts
expect(screen.queryByRole('button', { name: /^Check-in$/i })).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the focused component test and verify the expected failure**

Run `pnpm exec vitest run tests/component/habits-management-page.test.tsx -t "no duplicate Check-in"`. It must fail while the active card still renders its `Check-in` button.

### Task 4: Remove only the duplicate card action

**Files:**
- Modify: `src/features/habits/habits-management.tsx:1073-1105`

- [ ] **Step 1: Remove the active-card `Check-in` Button block**

Delete the `Button` whose click handler sets `selectedHabitId` and opens `checkInDialogOpen`. Keep `View Details`, pause/resume, the detail view, and the existing check-in dialog code. Today remains the single list-level place for `Full`, `Min`, and `Skip` session outcomes.

- [ ] **Step 2: Run focused component tests and verify they pass**

Run `pnpm exec vitest run tests/component/habits-management-page.test.tsx -t "no duplicate Check-in|navigates to Habit Detail"` and the full component file. All selected tests must pass.

### Task 5: Verify, refresh visual snapshots if required, and publish the branch

**Files:**
- Verify: `src/lib/repositories/signed-in/supabase-product-repository.ts`
- Verify: `src/features/habits/habits-management.tsx`
- Verify: `tests/unit/repositories/supabase-product-repository.test.ts`
- Verify: `tests/component/habits-management-page.test.tsx`

- [ ] **Step 1: Run focused and static gates**

Run the repository tests, component tests, `pnpm exec prettier --check` on changed files, `pnpm exec eslint .`, and `pnpm exec tsc --noEmit`. Fix only regressions caused by this change.

- [ ] **Step 2: Push the implementation branch**

Commit the source and test changes with `fix: scope weekly overview to active habits` and push `feat/supabase-today-habits`.

- [ ] **Step 3: Refresh Linux visual baselines only if CI reports a visual diff**

If the Habits Library snapshot changes as expected, run the repository’s visual-baseline workflow dispatch, copy the generated Linux snapshots into `tests/e2e/visual-baselines.spec.ts-snapshots`, commit them separately as `test: refresh Supabase visual baselines`, and push.

- [ ] **Step 4: Confirm the PR checks**

Verify Application quality, Supabase database, and Browser smoke tests are green before reporting completion. `main` must remain unchanged.
