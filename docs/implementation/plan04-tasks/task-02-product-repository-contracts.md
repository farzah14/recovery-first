# Plan 04 / Task 02 — Account-Neutral Product Repository Contracts

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Define the shared authenticated-account repository contract used by application services, Supabase, and Dexie-backed cache/draft/pending-operation adapters.

## Files

- `src/lib/repositories/product-repository.ts`
- `src/lib/repositories/repository-errors.ts`
- `src/lib/repositories/repository-provider.tsx`
- `tests/features/habits/product-repository-contract.test.ts`

## Steps

- [ ] Write/restore the failing repository contract test first.
- [ ] Ensure mutation commands use stable `commandId` values.
- [ ] Ensure check-in commands carry expected revision values.
- [ ] Keep owner information account-only: `identityMode: 'account'` and tier `free | lite | premium`.
- [ ] Define habit, session, Today, weekly overview, draft, check-in, and edit contracts behind one interface.
- [ ] Define typed repository errors for active limits, conflicts, stale revisions, closed edit windows, and unavailable repository operations.
- [ ] Add a provider that exposes the repository without leaking persistence details into React components.

## Verification

```bash
pnpm vitest run tests/features/habits/product-repository-contract.test.ts
pnpm typecheck
pnpm lint
```

## Completion Gate

- [ ] Contract test passes.
- [ ] No Guest ownership exists in the active product contract.
- [ ] Free/Lite/Premium ownership and limits can be represented.
- [ ] Read/write operations remain persistence-neutral.
- [ ] Typecheck and lint pass.
