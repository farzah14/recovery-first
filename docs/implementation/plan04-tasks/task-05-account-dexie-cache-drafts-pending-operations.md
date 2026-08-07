# Plan 04 / Task 05 — Account-Owned Dexie Cache, Drafts, and Pending Operations

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

> This task replaces the obsolete Guest Dexie repository task from the original Plan 04 text.

## Objective

Provide authenticated-account browser persistence for cache records, habit drafts, command results, and pending operations without treating Dexie as canonical account storage.

## Architecture Rules

- Supabase remains canonical for authenticated account data.
- Dexie stores account cache, drafts, command results, and pending operations only.
- All records are scoped by authenticated `ownerId`.
- No new Guest-owned core-loop records may be created.
- Legacy browser-local records remain isolated until explicit recovery/transfer acknowledgement.

## Files

- Modify: `src/lib/indexed-db/database.ts`
- Modify: `src/lib/indexed-db/migrations.ts`
- Modify: `src/lib/indexed-db/schema.ts`
- Modify: `src/lib/indexed-db/types.ts`
- Add/update account cache/draft repository adapter modules and tests.

## Steps

- [ ] Write migration and ownership tests first.
- [ ] Define versioned Dexie stores for account cache, drafts, command results, and pending operations.
- [ ] Scope every active record by `ownerId`.
- [ ] Implement draft save/read/delete transactions.
- [ ] Implement durable command-result lookup for idempotent client replay where applicable.
- [ ] Preserve legacy local stores without silently reassigning ownership.
- [ ] Verify migrations are non-destructive.

## Verification

```bash
pnpm test:indexed-db
pnpm test:habits
pnpm typecheck
pnpm lint
```

## Completion Gate

- [ ] Account data is owner-scoped.
- [ ] Draft persistence works across reloads.
- [ ] No Guest canonical writes exist.
- [ ] Legacy local data remains isolated.
- [ ] Migration/idempotency tests pass.
