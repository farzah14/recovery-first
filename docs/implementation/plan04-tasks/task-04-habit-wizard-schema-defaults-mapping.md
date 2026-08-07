# Plan 04 / Task 04 — Habit Wizard Schema, Defaults, and Mapping

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Define the validated form contract for the five-step habit creation wizard and map form data into account-owned repository commands.

## Files

- `src/features/habits/forms/habit-form-schema.ts`
- `src/features/habits/forms/habit-form-types.ts`
- `src/features/habits/forms/habit-form-defaults.ts`
- `src/features/habits/mappers/habit-form-mapper.ts`
- `tests/features/habits/habit-form-schema.test.ts`

## Steps

- [ ] Write failing validation and mapping tests first.
- [ ] Define the Zod schema for goal/name, Normal, Minimum, recurrence, cue, reminder intent, start date, and activation intent.
- [ ] Infer strict TypeScript form types from the schema.
- [ ] Define deterministic blank and template-derived defaults.
- [ ] Map form data to `CreateHabitCommand` using authenticated account ownership.
- [ ] Generate stable IDs at the application boundary, not inside presentation components.
- [ ] Reject invalid Normal/Minimum and recurrence combinations.

## Verification

```bash
pnpm vitest run tests/features/habits/habit-form-schema.test.ts
pnpm test:habits
pnpm typecheck
pnpm lint
```

## Completion Gate

- [ ] Schema covers all five wizard steps.
- [ ] Defaults are deterministic.
- [ ] Mapper produces account-owned commands.
- [ ] No Guest ownership is emitted.
- [ ] Tests, typecheck, and lint pass.
