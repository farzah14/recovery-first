# Contributing

## Execution model

- Use one agent only.
- Execute detailed plans in numerical order.
- Work on one task at a time.
- Use the exact commit boundary defined by the active plan.

## Branches

Use a dedicated branch or isolated worktree. Do not commit directly to a protected branch.

## Required checks

```bash
pnpm verify
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:stop
pnpm test:e2e
```

## Pull requests

A pull request must include:

- active plan and completed task numbers;
- changed-file summary;
- test and build evidence;
- migration evidence when applicable;
- deviations and unresolved risks;
- confirmation that no secret or local-only file is tracked.
