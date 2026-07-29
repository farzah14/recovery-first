# Verification

## Fast application gate

```bash
pnpm verify
```

This runs formatting, linting, strict type checking, Vitest, repository checks, environment-example checks, and a production build.

## Database gate

```bash
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:stop
```

## Browser gate

```bash
pnpm test:e2e
```

## Full Foundation gate

```bash
pnpm verify:full
```

A task or plan is not complete while a required command is failing or has not been run.
