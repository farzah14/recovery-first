# Recovery First

Recovery First is a responsive, recovery-first habit tracker website.

## Repository stage

This repository contains the greenfield web foundation. Product features are introduced through the numbered plans in `docs/implementation/`.

## Required tools

- Git
- Node.js 24 LTS
- pnpm
- Docker Desktop or another Docker-compatible runtime

## Setup

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm db:start
pnpm db:reset
pnpm dev
```

Open `http://127.0.0.1:3000`.

## Baseline verification

```bash
pnpm verify
pnpm db:test
pnpm test:e2e
```

## Source of truth

Read these files before implementation:

1. `AGENTS.md`
2. `docs/specs/PRD.md`
3. `docs/specs/UX-FLOWS.md`
4. `docs/specs/UI-SPEC.md`
5. `docs/specs/TECHNICAL-DESIGN.md`
6. `docs/implementation/IMPLEMENTATION-PLAN.md`
7. the active detailed plan
