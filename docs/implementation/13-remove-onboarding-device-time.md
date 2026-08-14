# Remove Onboarding, Add Device-Based Time — Implementation Plan

**Goal:** Remove the required one-time onboarding wizard (`/onboarding`), the Terms/Privacy consent requirement, and the `terms_accepted_at` / `onboarding_completed_at` columns, so sign-up and sign-in land directly in the application. Time and week-start settings are derived from the user's device instead of manual configuration.

**Approved deviation:** The removed features were previously required by `docs/specs/PRD.md` (FR-ONB-09, FR-ONB-10), `docs/specs/UX-FLOWS.md` (UX-APP-04), and `docs/specs/TECHNICAL-DESIGN.md` (onboarding route group and profiles columns). The product owner approved the removal and the replacement device-time behavior. Spec documents were updated in place; historical plan `12-signup-onboarding-auth.md` remains as a record.

**Architecture:** The application layout no longer redirects based on `onboarding_completed_at`. A client component (`DeviceTimeSync`) detects the device timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone` and the week-start day via `Intl.Locale(navigator.language).weekInfo.firstDay`, overrides the account state before the first render, and syncs both values to `profiles` idempotently when they differ. `ProductOwner` and `getLocalWeekRange` carry `weekStart` so client and server session generation agree. Server-only sessions and `timezone_snapshot` history are preserved.

## Task 1: Database Migration for Column Removal

**Files:**
- `supabase/migrations/20260814000000_drop_terms_and_onboarding.sql` (new)
- `supabase/tests/00015_profiles_terms_onboarding.test.sql`
- `supabase/seed.sql`
- `src/lib/supabase/database.types.ts`

**Details:** Add an immutable migration dropping `profiles.terms_accepted_at` and `profiles.onboarding_completed_at` (indexes are dropped by the column drop). Rewrite the pgTAP test to assert both columns are absent (`hasnt_column`). Remove both columns from the seed upsert and the generated types.

**Verification:**
- [x] `supabase db reset` applied 20 migrations cleanly on 2026-08-14.
- [x] `supabase test db`: 13 pgTAP files / 129 tests pass.

**Commit:** `feat(db): drop terms acceptance and onboarding completion columns`

## Task 2: Remove the Onboarding Gate

**Files:**
- `src/app/(app)/app/layout.tsx`

**Details:** Remove the `onboarding_completed_at` select and the `redirect('/onboarding')` block. Signed-in users open private routes directly.

**Commit:** included in Task 3 commit.

## Task 3: Delete Onboarding Feature Code

**Files (deleted):**
- `src/app/(app)/onboarding/` (page + layout)
- `src/components/onboarding/onboarding-wizard.tsx`
- `src/domain/onboarding/profile-onboarding.ts`
- `tests/component/onboarding-wizard.test.tsx`
- `tests/unit/domain/profile-onboarding.test.ts`

**Files (modified):**
- `src/lib/navigation/route-definitions.ts` — remove `routes.onboarding`

**Commit:** `feat: remove required onboarding flow from sign-up and sign-in`

## Task 4: Device-Based Time Settings

**Files (new):**
- `src/lib/dates/device-time.ts`
- `src/components/account/device-time-sync.tsx`
- `tests/unit/dates/device-time.test.ts`
- `tests/component/device-time-sync.test.tsx`

**Files (modified):**
- `src/lib/dates/local-week.ts` — `getLocalWeekRange(localDate, weekStart = 1)`
- `src/lib/auth/account-context.ts` — `AccountContext.weekStart`
- `src/components/account/account-state.tsx` — export context, `AccountState.weekStart`
- `src/lib/repositories/product-repository.ts` — `ProductOwner.weekStart`
- `src/lib/repositories/signed-in/browser-product-repository.ts` — map `weekStart`
- `src/lib/repositories/signed-in/supabase-product-repository.ts` — weekly overview uses `owner.weekStart`
- `src/features/today/today-dashboard.tsx`, `src/features/habits/habits-management.tsx` — pass `owner.weekStart`
- `src/app/(app)/app/settings/page.tsx` — read-only device timezone row

**Details:** TDD — detection tests (device timezone and week-start fallbacks), week-range tests (Sunday/Monday/Saturday starts), and sync component tests (context override, idempotent profile write, no write without account or on match) were written first and verified red, then implementation made them green.

**Verification:**
- [x] Focused runs: 7 files / 34 tests pass on 2026-08-14.

**Commit:** `feat: use device timezone and week start settings`

## Task 5: Documentation

**Files (modified):**
- `docs/specs/PRD.md` — drop FR-ONB-09, replace FR-ONB-10 with device-based time, update §6.1, metrics, event taxonomy, MVP scope, hypothesis table
- `docs/specs/UX-FLOWS.md` — retitle §6, replace UX-APP-04, update first-visit path
- `docs/specs/TECHNICAL-DESIGN.md` — remove onboarding route group, update sign-in flow, profiles table
- `docs/specs/UI-SPEC.md` — remove first-time onboarding illustration
- `README.md` — auth/device-time section, route tree, doc list

**Commit:** `docs: remove onboarding, specify device-based time`

## Quality Gate

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm exec supabase db reset`
- [ ] `pnpm exec supabase test db`
