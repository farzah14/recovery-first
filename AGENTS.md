# AGENTS.md

## Scope

These instructions apply to the entire repository unless a more specific nested `AGENTS.md` exists.

This is a greenfield, website-only project. Do not assume that an application, database, deployment, migration history, or legacy codebase already exists.

## Source of Truth

Read the following documents before implementation:

1. `docs/specs/PRD.md`
2. `docs/specs/UX-FLOWS.md`
3. `docs/specs/UI-SPEC.md`
4. `docs/specs/TECHNICAL-DESIGN.md`
5. Approved Architecture Decision Records in `docs/architecture/`
6. `docs/implementation/IMPLEMENTATION-PLAN.md`
7. The active detailed plan in `docs/implementation/`

The documents have different responsibilities:

- `PRD.md` defines product scope, business rules, plan limits, and acceptance requirements.
- `UX-FLOWS.md` defines user journeys, navigation behavior, decisions, and recovery paths.
- `UI-SPEC.md` defines visual tokens, components, responsive layouts, states, and accessibility behavior.
- `TECHNICAL-DESIGN.md` defines architecture, data ownership, security, interfaces, and engineering constraints.
- Architecture Decision Records document approved technical decisions.
- Implementation plans define the ordered work needed to implement the approved specifications.

An implementation plan may not override an approved specification. When two instructions conflict, do not choose silently. Stop the affected task and report:

1. the conflicting instructions;
2. the affected files or behavior;
3. the implementation impact;
4. the safest proposed correction.

## Execution Mode

- Use one agent only.
- Do not create, delegate to, or dispatch subagents.
- Execute the active detailed implementation plan sequentially.
- Work on one task at a time.
- Complete and verify the current task before beginning the next task.
- Do not skip, combine, or reorder tasks or commit boundaries without explicit approval.
- Mark a plan checkbox complete only after fresh verification succeeds.
- Do not claim completion from code inspection alone.

## Development Method

Use test-driven development for product behavior, domain rules, data operations, authorization logic, and regressions:

1. Write the smallest failing test that proves the required behavior.
2. Run the test and confirm that it fails for the expected reason.
3. Implement the minimum code required to make it pass.
4. Run the focused test and confirm that it passes.
5. Run affected regression tests.
6. Refactor only while tests remain passing.
7. Run every task-level verification command.
8. Commit only after the task quality gate passes.

Do not weaken tests, remove assertions, disable lint rules, or bypass validation merely to produce a passing result.

## Approved Technology Stack

- Framework: Next.js App Router
- UI runtime: React
- Language: TypeScript with strict mode
- Package manager: pnpm
- Styling: Tailwind CSS
- Component foundation: shadcn/ui primitives
- Icons: Lucide
- Server state: TanStack Query
- Cross-component ephemeral UI state: Zustand, limited use only
- Forms: React Hook Form
- Validation: Zod
- Browser persistence: IndexedDB through Dexie
- Backend: Supabase
- Cloud database: PostgreSQL
- Authentication: Supabase Auth
- Authorization: PostgreSQL Row Level Security and server-side authorization
- Privileged backend workflows: Supabase Edge Functions or approved server-only functions
- Hosting: Vercel
- Unit tests: Vitest
- Component tests: React Testing Library
- End-to-end tests: Playwright
- Error monitoring: approved Sentry-compatible adapter
- Product analytics: approved PostHog-compatible adapter

Do not substitute core technologies without an approved specification or Architecture Decision Record.

## Package and Tooling Rules

- Use `pnpm`; do not use npm, Yarn, or Bun for project dependency management.
- Keep `pnpm-lock.yaml` committed and synchronized with `package.json`.
- Do not add a package unless the active plan requires it and its responsibility is clear.
- Prefer platform and framework capabilities over unnecessary dependencies.
- Do not update unrelated dependencies during a feature task.
- Do not import browser-only packages into Server Components or server-only modules.
- Protect server-only modules with the approved server boundary mechanism.
- Keep TypeScript strict; do not introduce broad `any`, unsafe casts, or ignored compiler errors without an explicit documented reason.

## Repository Architecture

Follow the repository structure defined in `docs/specs/TECHNICAL-DESIGN.md`.

Primary boundaries:

- `src/app/` owns routes, layouts, loading states, error boundaries, and route handlers.
- `src/components/ui/` owns generic reusable UI primitives.
- `src/components/layout/` and `src/components/navigation/` own application shell components.
- `src/features/` owns feature-specific application logic and UI.
- `src/domain/` owns deterministic product rules and framework-independent domain logic.
- `src/lib/` owns infrastructure adapters and cross-cutting technical services.
- `supabase/` owns database migrations, database tests, seed data, and Edge Functions.
- `tests/` owns cross-feature integration, contract, accessibility, and end-to-end coverage.

Feature modules may depend on approved shared modules, but they may not import private internals from another feature. Expose cross-feature capabilities through the feature's public contract.

## Runtime Boundaries

### Server Components

Use Server Components for server-authorized reads, public content, authenticated initial data, metadata, and non-interactive presentation.

Server Components must not access:

- `window`, `document`, or browser storage;
- IndexedDB or Dexie;
- service workers;
- browser notification APIs;
- client-only state stores.

### Client Components

Use Client Components only where browser interaction is required, including:

- Guest-mode browser-local data;
- check-in controls;
- interactive forms;
- IndexedDB access;
- offline queue status;
- browser notification permission;
- interactive charts;
- dialogs, drawers, and responsive controls;
- same-origin multiple-tab coordination.

Keep client boundaries narrow. Do not convert an entire route into a Client Component merely because one child is interactive.

### Server-only operations

Keep secrets, privileged database access, payment verification, entitlement reconciliation, account deletion, export generation, and provider webhook processing on the server.

Never expose server-only environment variables or privileged clients to browser bundles.

## State Ownership

Use the following ownership rules:

1. URL search parameters for shareable filters and navigation state.
2. Server Components for initial server-authorized reads.
3. TanStack Query for mutable signed-in server state and synchronization status.
4. React local state for component-local interactions.
5. React Hook Form for form state.
6. Zustand only for cross-component ephemeral UI state that is not domain or server data.
7. IndexedDB through Dexie for Guest data, drafts, durable cache, and pending operations.

Do not duplicate habits, sessions, check-ins, subscription records, or other business entities inside Zustand.

## Product and Domain Rules

- Preserve the Recovery-First, non-punitive product model.
- Treat `Full`, `Minimum`, and `Skipped` check-ins as distinct domain outcomes.
- Preserve the distinction between manual and automatic skipped outcomes.
- Do not erase history when habits are redesigned, paused, stopped, restored, downgraded, or archived.
- Preserve habit versions, generated sessions, check-in history, recovery history, and weekly-review decisions.
- Use deterministic time, timezone, session-generation, and recommendation logic.
- Use stable identifiers and idempotency keys for retryable mutations.
- Enforce Guest, Free, and Premium limits at the appropriate browser and server boundaries.
- Premium access must come from verified backend entitlement, never from browser state alone.
- Do not introduce punitive streak-loss language, shame-based messaging, or destructive defaults.

## Browser-Local Data and Offline Rules

- Guest data is browser-local and stored in IndexedDB.
- Signed-in PostgreSQL data is canonical; IndexedDB provides cache, drafts, and pending-operation durability.
- Local schema changes use explicit versioned Dexie migrations.
- Pending operations must survive reloads and temporary network loss.
- Retryable writes use stable operation IDs and idempotency keys.
- Multiple tabs coordinate ownership and invalidation through the approved same-origin mechanism.
- Never silently discard local or remote user changes during a conflict.
- Show explicit pending, synchronized, failed, and conflict states where required by the UX specification.
- Do not claim that a reminder or notification was delivered merely because it was scheduled.

## Database and Supabase Rules

- Store signed-in canonical product data in Supabase PostgreSQL.
- Every user-owned table requires tested Row Level Security policies before browser access is allowed.
- The browser must never use the Supabase service-role key.
- Use transactional SQL functions for multi-table invariant-changing operations.
- Use immutable, ordered migrations in `supabase/migrations/`.
- Do not edit a merged migration. Add a new migration instead.
- Use expand-migrate-contract sequencing for destructive or compatibility-sensitive schema changes.
- Add database tests for constraints, functions, triggers, RLS, ownership, and cross-user denial.
- Keep seed data deterministic and free of real personal information.
- Test a full local database reset before accepting migration work.

## Authentication and Authorization Rules

- Guest mode is a browser-local product identity, not an authenticated cloud account.
- Signed-in methods are Google OAuth and approved email OTP or magic-link authentication.
- Use secure Supabase SSR session handling and cookies.
- Route gating is not authorization. Every protected read and write requires server or database authorization.
- Validate callback destinations and prevent open redirects.
- Guest-to-account conversion must be retryable and idempotent.
- Never attach Guest data to an account without the explicit approved conversion flow.
- Cross-user reads and writes must fail in automated RLS tests.

## Payment and Entitlement Rules

- Integrate payment providers through an internal provider abstraction.
- Verify webhook signatures before processing provider events.
- Store provider event IDs and process events idempotently.
- Normalize provider-specific states into the internal subscription and entitlement model.
- Do not grant Premium from query parameters, browser callbacks, client state, or an unverified checkout response.
- Checkout success pages display pending status until backend entitlement is verified.
- Handle renewal, cancellation, expiration, failed payment, refund, chargeback, and duplicate webhook events.
- Keep payment secrets and webhook secrets server-only.

## UI and UX Rules

- Treat `docs/specs/UI-SPEC.md` as the visual, responsive, component-state, and accessibility contract.
- Treat `docs/specs/UX-FLOWS.md` as the navigation and interaction-flow contract.
- Use the approved light-theme palette: emerald primary, white and soft-gray surfaces, amber, coral, purple, blue, gold, and brown semantic accents.
- Use semantic design tokens rather than hard-coded colors in product components.
- Desktop and laptop use the approved left sidebar.
- Tablet and mobile use the approved bottom navigation and responsive patterns.
- Implement loading, skeleton, empty, offline, pending, error, locked, destructive, and action-required states.
- Do not rely on color alone to communicate status.
- Preserve visible focus, keyboard navigation, semantic HTML, labels, error associations, and accessible names.
- Respect reduced-motion settings and text zoom.
- Use one clear primary action per panel or page section.
- Do not introduce unapproved dark mode during the initial light-theme implementation.

## Security and Privacy Rules

- Treat the browser as untrusted.
- Never commit secrets, credentials, private keys, access tokens, service-account files, production environment files, or real personal data.
- Only variables explicitly safe for public exposure may use the `NEXT_PUBLIC_` prefix.
- Validate external input with Zod at trust boundaries.
- Enforce authorization again at the database or server operation boundary.
- Verify provider signatures and reject replayed external events.
- Apply approved CSP, security headers, origin checks, rate limits, and redirect allowlists.
- Redact secrets and personal content from logs, traces, error reports, and analytics.
- Do not send habit names, private notes, email addresses, free-text friction details, or exported user data to analytics.
- Account export and deletion require explicit authorization and audited server-side workflows.
- Respect retention and deletion requirements defined by the specifications.

## Environment Rules

Supported environments:

- Local
- Preview
- Staging
- Production

Rules:

- Preview and staging must never connect to the production database.
- Validate environment variables during build and server startup.
- Keep `.env.local` and provider secrets outside Git.
- Keep `.env.example` current without real values.
- Fail safely when required server configuration is absent.
- Do not invent development fallbacks for security-sensitive secrets.

## Scope Control

- Implement only the active task and its required supporting changes.
- Do not modify unrelated files.
- Do not perform opportunistic refactoring outside the task.
- Do not silently change product rules, routes, schemas, interfaces, design tokens, package choices, or architecture.
- Do not create fake success states, placeholder implementations, or unverified completion markers.
- Do not add features because they appear useful but are absent from the approved specifications.
- Record necessary deviations before implementation and obtain approval when they alter scope or architecture.

## Git Rules

- Use a dedicated branch or isolated worktree for implementation work.
- Keep commits within the boundary specified by the active plan.
- Use the exact commit message from the plan when one is provided.
- Otherwise use a clear conventional commit message.
- Review `git status`, the staged diff, and generated files before committing.
- Do not commit `.env.local`, logs, reports containing secrets, build output, IDE caches, Playwright artifacts, or temporary files.
- Do not rewrite shared history or force-push without explicit approval.

## Required Verification

Run every command specified by the active task and detailed plan.

Once the corresponding scripts exist, the baseline feature-plan quality gate is:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run additional checks when relevant:

```bash
pnpm test:component
pnpm test:integration
pnpm test:a11y
pnpm test:e2e
pnpm exec supabase db reset
```

Also run plan-specific checks for:

- database migrations and RLS;
- Edge Functions;
- browser-local Dexie migrations;
- offline queue retries and conflicts;
- multiple-tab coordination;
- authentication callbacks;
- responsive layouts;
- Web Push capability and permission states;
- payment webhook verification and entitlement reconciliation;
- account export and deletion;
- production build and smoke tests;
- dependency and secret scanning.

Do not claim that a task, feature plan, build, migration, or release is complete while any required check is failing or has not been run.

## Failure Handling

When a command or test fails:

1. read the complete relevant output;
2. identify the root cause;
3. reproduce the failure with the smallest reliable command;
4. fix only the relevant issue;
5. rerun the focused check;
6. rerun affected regression checks;
7. record any deviation or unresolved risk.

Do not hide failures, suppress diagnostics, increase timeouts without evidence, or remove coverage merely to obtain a passing pipeline.

## Task Reporting

After each task, report:

- task number and name;
- files created, modified, or deleted;
- tests and verification commands executed;
- exact pass, failure, and skipped counts where available;
- database, build, accessibility, or browser results where relevant;
- commit hash;
- deviations, risks, and unresolved issues.

Before claiming an entire implementation plan is complete, report:

- completed tasks;
- final changed-file summary;
- test totals and results;
- lint, typecheck, and production-build results;
- migration, RLS, integration, accessibility, and end-to-end results where applicable;
- commits created;
- deviations from the plan;
- remaining risks;
- readiness for the next implementation plan.
