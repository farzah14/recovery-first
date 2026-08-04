# Account Tiers and Guest Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the browser-only Guest product identity with authenticated Free, Lite, and Premium account tiers while keeping the existing pricing contract and all layers consistent.

**Proposed commercial contract:** The current Pricing page is treated as the intended contract: Free is `$0` with 5 active habits and basic recovery; Lite is `$5/month` or `$48/year` with 10 active habits, enhanced recovery, and weekly capacity analysis; Premium is `$10/month` or `$96/year` with 30 active habits, advanced friction analysis, analytics/export, and email reminders. Free, Lite, and Premium are authenticated cloud-backed account tiers.

**Architecture:** The normal runtime identity is an authenticated account. Supabase PostgreSQL remains canonical for account data; Dexie remains a local cache/draft/pending-operation store owned by the signed-in account. Existing browser-local Guest data is treated as legacy data only: it remains recoverable until the user signs in and explicitly completes a one-time transfer or export. No UI or authorization path may claim that local legacy data is already a Free account.

**Tech Stack:** Next.js App Router, React, strict TypeScript, Supabase Auth/PostgreSQL, Dexie, Zod, Vitest, pgTAP, React Testing Library, Playwright, pnpm.

**Scope warning:** This is a product-contract and dependency change, not a string replacement. It invalidates the current Guest-first Plan 04 ordering. Authentication must become a prerequisite for the account-only core loop before Plan 04 is executed.

---

## Task 1: Record the approved tier contract and dependency change

**Files:**

- Modify: `docs/specs/PRD.md`
- Modify: `docs/specs/UX-FLOWS.md`
- Modify: `docs/specs/UI-SPEC.md`
- Modify: `docs/specs/TECHNICAL-DESIGN.md`
- Modify: `docs/implementation/IMPLEMENTATION-PLAN.md`
- Modify: `docs/implementation/03-database-domain-model.md`
- Modify: `docs/implementation/04-habits-sessions-checkins.md`
- Modify: `docs/implementation/07-authentication-guest-conversion.md`
- Modify: `docs/implementation/09-web-billing-entitlements.md`

- [x] Replace normal user-facing states with Free, Lite, and Premium account states.
- [x] Define Free/Lite/Premium limits as 5/10/30 and record their capability differences.
- [x] Remove Guest-first onboarding from the normal flow and make authenticated account entry the prerequisite for `/app` routes.
- [x] Retain an explicit legacy-local-data recovery/export path so existing browser data is not silently deleted.
- [x] Change the dependency graph so authentication precedes the account-only core loop; do not mark Plan 04 started until the amended prerequisite passes.
- [x] Add acceptance criteria for tier ordering, entitlement precedence, downgrade from Premium/Lite, and legacy-data transfer.
- [x] Commit: `docs: approve free lite premium account contract`.

## Task 2: Replace domain tier and identity contracts

**Files:**

- Modify: `src/domain/shared/plan-tier.ts`
- Modify or delete: `src/domain/shared/identity-mode.ts`
- Modify: `src/domain/habits/active-slot-policy.ts`
- Modify: `tests/unit/domain/active-slot-policy.test.ts`
- Add: `tests/unit/domain/plan-tier.test.ts`

- [x] Make `PlanTier` exactly `free | lite | premium`.
- [x] Set active-habit limits to Free 5, Lite 10, Premium 30.
- [x] Add an explicit tier ordering function used for comparisons and downgrade decisions.
- [x] Remove Guest from runtime identity types; use authenticated account identity for normal application ownership.
- [x] Add tests for parsing, ordering, every limit, invalid values, and downgrade target selection.
- [x] Run `pnpm test:domain` and `pnpm typecheck`.
- [x] Commit: `feat: define free lite premium tier contracts`.

## Task 3: Add the append-only database tier migration

**Files:**

- Add: `supabase/migrations/20260802010000_add_lite_plan_tier.sql`
- Modify: `supabase/migrations/20260729014000_domain_functions.sql` only through a new replacement migration, not by editing the merged migration
- Add or modify: `supabase/tests/00050_plan_tiers.test.sql`
- Regenerate: `src/lib/supabase/database.types.ts`
- Modify: `tests/unit/supabase/database-types.test.ts`

- [x] Add `lite` to the existing PostgreSQL `plan_tier` enum using an append-only migration.
- [x] Update effective-tier resolution so active Lite entitlements resolve to `lite`, active Premium entitlements resolve to `premium`, and the default remains `free`.
- [x] Enforce server-side limits of 5/10/30 in the authoritative active-limit function.
- [x] Define the accepted internal product codes for Lite and Premium monthly/annual entitlements.
- [x] Test default Free, active Lite, active Premium, expired entitlement fallback, and conflicting entitlement precedence.
- [x] Run `pnpm db:reset`, `pnpm db:test`, `pnpm db:types:check`, and local database lint.
- [x] Commit: `feat: add lite entitlement tier to database`.

## Task 4: Remove Guest as a normal local owner while preserving legacy data

**Files:**

- Modify: `src/lib/indexed-db/types.ts`
- Modify: `src/lib/indexed-db/schema.ts`
- Modify: `src/lib/indexed-db/migrations.ts`
- Modify: `src/lib/indexed-db/database.ts`
- Modify: `tests/unit/indexed-db/migrations.test.ts`
- Modify: `tests/unit/indexed-db/database.test.ts`
- Add: `src/features/legacy-local-data/legacy-local-data.ts`
- Add: `tests/features/legacy-local-data/legacy-local-data.test.ts`

- [x] Make normal local records account-owned cache/draft/outbox records with an authenticated `ownerId`.
- [x] Remove `activateGuestHabit`, `GuestActiveLimitError`, and Guest-only limit enforcement from normal runtime code.
- [x] Add an explicit migration marker for pre-change Guest records.
- [x] Preserve legacy records until one of two explicit outcomes: transactional account transfer succeeds or the user exports and confirms clearing them.
- [x] Never relabel legacy records as cloud-backed Free data before server acknowledgement.
- [x] Test reload preservation, transfer retry idempotency, export-before-clear, and no cross-account ownership.
- [x] Commit: `refactor: remove guest runtime ownership safely`.

## Task 5: Make authentication the required application boundary

**Files:**

- Add or modify: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
- Add or modify: `src/lib/auth/require-account.ts`
- Modify: `src/app/(app)/app/layout.tsx` or the approved application route boundary
- Modify: `src/app/auth/sign-in/page.tsx`
- Modify: `src/app/auth/sign-up/page.tsx`
- Add: callback route and session tests under `tests/auth/`

- [x] Implement the approved Supabase Auth callback and secure cookie session handling.
- [x] Redirect unauthenticated users from application routes to sign-in without exposing private data.
- [x] Create or load the default Free profile after successful account creation.
- [x] Preserve the requested return path with an allowlist.
- [x] Keep the sign-in and sign-up screens honest; no fake success state.
- [x] Run auth unit, route-gating, and accessibility tests; provider-backed auth integration remains a later environment gate.
- [x] Commit: `feat: require authenticated account application access`.

## Task 6: Adapt the core loop plan from Guest to account-owned data

**Files:**

- Modify: `docs/implementation/04-habits-sessions-checkins.md`
- Modify: `src/lib/repositories/product-repository.ts`
- Modify: `src/lib/repositories/repository-provider.tsx`
- Modify: `src/lib/repositories/signed-in/supabase-product-repository.ts`
- Add or modify: account-owned repository tests and Plan 04 feature tests

**Task 6 execution status:** Complete for the account repository contract and Plan 04 dependency rebase. The remaining unchecked lines below are historical wording retained in the original detailed-plan excerpt and must not be executed.

- [ ] Change the Plan 04 goal from “Guest core loop” to “authenticated Free account core loop”.
- [x] Use the authenticated repository as canonical for habit creation, sessions, and check-ins.
- [x] Use Dexie only for account cache, drafts, and pending operations.
- [x] Keep all core-loop invariants in server-authoritative functions and shared domain contracts.
- [x] Update active-limit messages to use the resolved Free/Lite/Premium tier and limit.
- [ ] Do not begin Plan 04 implementation until Tasks 1–5 pass their gates.
- [x] Commit: `docs: rebase core loop on account identity`.

## Task 7: Align UI, pricing, navigation, and plan presentation

**Files:**

- Modify: `src/app/(public)/pricing/page.tsx`
- Modify: `src/components/layout/app-shell.tsx`
- Modify: `src/components/navigation/mobile-more-drawer.tsx`
- Modify: `src/app/(app)/app/settings/page.tsx`
- Modify: `src/components/home/faq-section.tsx`
- Modify: affected component, accessibility, and E2E tests

**Task 7 execution status:** Complete; normal UI now uses account state and no longer exposes Guest mode. The first historical checkbox below is retained as wording evidence only.

- [ ] Remove Guest Mode labels and “Continue as Guest” actions from normal UI.
- [x] Display the authenticated user name and resolved Free/Lite/Premium tier from account state, not hardcoded text.
- [x] Keep Pricing cards ordered Free, Lite, Premium with the approved 5/10/30 limits and existing prices.
- [x] Show Lite as a real plan, not a placeholder or a Premium alias.
- [x] Add loading, unavailable-entitlement, downgrade, and legacy-local-data recovery states.
- [x] Verify responsive and accessibility behavior without changing the approved design tokens.
- [x] Commit: `feat: align account tier navigation and pricing UI`.

## Task 8: Align billing, entitlements, analytics, and release evidence

**Task 8 execution status:** Product mapping, authoritative entitlement-window policy, idempotent/stale billing transitions, normalized provider-event boundary, and billing metadata redaction are implemented and tested. Provider checkout, webhook reconciliation, downgrade mutation, and production observability remain implementation work that requires provider credentials and server integration; they are not fabricated here.

The checkout service boundary is now implemented and tested; provider price IDs and authenticated server ownership are injected by the future server route.

Provider-neutral billing configuration, server-only Paddle client construction, Paddle event normalization, and the dependency-injected Paddle adapter are now implemented and covered by focused contract tests. Webhook route processing, authoritative entitlement reconciliation, cancellation/refund/downgrade mutations, and production observability remain open.

**Files:**

- Modify: `docs/implementation/08-premium-programs-insights.md`
- Modify: `docs/implementation/09-web-billing-entitlements.md`
- Modify: `docs/implementation/10-security-observability-data-lifecycle.md`
- Modify: `docs/implementation/11-testing-release-production.md`
- Modify: tier-related analytics schemas and tests
- Create: `src/domain/billing/product-catalog.ts`
- Create: `src/domain/billing/transition-policy.ts`
- Create: `src/domain/billing/normalized-event.ts`
- Create: `src/lib/payments/payment-provider.ts`
- Create: `src/lib/payments/redaction.ts`
- Create: `src/features/subscriptions/checkout-service.ts`
- Create: `supabase/migrations/20260803010000_align_paid_tier_entitlement_windows.sql`
- Create: billing catalog, transition, entitlement-window, and redaction tests

- [x] Map provider products to Free, Lite, and Premium without granting access from browser state.
- [ ] Implement Lite checkout, cancellation, expiry, refund, and downgrade behavior.
- [ ] Preserve data when moving Premium → Lite or Lite → Free; pause only over-limit active habits.
- [x] Ensure analytics uses tier names consistently and never includes habit names or private notes.
- [ ] Add observability for auth, entitlement resolution, checkout, downgrade, and legacy-data transfer failures.
- [ ] Commit: `feat: align billing and release contracts for account tiers`.

## Task 9: Run complete regression and clean-checkout verification

**Task 9 execution status:** Deterministic gates and database verification pass. Public foundation E2E passes 8/8 against the production build, and the public visual checks pass. Authenticated Today/Habits visual baselines remain blocked until a real authenticated test fixture/provider environment exists; `pnpm audit --prod` also remains blocked by four inherited high/moderate vulnerabilities in Next's sharp/postcss dependency paths. This task is not marked complete.

**Files:**

- Modify: `docs/implementation/IMPLEMENTATION-PLAN.md`

- [ ] Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, all unit/component/integration/accessibility/E2E/visual suites, `pnpm build`, and `pnpm audit --prod`.
- [ ] Run `pnpm db:start`, `pnpm db:reset`, `pnpm db:test`, `pnpm db:types:check`, database lint, and `pnpm db:stop`.
- [ ] Run clean-checkout verification using only tracked files.
- [ ] Confirm no runtime Guest entry, no Guest tier, and no hardcoded contradictory plan labels remain.
- [ ] Update only the relevant plan status after fresh verification; do not mark Plan 04 complete prematurely.
- [ ] Commit: `docs: verify free lite premium migration`.

---

## Required decision before implementation

The plan assumes the existing Pricing implementation is authoritative for Lite: 10 active habits, `$5/month`, `$48/year`, cloud sync, enhanced recovery, and weekly capacity analysis; Premium is 30 active habits, `$10/month`, `$96/year`. If those values are not approved, update this plan and the source specifications before Task 1.
