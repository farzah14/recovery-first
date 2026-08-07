# Plan 04 / Task 16 — Authenticated Core-Loop Accessibility and E2E Coverage

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

> This task replaces the obsolete Guest core-loop accessibility/E2E task from the original Plan 04 text.

## Objective

Verify the Plan 04 core loop end to end for authenticated Free/Lite/Premium accounts across desktop and mobile accessibility-critical paths.

## Files

- `tests/accessibility/account-core-loop.accessibility.test.tsx`
- `tests/e2e/account-core-loop.spec.ts`
- Supporting authenticated test fixtures/helpers as required.

## Required Scenarios

- [ ] Authenticated Free account creates a custom habit.
- [ ] Newly active habit appears in Today when eligible.
- [ ] User records Minimum and reloads; result persists.
- [ ] User edits the same-day result to Full.
- [ ] Immutable prior history remains visible/retained.
- [ ] Free sixth-active-habit attempt triggers non-destructive limit handling.
- [ ] Lite and Premium account limits are covered where fixture support exists.
- [ ] Draft save/reload/continue/discard behavior is covered.
- [ ] Full, Minimum, and Skipped are keyboard reachable.
- [ ] Automatic Skipped is never exposed as a user action.
- [ ] 390 px mobile layout is usable without clipped critical actions.
- [ ] Focus order, labels, dialogs, target sizes, zoom, and reduced motion meet repository accessibility requirements.

## Architecture Rules

- No Guest entry/setup path.
- No Guest canonical IndexedDB assumptions.
- Tests authenticate an account and use Free/Lite/Premium ownership.
- Supabase remains canonical; Dexie is cache/draft/pending-operation support only.

## Verification

```bash
pnpm test:accessibility
pnpm test:e2e
pnpm test:visual
pnpm build
```

## Completion Gate

- [ ] Authenticated core-loop E2E passes on required desktop viewport.
- [ ] Mobile 390 px core-loop coverage passes.
- [ ] Accessibility suite passes.
- [ ] Draft recovery and tier-limit paths are covered.
- [ ] No Guest runtime dependency remains in Plan 04 E2E coverage.
