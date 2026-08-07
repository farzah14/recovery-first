# Plan 04 / Task 15 — Signed-in Supabase Repository Adapter Contract

**Parent plan:** `docs/implementation/04-habits-sessions-checkins.md`

## Objective

Complete the authenticated Supabase adapter so every Plan 04 repository operation uses server-authoritative functions/views and respects account ownership, RLS, revisions, and idempotency.

## Files

- `src/lib/repositories/signed-in/supabase-product-repository.ts`
- `src/lib/repositories/signed-in/supabase-product-repository.test.ts`
- `tests/integration/signed-in-product-repository.test.ts`
- Related generated database types and SQL/RPC tests as required.

## Steps

- [ ] Write/restore failing adapter contract tests first.
- [ ] Complete habit create/redesign/lifecycle operations through authoritative RPCs.
- [ ] Complete list/detail/Today/weekly read mappings.
- [ ] Complete bounded session-horizon generation mapping.
- [ ] Complete account draft behavior required by the active repository contract, or delegate browser draft persistence through the correct account-Dexie boundary.
- [ ] Complete `resolveExpiredUnrecorded()` instead of returning a stub result.
- [ ] Implement record/edit check-in mappings with command IDs and expected revisions.
- [ ] Map database errors into typed repository errors.
- [ ] Confirm no browser service-role client exists.
- [ ] Verify RLS prevents cross-account reads/writes.

## Verification

```bash
pnpm vitest run src/lib/repositories/signed-in/supabase-product-repository.test.ts tests/integration/signed-in-product-repository.test.ts
pnpm db:reset
pnpm db:test
pnpm db:types:check
pnpm typecheck
pnpm lint
```

## Completion Gate

- [ ] All ProductRepository operations required by Plan 04 are implemented.
- [ ] No Plan 04 method remains a stub/no-op.
- [ ] RLS/account ownership tests pass.
- [ ] RPC/view mappings preserve domain invariants.
- [ ] Generated DB types are synchronized.
