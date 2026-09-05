# Privacy Storage Description Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the authenticated settings page accurately describe where habit data is stored without implying application-provided encryption.

**Architecture:** Keep storage behavior unchanged and correct only the user-facing settings description. The component test locks the wording to the signed-in Supabase path and browser-local limitation.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, React Testing Library.

---

### Task 1: Add the privacy copy regression test

**Files:**
- Modify: `src/app/(app)/app/settings/page.tsx`
- Test: `tests/component/settings-page.test.tsx`

- [x] **Step 1: Write the failing component test**

Render the settings page and assert that its privacy section explains Supabase-backed signed-in data, browser-local records staying on the device, and the absence of application-provided encryption. Assert the old “all habit details are stored locally with ... encryption” claim is absent.

- [x] **Step 2: Run the focused test and confirm RED**

```bash
pnpm exec vitest run tests/component/settings-page.test.tsx
```

Expected: the new wording assertions fail against the existing inaccurate copy.

Verification: the focused test failed on the old settings text as expected.

### Task 2: Correct the settings description

- [x] **Step 1: Replace only the inaccurate privacy paragraph**

Use the approved wording from the design: signed-in habit details sync to Supabase; browser-local records remain on the current device; browser-local records are not encrypted by the application.

- [x] **Step 2: Run focused and affected checks**

```bash
pnpm exec vitest run tests/component/settings-page.test.tsx tests/component/account-tier-presentation.test.tsx tests/component/sidebar.test.tsx
pnpm format:check
pnpm lint
pnpm typecheck
```

Expected: all tests and static checks pass.

Verification: the focused test passed, the affected component suite passed 9 tests, and formatting, lint, typecheck, and diff checks passed.

### Task 3: Verify and commit

- [x] **Step 1: Run the complete application verification**

```bash
pnpm verify
```

Expected: the full Vitest suite, repository checks, and production build pass.

Verification: `pnpm verify` passed with 88 test files, 351 tests, repository policy checks, and `next build`.

- [x] **Step 2: Review, mark the plan, and commit**

Run `git diff --check`, review the staged diff for Task 11 scope, mark completed checkboxes only after verification succeeds, then commit:

```bash
git add docs/superpowers/specs/2026-09-05-privacy-storage-description-design.md docs/superpowers/plans/2026-09-05-privacy-storage-description.md 'src/app/(app)/app/settings/page.tsx' tests/component/settings-page.test.tsx
git diff --cached --check
git commit -m "fix: describe account and browser data storage accurately"
```
