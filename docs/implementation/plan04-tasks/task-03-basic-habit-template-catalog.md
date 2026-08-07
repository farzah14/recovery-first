# Plan 04 / Task 03 — Basic Habit Template Catalog

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Implement the deterministic starter habit catalog used by the habit creation flow.

## Files

- Create: `src/features/templates/catalog.ts`
- Create: `src/features/templates/template-card.tsx`
- Create: `src/features/templates/template-picker.tsx`
- Create: `tests/features/templates/catalog.test.ts`

## Steps

- [ ] Write failing catalog tests first.
- [ ] Define deterministic starter templates with stable IDs.
- [ ] Give every template distinct editable Normal and Minimum definitions.
- [ ] Include category, schedule/cue defaults, and descriptive metadata needed by the wizard.
- [ ] Build accessible template cards.
- [ ] Build search/filter selection behavior.
- [ ] Map a selected template into editable wizard defaults without making template data canonical user data.

## Verification

```bash
pnpm test:templates
pnpm typecheck
pnpm lint
```

## Completion Gate

- [ ] Catalog is deterministic.
- [ ] Normal and Minimum are both present and editable.
- [ ] Template selection is keyboard accessible.
- [ ] Search/filter tests pass.
- [ ] Typecheck and lint pass.
