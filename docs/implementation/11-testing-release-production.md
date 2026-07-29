# Testing, Release, and Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. This project uses one agent only; do not dispatch subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Certify the complete Recovery-First Habit Tracker against the approved product, UX, UI, technical, security, accessibility, performance, browser, billing, recovery, and operational requirements, then release it through a controlled staging-to-production process with executable rollback.

**Architecture:** Verification is evidence-driven and layered. Fast deterministic unit, component, database, and integration suites run before browser suites; browser, accessibility, PWA, performance, provider-failure, migration, and release rehearsals then certify the assembled system. Production promotion is immutable, environment-protected, migration-aware, observable, and reversible. No browser callback, deployment success response, or manual visual impression may substitute for authoritative backend state or recorded release evidence.

**Tech Stack:** Next.js App Router, React, strict TypeScript, Tailwind CSS, Supabase Auth and PostgreSQL, Dexie, service workers and Web Push, Paddle Billing adapter, Vitest, React Testing Library, Playwright, axe-core, pgTAP, Lighthouse CI, GitHub Actions, Vercel, Sentry-compatible monitoring, PostHog-compatible analytics, pnpm.

---

# 1. Prerequisites and Boundaries

## Prerequisites

Begin only after Plans 01-10 are verified complete. The repository must already provide:

- deterministic clocks, UUIDs, test fixtures, environment validation, structured errors, and stable command IDs;
- responsive public and authenticated shells using the approved emerald design system;
- PostgreSQL schema, functions, constraints, RLS, immutable habit versions, sessions, check-ins, lifecycle, Recovery, Weekly Review, Premium programs, Insights, billing, retention, export, and deletion;
- Guest IndexedDB persistence, durable pending operations, retry, conflicts, multi-tab coordination, service-worker behavior, Web Push, and email reminder adapters;
- secure SSR authentication, Guest conversion, entitlement projection, verified billing webhooks, and downgrade preservation;
- CSP, security headers, origin protection, request limits, rate limits, privacy-safe observability, dependency controls, and incident runbooks;
- local, preview, staging, and production environment definitions where preview and staging never use production data;
- all verification evidence required by the preceding plans.

## Explicit exclusions

This plan does not add:

- new product features;
- new pricing tiers or billing providers;
- redesigns outside defects required to meet an approved specification;
- dark mode;
- native mobile applications;
- medical, legal, financial, or therapeutic claims;
- unrestricted public launch before every release blocker is closed;
- production data copied into local, preview, or staging environments;
- exceptions that weaken RLS, entitlement authority, deletion, privacy, CSP, or provider-signature controls.

## Release invariants

- Every approved MVP requirement has an implementation location and verification evidence.
- A requirement is not complete because a screen exists; the required state, behavior, error path, responsive behavior, accessibility behavior, and authorization path must also be verified.
- Automated tests use deterministic fixtures and isolated environments.
- Manual evidence is allowed only where browser or assistive-technology behavior cannot be fully asserted automatically.
- Guest, Free, Trial, Premium, payment-failed, canceled, expired, refunded, and chargeback states are independently exercised.
- Automatic Skipped never triggers Recovery.
- Recovery begins only after three consecutive scheduled Manual Skipped sessions.
- Two failed Recovery Plans result in Needs Review.
- Guest, Free, and Premium active-habit limits remain 3, 5, and 20.
- Premium is granted only from verified backend entitlement.
- No supported journey loses data during reload, temporary network loss, retry, duplicate command replay, service-worker update, or safe rollback.
- Cross-user access fails at both application and database boundaries.
- Logs, analytics, traces, screenshots, reports, videos, and fixtures exclude prohibited private content.
- A release is blocked by any unresolved critical or high security issue, data-loss defect, cross-user authorization defect, billing-entitlement defect, deletion defect, inaccessible critical journey, or failed rollback rehearsal.

---

# 2. File Map

```text
.github/
├── CODEOWNERS
├── dependabot.yml
└── workflows/
    ├── ci.yml
    ├── nightly.yml
    ├── release.yml
    └── rollback.yml

config/
├── browser-matrix.ts
├── performance-budgets.ts
├── release-blockers.ts
└── visual-viewports.ts

docs/
├── operations/
│   ├── RELEASE.md
│   ├── ROLLBACK.md
│   ├── PRODUCTION-ENVIRONMENT.md
│   ├── PRODUCTION-SMOKE.md
│   ├── DATABASE-RECOVERY.md
│   └── PROVIDER-OUTAGE-REHEARSAL.md
└── release/
    ├── REQUIREMENTS-TRACEABILITY.md
    ├── MANUAL-ACCESSIBILITY-EVIDENCE.md
    ├── BROWSER-MATRIX-EVIDENCE.md
    ├── PERFORMANCE-EVIDENCE.md
    ├── MIGRATION-REHEARSAL-EVIDENCE.md
    ├── STAGING-ACCEPTANCE.md
    ├── GO-LIVE-CHECKLIST.md
    ├── RELEASE-EVIDENCE.md
    └── RELEASE-MANIFEST.schema.json

scripts/
├── build-traceability.mjs
├── check-release-blockers.mjs
├── check-test-annotations.mjs
├── create-release-manifest.mjs
├── verify-production-env.mjs
├── verify-public-metadata.mjs
├── verify-service-worker-assets.mjs
├── run-provider-outage-rehearsal.mjs
├── run-production-smoke.mjs
└── verify-clean-checkout.mjs

tests/
├── accessibility/
│   ├── critical-routes.a11y.spec.ts
│   ├── keyboard-navigation.spec.ts
│   ├── reduced-motion.spec.ts
│   ├── screen-reader-contracts.test.tsx
│   ├── status-without-color.test.tsx
│   └── zoom-200-percent.spec.ts
├── browser/
│   ├── critical-journeys.spec.ts
│   ├── responsive-layout.spec.ts
│   └── touch-targets.spec.ts
├── component/
│   ├── operational-states.test.tsx
│   └── responsive-navigation.test.tsx
├── contract/
│   ├── requirements-map.test.ts
│   ├── routes-map.test.ts
│   └── telemetry-schema.test.ts
├── e2e/
│   ├── guest-core-loop.spec.ts
│   ├── guest-conversion.spec.ts
│   ├── signed-in-core-loop.spec.ts
│   ├── recovery-weekly-review.spec.ts
│   ├── premium-insights.spec.ts
│   ├── billing-entitlements.spec.ts
│   ├── reminders.spec.ts
│   ├── export-deletion.spec.ts
│   └── production-smoke.spec.ts
├── fixtures/
│   ├── accounts.ts
│   ├── billing.ts
│   ├── habits.ts
│   ├── recovery.ts
│   └── release.ts
├── integration/
│   ├── provider-outages.test.ts
│   ├── service-worker-update.test.ts
│   └── staging-environment.test.ts
├── performance/
│   ├── authenticated-routes.perf.spec.ts
│   ├── public-routes.perf.spec.ts
│   └── query-budgets.test.ts
├── pwa/
│   ├── cache-rollback.spec.ts
│   ├── installability.spec.ts
│   ├── offline-fallback.spec.ts
│   └── update-flow.spec.ts
├── release/
│   ├── environment-isolation.test.ts
│   ├── feature-flags.test.ts
│   ├── release-manifest.test.ts
│   └── rollback-readiness.test.ts
├── security/
│   ├── cross-user-e2e.spec.ts
│   ├── production-headers.spec.ts
│   └── release-security-gate.test.ts
└── visual/
    ├── authenticated-routes.visual.spec.ts
    ├── operational-states.visual.spec.ts
    └── public-routes.visual.spec.ts

lighthouserc.cjs
playwright.release.config.ts
```

---

# 3. Task Plan

## Task 1: Create the Requirements Traceability System

**Files:**

- Create: `docs/release/REQUIREMENTS-TRACEABILITY.md`
- Create: `scripts/build-traceability.mjs`
- Create: `scripts/check-test-annotations.mjs`
- Create: `tests/contract/requirements-map.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Define requirement identifiers**

Add stable identifiers to the traceability document without rewriting the source specifications. Use these namespaces:

```text
PRD-FR-*    Functional requirements
PRD-NFR-*   Non-functional requirements
UX-FLOW-*   User-flow requirements
UI-COMP-*   Component and visual-state requirements
UI-A11Y-*   Accessibility requirements
TECH-*      Architecture, security, data, and operations requirements
```

Each row must contain:

```markdown
| Requirement ID | Source section | Requirement summary | Implementation paths | Automated evidence | Manual evidence | Status |
|---|---|---|---|---|---|---|
```

Allowed statuses:

```text
not_started
implemented_unverified
verified
blocked
not_applicable_with_reason
```

- [ ] **Step 2: Add test annotations**

Every release-relevant test must contain one or more annotations in its title or metadata:

```ts
test('[PRD-FR-CORE-001][UX-FLOW-CHECKIN-001] records a Minimum check-in as successful continuity', async ({ page }) => {
  // test body
});
```

For Vitest:

```ts
describe('[TECH-RLS-001] cross-user denial', () => {
  it('rejects access to another user habit', async () => {
    // assertion
  });
});
```

- [ ] **Step 3: Implement the annotation checker**

`scripts/check-test-annotations.mjs` must:

1. scan release-relevant test directories;
2. require at least one approved requirement identifier per test file;
3. reject unknown identifier formats;
4. print the file and line for each violation;
5. exit non-zero when violations exist.

Add:

```json
{
  "scripts": {
    "test:annotations": "node scripts/check-test-annotations.mjs"
  }
}
```

- [ ] **Step 4: Implement traceability generation**

`scripts/build-traceability.mjs` must read the approved requirement registry and test annotations, then emit a deterministic coverage summary:

```text
requirements total: N
requirements with implementation: N
requirements with automated evidence: N
requirements requiring manual evidence: N
blocked requirements: N
unknown test annotations: 0
```

The script must not mark a requirement verified solely because a matching test name exists. Verification status is updated only after the referenced command passes and evidence is recorded.

- [ ] **Step 5: Write the failing contract test**

`tests/contract/requirements-map.test.ts` must prove:

```ts
expect(requirementIds).toHaveLength(new Set(requirementIds).size);
expect(requirements.every((item) => item.sourceSection.length > 0)).toBe(true);
expect(requirements.every((item) => item.implementationPaths.length > 0)).toBe(true);
expect(unknownTestAnnotations).toEqual([]);
```

- [ ] **Step 6: Run the focused checks**

Run:

```bash
pnpm test:annotations
pnpm vitest run tests/contract/requirements-map.test.ts
```

Expected:

```text
all release test files contain valid requirement annotations
requirements map contract passes
```

- [ ] **Step 7: Commit**

```bash
git add docs/release/REQUIREMENTS-TRACEABILITY.md scripts/build-traceability.mjs scripts/check-test-annotations.mjs tests/contract/requirements-map.test.ts package.json
git commit -m "test: add requirements traceability system"
```

---

## Task 2: Build Deterministic Release Fixtures and Environment Isolation

**Files:**

- Create: `tests/fixtures/release.ts`
- Create: `tests/fixtures/accounts.ts`
- Create: `tests/fixtures/billing.ts`
- Create: `tests/fixtures/habits.ts`
- Create: `tests/fixtures/recovery.ts`
- Create: `tests/release/environment-isolation.test.ts`
- Create: `scripts/verify-production-env.mjs`
- Modify: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: Define deterministic account fixtures**

Create fixtures for:

```ts
export const releaseAccounts = {
  free: { key: 'free-user', entitlement: 'free', activeHabitLimit: 5 },
  trial: { key: 'trial-user', entitlement: 'trial', activeHabitLimit: 20 },
  premium: { key: 'premium-user', entitlement: 'premium', activeHabitLimit: 20 },
  paymentFailed: { key: 'payment-failed-user', entitlement: 'grace_period', activeHabitLimit: 20 },
  expired: { key: 'expired-user', entitlement: 'free', activeHabitLimit: 5 },
  otherUser: { key: 'other-user', entitlement: 'free', activeHabitLimit: 5 },
} as const;
```

Use generated local/staging emails under a reserved non-deliverable test domain. Never include real personal data.

- [ ] **Step 2: Define deterministic habit and Recovery fixtures**

Fixtures must cover:

- daily, weekdays, and times-per-week recurrence;
- Full, Minimum, Manual Skipped, Automatic Skipped, and unrecorded sessions;
- three consecutive scheduled Manual Skipped sessions;
- Automatic Skipped interruption that does not start Recovery;
- one successful Recovery Plan;
- two failed Recovery Plans leading to Needs Review;
- Weekly Review decisions: Apply, Customize, Keep Current;
- active-habit limits 3, 5, and 20;
- conflicting revisions and duplicate command replay.

- [ ] **Step 3: Define billing fixtures**

Provide signed sandbox-event fixtures for:

```text
trial_started
subscription_activated
subscription_updated
payment_failed
grace_period_started
subscription_canceled
subscription_expired
refund_issued
chargeback_created
duplicate_event
out_of_order_event
```

Raw provider payloads must remain test-only and must not be logged by product code.

- [ ] **Step 4: Implement environment isolation checks**

`tests/release/environment-isolation.test.ts` must verify:

```ts
expect(previewDatabaseUrl).not.toBe(productionDatabaseUrl);
expect(stagingDatabaseUrl).not.toBe(productionDatabaseUrl);
expect(previewProjectRef).not.toBe(productionProjectRef);
expect(stagingProjectRef).not.toBe(productionProjectRef);
expect(clientEnvironment).not.toContain('SERVICE_ROLE');
```

- [ ] **Step 5: Implement production environment validation**

`scripts/verify-production-env.mjs` must require production values only when `APP_ENV=production` and must reject:

- missing required secrets;
- placeholder values;
- local Supabase URLs;
- staging or sandbox payment credentials;
- preview callback URLs;
- non-HTTPS canonical application URLs;
- identical public and privileged keys;
- secrets exposed through `NEXT_PUBLIC_` names.

The script must print variable names only, never values.

Add:

```json
{
  "scripts": {
    "release:env": "node scripts/verify-production-env.mjs"
  }
}
```

- [ ] **Step 6: Run the focused checks**

Run:

```bash
pnpm vitest run tests/release/environment-isolation.test.ts
APP_ENV=production pnpm release:env
```

Expected:

```text
environment isolation test passes
production environment validation passes without printing secret values
```

- [ ] **Step 7: Commit**

```bash
git add tests/fixtures tests/release/environment-isolation.test.ts scripts/verify-production-env.mjs .env.example package.json
git commit -m "test: add deterministic release fixtures"
```

---

## Task 3: Standardize Release Test Commands and CI Sharding

**Files:**

- Create: `playwright.release.config.ts`
- Create: `.github/workflows/nightly.yml`
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json`

- [ ] **Step 1: Define release test scripts**

Add exact scripts:

```json
{
  "scripts": {
    "test:unit": "vitest run tests/unit",
    "test:component": "vitest run tests/component",
    "test:contract": "vitest run tests/contract",
    "test:integration": "vitest run tests/integration",
    "test:security": "vitest run tests/security tests/privacy",
    "test:accessibility": "vitest run tests/accessibility && playwright test --config=playwright.release.config.ts tests/accessibility",
    "test:pwa": "playwright test --config=playwright.release.config.ts tests/pwa",
    "test:visual": "playwright test --config=playwright.release.config.ts tests/visual",
    "test:browser": "playwright test --config=playwright.release.config.ts tests/browser",
    "test:release:e2e": "playwright test --config=playwright.release.config.ts tests/e2e",
    "test:release": "pnpm test:annotations && pnpm test:unit && pnpm test:component && pnpm test:contract && pnpm test:integration && pnpm test:db && pnpm test:security && pnpm test:accessibility && pnpm test:pwa && pnpm test:browser && pnpm test:release:e2e",
    "verify:clean": "node scripts/verify-clean-checkout.mjs"
  }
}
```

- [ ] **Step 2: Configure deterministic Playwright release execution**

`playwright.release.config.ts` must:

- use the production build, not the development server;
- use isolated storage state per account fixture;
- retain traces only on first retry;
- retain screenshots and videos only on failure;
- use one retry in CI and zero locally by default;
- prohibit `.only` tests in CI;
- pin timezone to `Asia/Jakarta` for timezone-sensitive journeys;
- run desktop Chromium for every PR;
- allow the full browser matrix through named projects;
- write artifacts outside tracked source directories.

- [ ] **Step 3: Split PR and nightly gates**

PR CI must run:

```text
format
lint
typecheck
unit
component
contract
integration
database and RLS
security and privacy
Chromium critical E2E
production build
```

Nightly CI must additionally run:

```text
full browser matrix
visual regression
PWA update and offline
accessibility browser tests
performance budgets
provider-outage rehearsal in isolated test mode
full dependency and secret scans
```

- [ ] **Step 4: Add artifact-retention rules**

CI artifacts may contain only synthetic test data. Configure retention:

```text
failure traces: 7 days
screenshots: 7 days
videos: 7 days
Lighthouse reports: 14 days
release manifest and verification summaries: 90 days
```

- [ ] **Step 5: Run workflow syntax validation**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm exec playwright test --config=playwright.release.config.ts --list
```

Expected:

```text
all release projects and tests are listed
no invalid Playwright configuration
0 lint errors
0 TypeScript errors
```

- [ ] **Step 6: Commit**

```bash
git add playwright.release.config.ts .github/workflows/ci.yml .github/workflows/nightly.yml package.json
git commit -m "ci: add release test matrix"
```

---

## Task 4: Complete Unit, Component, and Operational-State Coverage

**Files:**

- Create: `tests/component/operational-states.test.tsx`
- Create: `tests/component/responsive-navigation.test.tsx`
- Create: `tests/contract/routes-map.test.ts`
- Modify: existing unit and component tests where traceability gaps exist
- Modify: `vitest.config.ts`

- [ ] **Step 1: Define release coverage thresholds**

Configure thresholds for release-critical modules:

```ts
coverage: {
  thresholds: {
    lines: 85,
    functions: 85,
    branches: 80,
    statements: 85,
  },
}
```

Do not use threshold exceptions to hide untested entitlement, RLS-facing, synchronization, Recovery, deletion, or billing logic.

- [ ] **Step 2: Verify every operational state**

`tests/component/operational-states.test.tsx` must cover only applicable states per screen and verify that state variants preserve layout landmarks:

```text
Default
Empty
Loading
Error
Offline
Pending sync
Conflict
Premium locked
Disabled
Destructive confirmation
```

Assertions must include:

- same page heading and landmark structure where expected;
- stable card dimensions for loading skeletons;
- icon plus text for state communication;
- Retry action on recoverable errors;
- explicit conflict choices;
- Cancel plus destructive action in confirmation dialogs;
- no color-only status.

- [ ] **Step 3: Verify responsive navigation contracts**

`tests/component/responsive-navigation.test.tsx` must prove:

```text
desktop: persistent left sidebar
mobile: bottom navigation plus compact header
navigation order: Today, Habits, Review, Insights, More
one active item only
same semantic destination across breakpoints
keyboard focus remains visible
```

- [ ] **Step 4: Verify the route inventory**

`tests/contract/routes-map.test.ts` must compare the implemented route registry with `UX-FLOWS.md` and reject missing or unexpected MVP routes. Public, authentication, application, settings, billing-return, and system routes must be classified explicitly.

- [ ] **Step 5: Run the focused suites with coverage**

Run:

```bash
pnpm vitest run tests/component/operational-states.test.tsx tests/component/responsive-navigation.test.tsx tests/contract/routes-map.test.ts --coverage
```

Expected:

```text
all operational-state and navigation assertions pass
release-critical coverage thresholds pass
```

- [ ] **Step 6: Commit**

```bash
git add tests/component tests/contract/routes-map.test.ts vitest.config.ts
git commit -m "test: complete component state coverage"
```

---

## Task 5: Certify Database, RLS, Transaction, and Query Budgets

**Files:**

- Create: `tests/performance/query-budgets.test.ts`
- Create: `tests/security/cross-user-e2e.spec.ts`
- Modify: `supabase/tests/` to close traceability gaps
- Modify: database integration tests where required

- [ ] **Step 1: Complete database invariant coverage**

Database tests must prove:

- immutable habit versions cannot be rewritten;
- active-limit functions enforce 5 Free and 20 Premium server-side;
- generated sessions are deterministic and non-duplicating;
- duplicate command IDs replay the original result;
- optimistic revision conflicts do not overwrite newer data;
- Automatic Skipped and Manual Skipped are distinct;
- Automatic Skipped does not increment Recovery trigger counters;
- three scheduled Manual Skipped sessions trigger Recovery once;
- two failed Recovery Plans create Needs Review;
- Weekly Review decisions are auditable;
- entitlement projection follows verified provider events only;
- 30-day Trash restore and purge rules hold;
- export, deletion, and retention functions are user-scoped and idempotent.

- [ ] **Step 2: Complete RLS and cross-user denial coverage**

Test every user-owned table and every security-definer function with:

```text
owner read allowed
owner valid write allowed
other-user read denied
other-user write denied
anonymous access denied unless explicitly public
browser role cannot read private audit/provider/raw tables
service-role-only operation unavailable to browser sessions
```

- [ ] **Step 3: Add browser-level cross-user checks**

`tests/security/cross-user-e2e.spec.ts` must sign in as two synthetic users and attempt direct navigation, query manipulation, stale cached data access, guessed identifiers, and mutation replay. Every path must return a safe not-found or unauthorized outcome without leaking existence or content.

- [ ] **Step 4: Define query budgets**

`tests/performance/query-budgets.test.ts` must enforce representative budgets:

```text
Today initial signed-in read: no N+1 pattern
Habit Details initial read: bounded query count
Weekly Review load: bounded query count
Insights summary: bounded aggregation count
Entitlement check: one authoritative projection read per request boundary
```

The test must compare recorded query names/counts, not wall-clock timing alone.

- [ ] **Step 5: Run database certification**

Run:

```bash
pnpm exec supabase db reset
pnpm test:db
pnpm vitest run tests/performance/query-budgets.test.ts
pnpm playwright test --config=playwright.release.config.ts tests/security/cross-user-e2e.spec.ts
```

Expected:

```text
all pgTAP tests pass
all cross-user paths are denied
all query budgets pass
```

- [ ] **Step 6: Commit**

```bash
git add supabase/tests tests/performance/query-budgets.test.ts tests/security/cross-user-e2e.spec.ts
git commit -m "test: certify database and rls boundaries"
```

---

## Task 6: Certify Guest and Signed-In Core Journeys

**Files:**

- Create: `tests/e2e/guest-core-loop.spec.ts`
- Create: `tests/e2e/signed-in-core-loop.spec.ts`
- Create: `tests/e2e/guest-conversion.spec.ts`
- Modify: test helpers and fixtures

- [ ] **Step 1: Test the complete Guest journey**

`guest-core-loop.spec.ts` must verify:

```text
enter as Guest
create first habit
create up to 3 active habits
reject a fourth active habit with clear explanation
view Today sessions
record Full
record Minimum as successful continuity
record Manual Skipped with optional friction reason
reload and retain browser-local data
use offline mode and retain pending local result
return online and retain consistent state
```

- [ ] **Step 2: Test the signed-in core journey**

`signed-in-core-loop.spec.ts` must verify:

```text
sign in
create habit
session generation
Today rendering
Full, Minimum, and Skipped check-ins
edit by creating a new immutable habit version
view history
pause and resume
archive and restore from Trash
observe synchronized state in a second browser context
```

- [ ] **Step 3: Test Guest conversion**

`guest-conversion.spec.ts` must verify:

- preview before transfer;
- explicit user confirmation;
- idempotent retry after interrupted import;
- no duplicate habits, sessions, or check-ins;
- Free limit resolution when Guest data plus account data exceed 5 active habits;
- no Guest data silently attached to the wrong account;
- successful browser-local cleanup only after authoritative import completion;
- safe sign-out with pending local operations handled according to specification.

- [ ] **Step 4: Add duplicate and conflict scenarios**

Exercise:

```text
double click on submit
browser retry after timeout
same command replay after reload
two tabs editing the same revision
remote update arriving while local draft exists
```

Expected behavior must be idempotent or explicitly conflict-resolved; silent overwrite is forbidden.

- [ ] **Step 5: Run the focused E2E suites**

Run:

```bash
pnpm playwright test --config=playwright.release.config.ts tests/e2e/guest-core-loop.spec.ts tests/e2e/signed-in-core-loop.spec.ts tests/e2e/guest-conversion.spec.ts
```

Expected:

```text
all Guest, signed-in, conversion, idempotency, and conflict scenarios pass
```

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/guest-core-loop.spec.ts tests/e2e/signed-in-core-loop.spec.ts tests/e2e/guest-conversion.spec.ts tests/fixtures
git commit -m "test: certify core habit journeys"
```

---

## Task 7: Certify Recovery, Weekly Review, Premium, Insights, and Billing

**Files:**

- Create: `tests/e2e/recovery-weekly-review.spec.ts`
- Create: `tests/e2e/premium-insights.spec.ts`
- Create: `tests/e2e/billing-entitlements.spec.ts`
- Modify: provider sandbox test helpers

- [ ] **Step 1: Test Recovery trigger rules**

Prove:

```text
1 Manual Skipped: no Recovery
2 consecutive scheduled Manual Skipped: no Recovery
3 consecutive scheduled Manual Skipped: Recovery starts
Automatic Skipped does not trigger or advance Recovery
Full or Minimum breaks the consecutive Manual Skipped sequence
Recovery defaults to 3 scheduled sessions
```

- [ ] **Step 2: Test Recovery outcomes and Needs Review**

Prove:

- successful Recovery exits according to lifecycle rules;
- one failed Recovery Plan records failure without Needs Review;
- two failed Recovery Plans create Needs Review;
- redesign preserves history through a new habit version;
- Recovery language remains supportive and non-punitive.

- [ ] **Step 3: Test Weekly Review decisions**

Prove Apply, Customize, and Keep Current paths, including version creation, no silent change, and auditable decision history.

- [ ] **Step 4: Test Premium authorization and Insights**

`premium-insights.spec.ts` must verify:

- Guest and Free preview access does not mutate Premium-only state;
- server rejects Premium mutations for non-entitled accounts;
- Trial and Premium accounts may use approved Premium capabilities;
- downgrade preserves historical data and explains locked capabilities;
- Insights metrics use Full, Minimum, Manual Skipped, and Automatic Skipped correctly;
- charts have accessible text summaries and do not rely on color alone.

- [ ] **Step 5: Test billing and entitlement state transitions**

`billing-entitlements.spec.ts` must verify:

```text
checkout return remains pending before webhook
verified activation grants entitlement
payment failure enters approved grace behavior
cancellation preserves access until effective end when applicable
expiration removes Premium capabilities without deleting data
refund and chargeback reconcile entitlement
out-of-order events do not regress newer state
duplicate events are idempotent
invalid signatures are rejected
```

- [ ] **Step 6: Run the focused suites**

Run:

```bash
pnpm playwright test --config=playwright.release.config.ts tests/e2e/recovery-weekly-review.spec.ts tests/e2e/premium-insights.spec.ts tests/e2e/billing-entitlements.spec.ts
```

Expected:

```text
all lifecycle, Recovery, Weekly Review, Premium, Insights, and billing scenarios pass
```

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/recovery-weekly-review.spec.ts tests/e2e/premium-insights.spec.ts tests/e2e/billing-entitlements.spec.ts
git commit -m "test: certify recovery premium and billing"
```

---

## Task 8: Certify Offline Resilience, Reminders, and PWA Update Safety

**Files:**

- Create: `tests/e2e/reminders.spec.ts`
- Create: `tests/pwa/offline-fallback.spec.ts`
- Create: `tests/pwa/update-flow.spec.ts`
- Create: `tests/pwa/cache-rollback.spec.ts`
- Create: `tests/pwa/installability.spec.ts`
- Create: `scripts/verify-service-worker-assets.mjs`
- Modify: `package.json`

- [ ] **Step 1: Test offline read and write behavior**

Prove:

- previously loaded Today and Habit Details remain understandable offline;
- unsupported offline actions explain the limitation;
- supported Guest and pending signed-in operations survive reload;
- reconnect triggers bounded retry;
- duplicate replay does not duplicate domain records;
- failed and conflict operations remain visible and recoverable;
- multiple tabs do not process the same queue item concurrently.

- [ ] **Step 2: Test service-worker update behavior**

`update-flow.spec.ts` must simulate an old client and new deployment:

```text
old shell remains usable until user-safe activation point
new worker does not discard pending operations
user receives a clear update-available message when required
activation reload preserves local drafts and queue state
```

- [ ] **Step 3: Test cache rollback**

`cache-rollback.spec.ts` must prove a failed or incompatible asset fetch does not leave a mixed-version shell. Cache namespaces must be versioned, and activation must delete only superseded application caches, never IndexedDB user data.

- [ ] **Step 4: Test installability and offline fallback**

Verify:

- valid manifest;
- required icons exist;
- start URL and scope are correct;
- standalone display configuration is valid;
- service worker controls the production route;
- offline fallback is branded, accessible, and honest;
- no install prompt is shown when browser criteria are not met.

- [ ] **Step 5: Test reminder states**

`reminders.spec.ts` must verify:

```text
permission not requested without user action
permission denied is explained without blocking product use
scheduled does not equal delivered
provider accepted, delivered where supported, failed, and expired states remain distinct
push subscription removal is handled
email and push outages do not alter habit/check-in state
reminder content omits sensitive habit text when privacy rules require generic content
```

- [ ] **Step 6: Add service-worker asset verification**

`scripts/verify-service-worker-assets.mjs` must reject:

- missing manifest assets;
- non-existent icon paths;
- unhashed application chunks referenced by the service worker;
- production cache entries pointing to local or preview URLs;
- cache rules that include authenticated API responses containing private data.

Add:

```json
{
  "scripts": {
    "pwa:verify": "node scripts/verify-service-worker-assets.mjs"
  }
}
```

- [ ] **Step 7: Run the focused checks**

Run:

```bash
pnpm pwa:verify
pnpm playwright test --config=playwright.release.config.ts tests/pwa tests/e2e/reminders.spec.ts
```

Expected:

```text
all PWA, offline, update, cache, installability, and reminder scenarios pass
```

- [ ] **Step 8: Commit**

```bash
git add tests/pwa tests/e2e/reminders.spec.ts scripts/verify-service-worker-assets.mjs package.json
git commit -m "test: certify offline reminders and pwa"
```

---

## Task 9: Complete Accessibility Certification

**Files:**

- Create: `tests/accessibility/critical-routes.a11y.spec.ts`
- Create: `tests/accessibility/keyboard-navigation.spec.ts`
- Create: `tests/accessibility/reduced-motion.spec.ts`
- Create: `tests/accessibility/zoom-200-percent.spec.ts`
- Create: `tests/accessibility/screen-reader-contracts.test.tsx`
- Create: `tests/accessibility/status-without-color.test.tsx`
- Create: `docs/release/MANUAL-ACCESSIBILITY-EVIDENCE.md`

- [ ] **Step 1: Run automated axe checks on critical states**

Test at minimum:

```text
Landing
Sign in
Today Default, Empty, Loading, Error, Offline, Pending sync
Create Habit steps
Habit Details Default, Conflict, Destructive confirmation
Check-in and confirmation
Recovery Plan
Needs Review
Weekly Review
Insights
Pricing and subscription
Settings export and deletion
```

Fail on serious or critical axe violations. Document any accepted lower-severity exception with requirement ID, rationale, owner, and expiry date.

- [ ] **Step 2: Test keyboard-only navigation**

Verify:

- skip link reaches main content;
- sidebar and bottom navigation are reachable in logical order;
- focus remains visible;
- dialogs trap focus and restore it on close;
- drawers and popovers close with Escape;
- form errors move or announce focus appropriately;
- Full, Minimum, and Skipped choices work without pointer input;
- conflict and destructive actions are distinguishable;
- no keyboard trap exists.

- [ ] **Step 3: Test screen-reader contracts**

Component tests must assert:

```text
page titles and headings are unique and ordered
form labels and descriptions are associated
errors use aria-describedby or equivalent association
status changes use appropriate live regions
loading announcements are not excessively repeated
charts include text summaries
decorative icons are hidden
icon-only controls have accessible names
```

- [ ] **Step 4: Test reduced motion and zoom**

`reduced-motion.spec.ts` must verify that non-essential transitions are removed under `prefers-reduced-motion: reduce`.

`zoom-200-percent.spec.ts` must verify at 200 percent browser zoom:

- no clipped primary actions;
- no horizontal scrolling for standard content at supported widths except intentional data regions;
- dialogs remain operable;
- bottom navigation does not obscure content;
- text does not overlap icons or badges.

- [ ] **Step 5: Test status communication without color**

`status-without-color.test.tsx` must verify each semantic state includes at least one non-color cue such as icon, text, label, pattern, or shape.

- [ ] **Step 6: Perform manual assistive-technology checks**

Record dated evidence for:

```text
Windows: NVDA plus latest supported Chromium browser
macOS where available: VoiceOver plus Safari
keyboard-only desktop
mobile screen-reader smoke check where available
```

Manual evidence must cover sign-in, Today, Create Habit, Check-in, Recovery, Weekly Review, subscription status, export, and deletion.

- [ ] **Step 7: Run the accessibility gate**

Run:

```bash
pnpm test:accessibility
```

Expected:

```text
0 serious or critical automated accessibility violations
all keyboard, screen-reader contract, reduced-motion, zoom, and non-color tests pass
manual evidence completed for critical journeys
```

- [ ] **Step 8: Commit**

```bash
git add tests/accessibility docs/release/MANUAL-ACCESSIBILITY-EVIDENCE.md
git commit -m "test: complete accessibility certification"
```

---

## Task 10: Certify Browser, Responsive, Touch, and Visual Consistency

**Files:**

- Create: `config/browser-matrix.ts`
- Create: `config/visual-viewports.ts`
- Create: `tests/browser/critical-journeys.spec.ts`
- Create: `tests/browser/responsive-layout.spec.ts`
- Create: `tests/browser/touch-targets.spec.ts`
- Create: `tests/visual/public-routes.visual.spec.ts`
- Create: `tests/visual/authenticated-routes.visual.spec.ts`
- Create: `tests/visual/operational-states.visual.spec.ts`
- Create: `docs/release/BROWSER-MATRIX-EVIDENCE.md`

- [ ] **Step 1: Define the supported matrix**

Use Playwright projects for:

```text
Chromium desktop 1440x900
Firefox desktop 1440x900
WebKit desktop 1440x900
Chromium tablet 1024x768
Chromium mobile 390x844
WebKit mobile 390x844
```

The release evidence must record the actual browser engine versions used by CI.

- [ ] **Step 2: Test critical journeys across engines**

At minimum run:

```text
public landing to sign-in
Guest first habit and check-in
signed-in Today and Habit Details
Recovery and Weekly Review
pricing to sandbox checkout return
settings export and account deletion confirmation
```

Provider webhook completion may be asserted through the isolated sandbox harness rather than a third-party UI in every browser.

- [ ] **Step 3: Test responsive recomposition**

`responsive-layout.spec.ts` must assert structural behavior rather than only screenshots:

- desktop sidebar present only at approved breakpoint;
- mobile bottom navigation present at approved breakpoint;
- no duplicated navigation;
- cards reflow according to UI specification;
- dialogs become drawers or full-screen surfaces where specified;
- primary actions remain visible and reachable;
- right-side contextual panels collapse correctly;
- system-state banners do not overlap headers or navigation.

- [ ] **Step 4: Test touch targets**

`touch-targets.spec.ts` must inspect interactive element boxes and fail when critical controls fall below the approved target size, excluding inline text links where the UI specification explicitly permits them.

- [ ] **Step 5: Establish visual baselines**

Create baselines only after structural and accessibility tests pass. Cover:

```text
public pages
application shell
Today states
Create Habit steps
Habit Details states
Check-in flow
Recovery and Weekly Review
Insights
subscription states
settings export and deletion
```

Mask only deterministic dynamic values such as generated IDs and timestamps. Do not mask layout defects, state labels, navigation, or core content.

- [ ] **Step 6: Run the browser and visual gates**

Run:

```bash
pnpm test:browser
pnpm test:visual
```

Expected:

```text
all supported browser projects pass
all responsive and touch assertions pass
0 unapproved visual diffs
```

- [ ] **Step 7: Record evidence and commit**

```bash
git add config/browser-matrix.ts config/visual-viewports.ts tests/browser tests/visual docs/release/BROWSER-MATRIX-EVIDENCE.md
git commit -m "test: certify browser and visual consistency"
```

---

## Task 11: Enforce Performance, Bundle, and Reliability Budgets

**Files:**

- Create: `config/performance-budgets.ts`
- Create: `lighthouserc.cjs`
- Create: `tests/performance/public-routes.perf.spec.ts`
- Create: `tests/performance/authenticated-routes.perf.spec.ts`
- Create: `docs/release/PERFORMANCE-EVIDENCE.md`
- Modify: `package.json`

- [ ] **Step 1: Define measurable budgets**

Use the following initial release budgets under controlled CI conditions:

```text
Public landing Lighthouse Performance: at least 90
Public landing Accessibility: at least 95
Public landing Best Practices: at least 90
Public landing SEO: at least 95
Authenticated core route Accessibility: at least 95
Cumulative Layout Shift: at most 0.10
Largest Contentful Paint on public landing: at most 2.5 seconds in the configured Lighthouse profile
Interaction to Next Paint proxy or supported interaction metric: within the approved CI threshold
Initial JavaScript for public landing: fail on unapproved regression above recorded budget
Initial JavaScript for Today: fail on unapproved regression above recorded budget
```

Record exact byte budgets after the first production build and keep them in `config/performance-budgets.ts`. Changes require documented approval and evidence.

- [ ] **Step 2: Configure Lighthouse CI**

Audit:

```text
/
/features
/pricing
/sign-in
/app/today using an authenticated scripted flow or approved authenticated audit method
```

Do not send production credentials to Lighthouse CI.

- [ ] **Step 3: Add route-level timing assertions**

Performance tests must measure:

- server response classification;
- hydration completion for interactive islands;
- time until Today check-in controls are usable;
- no repeated query loop after initial render;
- Insights rendering with the approved fixture volume;
- offline shell startup from cache.

Use broad, stable budgets suitable for CI; do not encode flaky millisecond-level expectations.

- [ ] **Step 4: Add bundle regression checks**

The build analysis must reject:

- server-only libraries in client bundles;
- service-role or provider SDK secrets in client output;
- duplicate charting or date libraries without approval;
- an unapproved increase beyond the configured per-route budget;
- entire application routes converted to client components without documented need.

- [ ] **Step 5: Run the performance gate**

Add:

```json
{
  "scripts": {
    "test:performance": "lhci autorun && playwright test --config=playwright.release.config.ts tests/performance"
  }
}
```

Run:

```bash
pnpm build
pnpm test:performance
```

Expected:

```text
all Lighthouse category and Web Vitals budgets pass
all route and bundle regression checks pass
```

- [ ] **Step 6: Record evidence and commit**

```bash
git add config/performance-budgets.ts lighthouserc.cjs tests/performance docs/release/PERFORMANCE-EVIDENCE.md package.json
git commit -m "test: enforce performance budgets"
```

---

## Task 12: Verify Public Metadata, Legal, Support, and Discoverability

**Files:**

- Create: `scripts/verify-public-metadata.mjs`
- Create: `tests/contract/public-metadata.test.ts`
- Modify: public metadata, sitemap, robots, and legal routes only where defects are found
- Modify: `package.json`

- [ ] **Step 1: Define required public metadata**

Verify every indexable public route has:

```text
unique title
meta description
canonical URL
Open Graph title, description, URL, and image
Twitter-compatible preview metadata where approved
language declaration
favicon and application icons
```

- [ ] **Step 2: Verify robots and sitemap behavior**

Required rules:

- public marketing and legal pages follow the approved indexing policy;
- authenticated application routes are not indexed;
- auth callback, billing callback, API, internal, preview, and staging routes are not indexed;
- sitemap contains only canonical public URLs;
- staging and preview emit noindex behavior.

- [ ] **Step 3: Verify legal and support surfaces**

The following must be reachable from the public site and relevant settings/billing surfaces:

```text
Privacy Policy
Terms of Service
Subscription and cancellation information
Refund/contact guidance appropriate to the configured provider policy
Support contact
Data export information
Account deletion information
```

Do not invent legal claims. The release gate requires reviewed content supplied or approved by the product owner.

- [ ] **Step 4: Implement metadata validation**

`scripts/verify-public-metadata.mjs` must fetch the production build locally and reject missing, duplicate, non-canonical, local, preview, or staging metadata values.

Add:

```json
{
  "scripts": {
    "release:metadata": "node scripts/verify-public-metadata.mjs"
  }
}
```

- [ ] **Step 5: Run the focused checks**

Run:

```bash
pnpm build
pnpm release:metadata
pnpm vitest run tests/contract/public-metadata.test.ts
```

Expected:

```text
all public metadata, robots, sitemap, legal, and support assertions pass
```

- [ ] **Step 6: Commit**

```bash
git add scripts/verify-public-metadata.mjs tests/contract/public-metadata.test.ts src/app package.json
git commit -m "test: verify public release surfaces"
```

---

## Task 13: Rehearse Provider and Dependency Outages

**Files:**

- Create: `tests/integration/provider-outages.test.ts`
- Create: `scripts/run-provider-outage-rehearsal.mjs`
- Create: `docs/operations/PROVIDER-OUTAGE-REHEARSAL.md`
- Modify: provider test adapters
- Modify: `package.json`

- [ ] **Step 1: Define outage scenarios**

Rehearse:

```text
Supabase read unavailable
Supabase write timeout after unknown commit status
Paddle checkout creation unavailable
Paddle webhook delayed
email provider unavailable
Web Push provider unavailable
analytics unavailable
error monitoring unavailable
scheduled worker delayed
```

- [ ] **Step 2: Define required product behavior**

For each scenario verify:

- no false success claim;
- no entitlement granted from browser state;
- no duplicate write after safe retry;
- pending state remains understandable;
- private content is not logged;
- unaffected core product behavior remains usable where possible;
- user receives a bounded, actionable message;
- recovery occurs after dependency restoration;
- operational metric or alert is generated where required.

- [ ] **Step 3: Implement deterministic fault injection**

Test adapters must support explicit modes:

```ts
type ProviderFaultMode =
  | 'none'
  | 'timeout_before_accept'
  | 'timeout_after_accept'
  | 'rate_limited'
  | 'invalid_response'
  | 'delayed_delivery'
  | 'permanent_failure';
```

Production code must not expose a public route for setting fault mode.

- [ ] **Step 4: Implement the rehearsal runner**

`scripts/run-provider-outage-rehearsal.mjs` must:

1. require a non-production environment;
2. enable one deterministic fault at a time;
3. execute the mapped integration scenario;
4. verify recovery after disabling the fault;
5. write a redacted summary;
6. exit non-zero on any false-success, privacy, retry, or recovery failure.

- [ ] **Step 5: Run the outage gate**

Add:

```json
{
  "scripts": {
    "test:outages": "node scripts/run-provider-outage-rehearsal.mjs"
  }
}
```

Run:

```bash
APP_ENV=staging pnpm test:outages
```

Expected:

```text
all dependency outage and recovery scenarios pass
0 false-success outcomes
0 prohibited telemetry fields
```

- [ ] **Step 6: Commit**

```bash
git add tests/integration/provider-outages.test.ts scripts/run-provider-outage-rehearsal.mjs docs/operations/PROVIDER-OUTAGE-REHEARSAL.md package.json
git commit -m "test: rehearse provider outages"
```

---

## Task 14: Rehearse Migration, Compatibility, Rollback, and Restore

**Files:**

- Create: `docs/release/MIGRATION-REHEARSAL-EVIDENCE.md`
- Create: `tests/release/rollback-readiness.test.ts`
- Modify: `docs/operations/DATABASE-RECOVERY.md`
- Modify: migration rehearsal scripts from prior plans

- [ ] **Step 1: Define the release migration sequence**

The documented sequence must be:

```text
1. Confirm current backup and restore evidence.
2. Confirm application version N remains compatible with the expand migration.
3. Apply expand migration in staging.
4. Run database, RLS, and core journey smoke tests.
5. Deploy application version N+1 in staging.
6. Run complete staging acceptance.
7. Apply migrate/backfill step with bounded batches and progress evidence.
8. Keep contract/removal changes disabled until rollback window closes.
9. Promote the same immutable application artifact to production.
10. Apply contract migration only in a later approved release when old readers are no longer required.
```

- [ ] **Step 2: Rehearse clean migration**

Run all migrations against a fresh local/staging database and verify deterministic seed, generated types, RLS, functions, indexes, and application compatibility.

- [ ] **Step 3: Rehearse upgrade from the previous release schema**

Restore a fixture representing the previous release, apply new migrations, and verify:

- row-count ranges;
- immutable history;
- session and check-in integrity;
- entitlements;
- pending operations;
- Trash retention;
- export/deletion job states;
- no cross-user policy regression.

- [ ] **Step 4: Rehearse application rollback**

Deploy or run application version N against the expanded schema after version N+1 has been exercised. The previous version must remain safe during the documented rollback window.

Do not reverse a data-destructive migration merely to claim rollback. Prefer application rollback plus forward database correction when reversal risks data loss.

- [ ] **Step 5: Rehearse backup restore again**

Use a fresh isolated target and verify known fixtures, schema version, authorization, and cleanup. Record start time, completion time, operator, source, target, checks, and outcome without including private production data.

- [ ] **Step 6: Add rollback readiness assertions**

`tests/release/rollback-readiness.test.ts` must verify:

```text
previous application compatibility window is documented
latest migrations are forward-compatible during that window
feature-disable mechanism exists for billing, reminders, analytics, and new Premium mutations
rollback command references an immutable deployment identifier
restore procedure references a tested backup artifact
```

- [ ] **Step 7: Run the rehearsal gate**

Run:

```bash
pnpm exec supabase db reset
pnpm test:db
pnpm vitest run tests/release/rollback-readiness.test.ts
pnpm test:release:e2e --grep "migration|rollback|restore"
```

Expected:

```text
fresh migration passes
upgrade rehearsal passes
previous-version compatibility passes
rollback readiness passes
restore evidence is current
```

- [ ] **Step 8: Commit**

```bash
git add docs/release/MIGRATION-REHEARSAL-EVIDENCE.md docs/operations/DATABASE-RECOVERY.md tests/release/rollback-readiness.test.ts scripts
git commit -m "ops: rehearse migration rollback and restore"
```

---

## Task 15: Configure Protected Production Environments and Release Workflow

**Files:**

- Create: `.github/CODEOWNERS`
- Create: `.github/workflows/release.yml`
- Create: `.github/workflows/rollback.yml`
- Create: `docs/operations/PRODUCTION-ENVIRONMENT.md`
- Create: `docs/operations/RELEASE.md`
- Create: `docs/operations/ROLLBACK.md`
- Create: `docs/release/RELEASE-MANIFEST.schema.json`
- Create: `scripts/create-release-manifest.mjs`
- Create: `tests/release/release-manifest.test.ts`

- [ ] **Step 1: Define protected environments**

Document and configure:

```text
Preview: automatic, isolated data, no production secrets
Staging: protected, production-like, sandbox providers, synthetic data
Production: protected, explicit approval, production secrets, immutable artifact promotion
```

Production secrets must exist only in protected production configuration. Staging uses distinct Supabase project, auth callbacks, VAPID keys, email domain/configuration, billing sandbox credentials, monitoring environment, analytics project, and scheduled worker credentials.

- [ ] **Step 2: Define release branch and approval rules**

Use:

```text
main: continuously releasable
release candidate: immutable commit SHA from main
production deployment: approved promotion of the tested release candidate artifact
hotfix: branch from production tag, full relevant gates, then merge back to main
```

No workflow may rebuild different source code during promotion. The manifest must bind commit SHA, lockfile hash, build identifier, migration list, environment target, test evidence, and artifact digest.

- [ ] **Step 3: Create the release manifest schema**

Required fields:

```json
{
  "version": "string",
  "commitSha": "40-character git SHA",
  "lockfileSha256": "hex digest",
  "artifactId": "immutable deployment/build identifier",
  "artifactSha256": "hex digest",
  "migrationIds": ["ordered migration identifiers"],
  "testEvidence": ["evidence identifiers"],
  "createdAt": "ISO-8601 UTC timestamp",
  "createdBy": "automation identity",
  "targetEnvironment": "staging or production"
}
```

- [ ] **Step 4: Implement manifest generation and validation**

`scripts/create-release-manifest.mjs` must fail when:

- Git working tree is dirty;
- commit is not reachable from the protected release branch;
- lockfile is missing;
- required test evidence is absent;
- migrations are unordered or uncommitted;
- artifact identifier or digest is missing;
- target environment is invalid.

- [ ] **Step 5: Implement `release.yml`**

The workflow must:

1. check out the exact commit;
2. install with frozen lockfile;
3. run clean verification and release tests;
4. build once;
5. generate the release manifest;
6. deploy to staging;
7. run staging smoke and acceptance;
8. require protected approval;
9. promote the same artifact to production;
10. run production smoke;
11. record the deployment and evidence;
12. stop and expose rollback instructions when any gate fails.

- [ ] **Step 6: Implement `rollback.yml`**

The rollback workflow must require:

```text
production deployment identifier
reason
incident or change reference
confirmation that database compatibility was checked
approver
```

It must redeploy the selected known-good immutable artifact and run production smoke. It must not automatically reverse database migrations.

- [ ] **Step 7: Test manifest contracts**

Run:

```bash
pnpm vitest run tests/release/release-manifest.test.ts
node scripts/create-release-manifest.mjs --dry-run --target staging
```

Expected:

```text
manifest schema and generation tests pass
dry-run produces a redacted valid manifest
```

- [ ] **Step 8: Commit**

```bash
git add .github docs/operations docs/release/RELEASE-MANIFEST.schema.json scripts/create-release-manifest.mjs tests/release/release-manifest.test.ts
git commit -m "ci: add protected release workflow"
```

---

## Task 16: Complete Staging Acceptance and Production Smoke Automation

**Files:**

- Create: `docs/release/STAGING-ACCEPTANCE.md`
- Create: `docs/operations/PRODUCTION-SMOKE.md`
- Create: `scripts/run-production-smoke.mjs`
- Create: `tests/e2e/production-smoke.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Define staging acceptance**

Staging acceptance must execute with production-like configuration and synthetic data:

```text
public pages and metadata
auth sign-in and callback
Guest core loop
Guest conversion
signed-in core loop
Recovery and Weekly Review
Premium authorization and Insights
sandbox billing and webhook reconciliation
reminder scheduling and failure state
export and account deletion staging flow
offline and service-worker update
monitoring and analytics consent
RLS and cross-user denial
```

- [ ] **Step 2: Define safe production smoke checks**

Production smoke must avoid destructive customer actions. Use dedicated synthetic production-smoke accounts and records that are clearly marked and cleaned by the approved process.

Checks:

```text
public home, pricing, legal, robots, sitemap
liveness and readiness
sign-in page and OAuth callback configuration
authenticated Today load for smoke account
create, check in, and archive one synthetic habit
verified entitlement read for a smoke fixture without live purchase
notification configuration health without sending private content
export route authorization without exporting customer data
monitoring test event with synthetic payload
analytics consent-off behavior
```

Account deletion and real payment execution are not part of every production smoke run; they are certified in staging and monitored in production through protected synthetic rehearsals on an approved cadence.

- [ ] **Step 3: Implement the smoke runner**

`scripts/run-production-smoke.mjs` must:

- require an HTTPS production URL;
- reject localhost, preview, or staging targets;
- require dedicated smoke credentials from protected environment variables;
- print no credentials or private content;
- tag created synthetic records with an approved internal marker;
- clean up created smoke records;
- emit one-line pass/fail results per check;
- exit non-zero on any failed critical check.

- [ ] **Step 4: Add smoke scripts**

```json
{
  "scripts": {
    "test:staging": "playwright test --config=playwright.release.config.ts tests/e2e",
    "test:production:smoke": "node scripts/run-production-smoke.mjs"
  }
}
```

- [ ] **Step 5: Run staging acceptance**

Run:

```bash
APP_ENV=staging pnpm test:staging
```

Expected:

```text
all staging acceptance scenarios pass with synthetic data
```

- [ ] **Step 6: Dry-run production smoke against an isolated production-like target**

Run:

```bash
APP_ENV=production-smoke pnpm test:production:smoke
```

Expected:

```text
all safe smoke checks pass
all created synthetic records are cleaned
```

- [ ] **Step 7: Commit**

```bash
git add docs/release/STAGING-ACCEPTANCE.md docs/operations/PRODUCTION-SMOKE.md scripts/run-production-smoke.mjs tests/e2e/production-smoke.spec.ts package.json
git commit -m "test: automate staging and production smoke"
```

---

## Task 17: Create the Go-Live Gate, Staged Rollout, and Rollback Decision Model

**Files:**

- Create: `config/release-blockers.ts`
- Create: `scripts/check-release-blockers.mjs`
- Create: `docs/release/GO-LIVE-CHECKLIST.md`
- Create: `tests/release/release-security-gate.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Define release blockers**

`config/release-blockers.ts` must classify as blocking:

```text
critical or high security finding
cross-user access path
production secret exposure
unverified entitlement grant
payment event signature or idempotency failure
data-loss or silent-overwrite defect
failed migration, restore, or rollback rehearsal
failed account deletion or export authorization
critical journey inaccessible by keyboard or screen reader
serious or critical automated accessibility violation without approved exception
supported-browser failure in a critical journey
PWA update that risks local or pending data
failed production environment validation
failed production build
missing legal or support surface
monitoring or alert route unverified
backup evidence expired
```

- [ ] **Step 2: Define staged rollout**

Use a controlled sequence:

```text
Stage 0: production infrastructure and internal smoke only
Stage 1: invited internal accounts
Stage 2: limited closed beta cohort
Stage 3: broader free beta with billing disabled or explicitly limited
Stage 4: Premium checkout enabled after payment and support readiness
Stage 5: general availability after observed stability window
```

Each stage requires explicit entry criteria, monitoring period, exit criteria, rollback trigger, and owner.

- [ ] **Step 3: Define immediate rollback triggers**

Immediate rollback or feature-disable triggers include:

```text
cross-user data exposure suspicion
verified data loss or corruption
widespread authentication failure
incorrect entitlement grants or revocations
payment webhook processing corruption
account deletion affecting the wrong user
service-worker update blocking application startup
error rate or latency crossing the approved critical threshold
monitoring blind spot during active incident
```

- [ ] **Step 4: Implement blocker evaluation**

`scripts/check-release-blockers.mjs` must read machine-readable test summaries and release evidence. It must print each blocker as:

```text
BLOCKER_ID | status | evidence | owner | resolution
```

It exits non-zero when any blocker is open, evidence is missing, or evidence is stale beyond the approved period.

Add:

```json
{
  "scripts": {
    "release:blockers": "node scripts/check-release-blockers.mjs"
  }
}
```

- [ ] **Step 5: Write the go-live checklist**

`GO-LIVE-CHECKLIST.md` must include explicit checkboxes for:

- requirements traceability complete;
- all automated suites from clean checkout;
- browser and accessibility evidence;
- performance budgets;
- production environment and secrets;
- domain, DNS, TLS, canonical URL, callbacks, and webhook URLs;
- Supabase production project and RLS;
- email sender and suppression handling;
- Web Push keys and subscription lifecycle;
- Paddle production configuration and verified webhooks;
- Sentry-compatible monitoring and alert routing;
- analytics consent and privacy filters;
- legal, support, cancellation, export, and deletion surfaces;
- backup, restore, migration, rollback, and provider-outage evidence;
- staging acceptance;
- immutable release manifest;
- approved rollout stage;
- final go or no-go sign-off.

- [ ] **Step 6: Test blocker classification**

`tests/release/release-security-gate.test.ts` must prove every listed critical class blocks release and that a warning-only item does not block when it has an owner, due date, rationale, and no conflict with the approved blocker policy.

- [ ] **Step 7: Run the go-live gate**

Run:

```bash
pnpm vitest run tests/release/release-security-gate.test.ts
pnpm release:blockers
```

Expected:

```text
release blocker policy tests pass
0 open release blockers
```

- [ ] **Step 8: Commit**

```bash
git add config/release-blockers.ts scripts/check-release-blockers.mjs docs/release/GO-LIVE-CHECKLIST.md tests/release/release-security-gate.test.ts package.json
git commit -m "ops: add go live release gate"
```

---

## Task 18: Run Final Clean-Checkout Certification and Record Release Evidence

**Files:**

- Create: `scripts/verify-clean-checkout.mjs`
- Create: `docs/release/RELEASE-EVIDENCE.md`
- Modify: `docs/release/REQUIREMENTS-TRACEABILITY.md`
- Modify: `docs/release/GO-LIVE-CHECKLIST.md`
- Modify: `package.json`

- [ ] **Step 1: Implement clean-checkout verification**

`scripts/verify-clean-checkout.mjs` must:

1. require a clean Git worktree;
2. create a temporary isolated checkout of the exact commit;
3. install with `pnpm install --frozen-lockfile`;
4. validate local test environment without production secrets;
5. start isolated Supabase services;
6. reset the database and run database tests;
7. run format, lint, typecheck, unit, component, contract, integration, security, privacy, accessibility, PWA, browser-critical, E2E, and build gates;
8. run dependency, license, secret, forbidden-telemetry, and browser-bundle scans;
9. generate the traceability report and release manifest dry run;
10. preserve only redacted summaries and failing synthetic artifacts;
11. destroy the temporary checkout and test services;
12. exit non-zero on any failed or skipped required gate.

- [ ] **Step 2: Define the full final command**

Add:

```json
{
  "scripts": {
    "release:certify": "pnpm verify:clean && pnpm release:blockers"
  }
}
```

The isolated verifier must execute the applicable complete gate:

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:annotations
pnpm test:unit
pnpm test:component
pnpm test:contract
pnpm test:integration
pnpm exec supabase db reset
pnpm test:db
pnpm test:security
pnpm test:accessibility
pnpm pwa:verify
pnpm test:pwa
pnpm test:browser
pnpm test:release:e2e
pnpm test:performance
pnpm test:outages
pnpm audit:dependencies
node scripts/check-license-policy.mjs
pnpm audit:secrets
node scripts/check-forbidden-log-fields.mjs
pnpm release:metadata
pnpm build
node scripts/build-traceability.mjs
node scripts/create-release-manifest.mjs --dry-run --target staging
```

- [ ] **Step 3: Run final certification**

Run:

```bash
pnpm release:certify
```

Expected:

```text
0 format errors
0 lint errors
0 TypeScript errors
all required unit, component, contract, integration, database, RLS, security, privacy, accessibility, PWA, browser, E2E, performance, and outage tests pass
0 high-severity dependency findings
license policy passes
secret and forbidden-telemetry scans pass
public metadata verification passes
production build succeeds
traceability has no uncovered approved MVP requirement
release manifest dry run is valid
0 open release blockers
```

- [ ] **Step 4: Record final release evidence**

`docs/release/RELEASE-EVIDENCE.md` must contain:

```markdown
# Release Evidence

## Release candidate
- Version:
- Commit SHA:
- Lockfile SHA-256:
- Artifact identifier:
- Artifact digest:
- Ordered migrations:

## Verification
For every command record execution date, environment, exit code, pass/fail counts, and evidence location.

## Manual evidence
Reference accessibility, browser, migration, restore, provider-outage, staging, legal, support, and production-smoke evidence.

## Findings
Critical: 0
High: 0
Medium accepted with owner and due date: list or none
Low accepted with owner and due date: list or none

## Decision
Go or No-Go:
Approved rollout stage:
Approver:
Rollback deployment identifier:
```

Do not put secrets, personal data, raw provider payloads, private habit content, or signed URLs in the evidence.

- [ ] **Step 5: Update traceability to verified**

Mark a requirement `verified` only when all referenced evidence passes. Any remaining `blocked` or `implemented_unverified` MVP requirement forces No-Go.

- [ ] **Step 6: Execute staging promotion rehearsal**

Run the release workflow through staging using the exact release candidate. Confirm manifest, migrations, staging acceptance, monitoring, and rollback selection.

- [ ] **Step 7: Execute the approved production rollout**

Only after protected approval:

```text
promote the immutable tested artifact
apply approved production migration sequence
run safe production smoke
observe monitoring and alert routing
confirm entitlement, auth, sync, and reminder health
record deployment identifier and result
continue only to the approved rollout stage
```

- [ ] **Step 8: Verify rollback remains executable**

After production smoke, perform a non-destructive rollback dry run that validates the selected known-good artifact, database compatibility, workflow permissions, and smoke command without replacing the healthy production deployment.

- [ ] **Step 9: Commit final evidence**

```bash
git add scripts/verify-clean-checkout.mjs docs/release package.json
git commit -m "docs: record final release certification"
```

---

# 4. Plan 11 Completion Criteria

Plan 11 is complete only when fresh evidence proves:

- every approved MVP requirement is mapped to implementation and verification evidence;
- no approved MVP requirement remains blocked or implemented-but-unverified;
- all required automated suites pass from a clean isolated checkout;
- production build succeeds with validated environment boundaries;
- database reset, migration, upgrade, RLS, rollback-compatibility, and restore rehearsals pass;
- Guest, Free, Trial, Premium, payment failure, cancellation, expiration, refund, and chargeback scenarios pass;
- Full, Minimum, Manual Skipped, Automatic Skipped, Recovery, Needs Review, and Weekly Review behavior matches the specifications;
- Guest limits, account limits, conversion, offline queue, conflict, duplicate replay, multi-tab behavior, and service-worker updates preserve data;
- cross-user reads and writes fail at application and database boundaries;
- Premium is never granted from browser redirect or unverified state;
- export, Trash retention, permanent deletion, and account deletion pass authorization and lifecycle tests;
- critical routes pass keyboard, screen-reader contract, reduced-motion, 200 percent zoom, contrast, and non-color communication checks;
- supported browser and responsive matrices pass critical journeys;
- visual baselines have no unapproved differences;
- public and authenticated performance budgets pass;
- public metadata, robots, sitemap, canonical URLs, social previews, legal pages, cancellation information, support, export, and deletion surfaces are reachable and correct;
- Supabase, billing, email, Web Push, analytics, monitoring, and scheduled-worker outage rehearsals avoid false success and recover correctly;
- production Supabase, Vercel, domain, DNS, TLS, authentication callbacks, email sender, Web Push keys, payment webhooks, monitoring, analytics consent, and protected secrets are configured;
- staging acceptance passes using synthetic data;
- the immutable release manifest binds source, lockfile, artifact, migrations, evidence, and target;
- no critical or high security finding remains;
- backup and restore evidence is current;
- monitoring and alert routing are verified;
- safe production smoke passes;
- rollback points to a known-good immutable artifact and remains executable;
- the approved rollout stage and final Go/No-Go decision are recorded.

# 5. Final Handoff

After Plan 11 verification:

```text
All specification and detailed implementation-plan documents are complete.
The next phase is implementation execution, beginning with:
docs/implementation/01-web-project-foundation.md
```

Execution rules:

- use one agent only;
- use `executing-plans`;
- execute Plans 01 through 11 in order;
- stop at every plan boundary for fresh verification;
- do not skip failed tests, security gates, accessibility gates, migration rehearsals, or release blockers;
- do not claim coding is complete until the implemented repository passes the Plan 11 clean-checkout certification.
