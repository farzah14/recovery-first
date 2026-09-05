# Reflection Note Persistence Implementation Plan

> **For agentic workers:** Execute this plan sequentially. Complete each checkbox only after its fresh verification command passes.

**Goal:** Persist Today reflection notes per signed-in account and local calendar date, while keeping the local-only fallback explicit for unauthenticated users.

**Architecture:** Add an RLS-protected `reflection_notes` table keyed by `(user_id, local_date)`. The signed-in repository reads and upserts that row; the guest UI uses a date-scoped browser-local key. The UI updates its state only after the selected persistence operation succeeds.

**Tech Stack:** PostgreSQL/Supabase, generated-style TypeScript database types, React, Vitest, Testing Library.

### Task 1: Add failing repository and UI regression tests

**Files:**
- Modify: `tests/unit/repositories/supabase-product-repository.test.ts`
- Modify: `tests/component/today-dashboard-page.test.tsx`

- [x] **Step 1: Write the failing tests**

Assert that the Supabase adapter reads and upserts a note for one owner/date, and that a guest note survives a dashboard remount from the browser-local fallback.

- [x] **Step 2: Run the focused tests before implementation**

```bash
pnpm exec vitest run tests/unit/repositories/supabase-product-repository.test.ts tests/component/today-dashboard-page.test.tsx
```

Expected: the new adapter method test fails because the repository contract and storage path do not exist; the remount test fails because React state is currently the only source.

### Task 2: Add the account-backed persistence path

**Files:**
- Create: `supabase/migrations/20260905040000_reflection_notes.sql`
- Create: `supabase/tests/00046_reflection_notes.test.sql`
- Modify: `supabase/tests/00020_constraints.test.sql`
- Modify: `supabase/tests/00040_row_level_security.test.sql`
- Modify: `src/lib/supabase/database.types.ts`
- Modify: `src/lib/repositories/product-repository.ts`
- Modify: `src/lib/repositories/signed-in/supabase-product-repository.ts`

- [x] **Step 1: Create the owner-scoped table and RLS policies**
- [x] **Step 2: Expose typed repository read/write methods**
- [x] **Step 3: Run the focused adapter test and SQL test**

### Task 3: Connect Today and verify

**Files:**
- Modify: `src/features/today/today-dashboard.tsx`

- [x] **Step 1: Load by local date and save only after persistence succeeds**
- [x] **Step 2: Run focused Vitest, typecheck, lint, and formatting checks**
- [x] **Step 3: Reset the database and run the complete SQL suite**
- [x] **Step 4: Run `pnpm verify`**
- [x] **Step 5: Run `git diff --check` and commit**

```bash
git add docs/superpowers/plans/2026-09-05-reflection-notes.md supabase/migrations/20260905040000_reflection_notes.sql supabase/tests/00020_constraints.test.sql supabase/tests/00040_row_level_security.test.sql supabase/tests/00046_reflection_notes.test.sql src/lib/supabase/database.types.ts src/lib/repositories/product-repository.ts src/lib/repositories/signed-in/supabase-product-repository.ts src/features/today/today-dashboard.tsx tests/unit/repositories/supabase-product-repository.test.ts tests/component/today-dashboard-page.test.tsx
git commit -m "fix: persist reflection notes by account date"
```
