# Database Development

## Start and reset

```bash
pnpm db:start
pnpm db:reset
```

## Run database tests

```bash
pnpm db:test
```

## Regenerate TypeScript types

```bash
pnpm db:types:write
pnpm db:types:check
```

## Stop local services

```bash
pnpm db:stop
```

## Migration rules

- Never edit a migration already shared or applied outside a disposable local database.
- Add a new timestamped migration for every schema change.
- Keep browser-accessible tables in `public` with RLS enabled.
- Keep payment payloads, idempotency records, and audit details in `private`.
- Use synthetic `.invalid` email addresses and fixed UUIDs in fixtures.
- Never place real personal data, provider payloads, tokens, or secrets in seeds.
