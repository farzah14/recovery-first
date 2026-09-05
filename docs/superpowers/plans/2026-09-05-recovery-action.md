# Recovery Action Honesty Implementation Plan

> **For agentic workers:** Execute this plan sequentially. Complete each checkbox only after its fresh verification command passes.

**Goal:** Stop the Today recovery dialog from claiming that a target changed when no persisted recovery mutation exists.

**Decision:** The current repository has no authorized recovery-plan/recommendation command. Until that command is implemented, expose the limitation explicitly and keep the action disabled. The dialog must never report a successful target change without a durable response.

**Tech Stack:** React, TypeScript, Vitest, Testing Library.

### Task 1: Add a regression test

**Files:**
- Modify: `tests/component/today-dashboard-page.test.tsx`

- [x] **Step 1: Write the failing test**

Open the review dialog and assert that the target-switch action is explicitly unavailable and disabled, with no success message.

- [x] **Step 2: Run the focused test**

```bash
pnpm exec vitest run tests/component/today-dashboard-page.test.tsx
```

Expected: the new test fails because the current button is enabled and claims success.

### Task 2: Make the UI honest

**Files:**
- Modify: `src/features/today/today-dashboard.tsx`

- [x] **Step 1: Explain the unavailable capability**

Tell the user that target switching is not available until a persisted recovery plan is connected, and disable the action.

- [x] **Step 2: Run focused verification**

```bash
pnpm exec vitest run tests/component/today-dashboard-page.test.tsx
pnpm typecheck
pnpm lint
```

### Task 3: Run the quality gate and commit

- [x] **Step 1: Run `pnpm verify`**
- [x] **Step 2: Run `git diff --check` and commit**

```bash
git add docs/superpowers/plans/2026-09-05-recovery-action.md src/features/today/today-dashboard.tsx tests/component/today-dashboard-page.test.tsx
git commit -m "fix: make recovery target action honest"
```
