# Plan 04 / Task 08 — Route-Backed Habit Creation Wizard

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Build the authenticated five-step habit creation wizard using React Hook Form + Zod and Plan 04 application services.

## Files

- `src/features/habits/components/habit-wizard.tsx`
- `src/features/habits/components/habit-wizard-footer.tsx`
- `src/features/habits/components/leave-draft-dialog.tsx`
- `src/features/habits/components/active-limit-dialog.tsx`
- Habit creation route page
- `tests/features/habits/habit-wizard.test.tsx`
- `tests/features/habits/active-limit-dialog.test.tsx`

## Five Steps

1. Goal and name
2. Normal and Minimum
3. Schedule and cue
4. Optional reminder
5. Review and create

## Steps

- [ ] Write failing wizard tests first.
- [ ] Use one React Hook Form state across all steps.
- [ ] Validate step data with the Task 04 Zod schema.
- [ ] Preserve values when navigating backward/forward.
- [ ] Support template-derived and custom defaults.
- [ ] Save, restore, continue, and discard authenticated account drafts.
- [ ] Provide a non-destructive active-limit dialog for Free/Lite/Premium limits.
- [ ] Make sticky controls safe at mobile widths.
- [ ] Manage focus on step changes and validation errors.

## Verification

```bash
pnpm vitest run tests/features/habits/habit-wizard.test.tsx tests/features/habits/active-limit-dialog.test.tsx
pnpm test:habits
pnpm test:accessibility
pnpm typecheck
pnpm build
```

## Completion Gate

- [ ] All five steps are route-backed and functional.
- [ ] Draft recovery works after reload/navigation.
- [ ] Normal and Minimum are required.
- [ ] Active-limit resolution never destroys entered data.
- [ ] Keyboard/focus/mobile tests pass.
