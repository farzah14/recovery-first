# Sign-Up Onboarding, Consent, and Password Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. This project uses one agent only; do not dispatch subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the password-reset flow, a required one-time onboarding wizard (consent, profile, first habit), and explicit Terms of Service and Privacy Policy consent to account sign-up for both email and Google authentication paths.

**Architecture:** Supabase Auth supplies the recovery flow: `resetPasswordForEmail` sends a recovery link that returns to the auth callback with a `type=recovery` query parameter, which redirects to a server-rendered password-update page instead of the normal sign-in callback. Onboarding is a three-step client wizard — consent, profile, first habit — gated by the application layout: until `profiles.onboarding_completed_at` is set, every authenticated account route redirects to `/onboarding`. Consent is recorded once in `profiles.terms_accepted_at`; both timestamps are immutable after write.

**Tech Stack:** Next.js App Router, React, strict TypeScript, Supabase Auth and PostgreSQL, Tailwind CSS, shadcn-style UI primitives, Vitest, React Testing Library, pgTAP, pnpm.

---

# 1. Prerequisites and Boundaries

## Prerequisites

Begin only after Plans 01–11 are verified complete. The repository must already provide:

- Google and email OTP or magic-link authentication with a validated callback route;
- `profiles` table with display, locale, timezone, week-start, and quiet-hours fields;
- habits, habit versions, sessions, check-in, and recovery domain rules;
- `create-habit-dialog` category, icon, and clock preset options;
- the signed-in product repository and habit command builders;
- the application shell with `requireAccount` and `AccountStateProvider`.

## Explicit exclusions

This plan does not implement:

- password change from signed-in account settings (settings are in a later plan);
- account deletion, email-address changes, or profile image upload;
- re-consent flows for changed legal documents;
- onboarding resumption across sessions (completion is required in one pass per session; partial progress may be lost on refresh).

## Product invariants

- Consent is required before any private account functionality; an unauthenticated visitor cannot bypass it.
- `terms_accepted_at` and `onboarding_completed_at` are written once and never cleared by the wizard.
- The onboarding gate never blocks `/onboarding` itself, the auth routes, or public content.
- Password reset never exposes whether an email address has an account.
- The recovery link lands on a page that requires a fresh Supabase session before the password can change.
- The first-habit step reuses the existing habit-creation invariants and Free active-habit limits.
- RLS remains the final data-authorization boundary; the wizard writes only the caller's own `profiles` row.

---

# 2. Task Order and Commit Boundaries

## Task 1: Database Migration for Consent and Onboarding Columns

**Files:**

- `supabase/migrations/20260813100000_add_terms_and_onboarding.sql`
- `supabase/tests/00015_profiles_terms_onboarding.test.sql`

**Details:** Add `terms_accepted_at timestamptz` and `onboarding_completed_at timestamptz` (nullable) to `profiles`, plus indexes on both. Add a pgTAP test file (plan 8) asserting column presence, nullability, and that existing rows default to null so current accounts keep working.

- [x] Migration written and reviewed.
- [x] Database test written (plan 8, fixture `10000000-0000-0000-0000-000000000002`).
- [x] `supabase db reset` verified locally on 2026-08-14 (all 19 migrations applied; 13 pgTAP files / 135 tests pass, including `00015_profiles_terms_onboarding`).

**Commit:** `feat: add terms acceptance and onboarding completion to profiles`

## Task 2: Regenerate Supabase Database Types

**Files:**

- `src/lib/supabase/database.types.ts`

**Details:** Add `terms_accepted_at` and `onboarding_completed_at` to the `profiles` Row/Insert/Update types (alphabetical placement).

- [x] Manual edit applied (regeneration blocked by no Docker; `pnpm db:types` must run in CI).
- [x] `pnpm typecheck` passes.

**Commit:** included with Task 1 boundary (types are a direct mirror of the migration).

## Task 3: Onboarding Domain Rules

**Files:**

- `src/domain/onboarding/profile-onboarding.ts`
- `tests/unit/domain/profile-onboarding.test.ts`

**Details:** Define the ordered step list (`consent`, `profile`, `first-habit`), supported timezone and week-start option sets, `normalizeProfileInput` (writes `terms_accepted_at`), `normalizeHabitInput` (default targets, icon, start date, timing context), and quiet-hours validation.

- [x] `pnpm test` focused run: 9/9 pass.

**Commit:** `feat: add onboarding domain rules`

## Task 4: Onboarding Wizard (Consent, Profile, First Habit)

**Files:**

- `src/components/ui/label.tsx` (new Label primitive)
- `src/components/onboarding/onboarding-wizard.tsx`
- `src/app/(app)/onboarding/layout.tsx`
- `src/app/(app)/onboarding/page.tsx`
- `src/app/(app)/app/layout.tsx` (gate)
- `src/lib/navigation/route-definitions.ts`
- `tests/component/onboarding-wizard.test.tsx`

**Details:** The wizard renders under `requireAccount({ returnTo: '/onboarding' })`. Step 1 requires the consent checkbox (links to `/terms` and `/privacy`). Step 2 saves display name, timezone, week start, quiet hours, and `terms_accepted_at` to the caller's `profiles` row. Step 3 creates the first habit through the signed-in product repository and then sets `onboarding_completed_at`. The application layout redirects any authenticated account route to `/onboarding` while `onboarding_completed_at` is null.

- [x] `pnpm test:component` focused run: onboarding-wizard tests pass.
- [x] `pnpm lint`, `pnpm typecheck` pass.
- [x] Build includes `/onboarding` as a dynamic route.

**Commit:** `feat: add required one-time onboarding wizard with consent`

## Task 5: Password Reset Flow

**Files:**

- `src/app/auth/forgot-password/page.tsx`
- `src/app/auth/update-password/page.tsx`
- `src/app/auth/callback/route.ts` (recovery branch)
- `src/app/auth/sign-in/page.tsx` (forgot link)
- `src/lib/navigation/route-definitions.ts`
- `tests/component/forgot-password-page.test.tsx`
- `tests/component/update-password-page.test.tsx`

**Details:** The sign-in page links to `/auth/forgot-password`, which calls `resetPasswordForEmail` with `redirectTo` pointing at `/auth/callback?type=recovery`. The callback redirects recovery links to `/auth/update-password` before the normal profile bootstrap. The update page requires a valid Supabase session, validates password length and confirmation, and calls `updateUser`.

- [x] `pnpm test:component` focused run: both page tests pass.
- [x] `pnpm lint`, `pnpm typecheck` pass.

**Commit:** `feat: add password reset flow`

## Task 6: Specification and Plan Documentation

**Files:**

- `docs/specs/PRD.md`
- `docs/specs/UX-FLOWS.md`
- `docs/specs/TECHNICAL-DESIGN.md`
- `docs/implementation/12-signup-onboarding-auth.md` (this file)

**Details:** Record the three features in the PRD requirements, the auth and onboarding UX flows, and the technical design (profiles columns, routes, recovery-callback branch, onboarding gate).

- [x] Specs updated.

**Commit:** `docs: specify onboarding, consent, and password reset`

## Task 7: Feature Quality Gate

Run the baseline gate after the feature tasks:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:component
pnpm build
```

- [x] `pnpm lint` — 0 errors.
- [x] `pnpm typecheck` — clean.
- [x] `pnpm test` — 89 files, 360 tests passed.
- [x] `pnpm test:component` — new tests pass.
- [x] `pnpm build` — passes with `next build --webpack`.
- [ ] `pnpm format:check` — fails only on pre-existing untracked `BUG-REPORT.md` (not part of this plan; requires owner decision).
- [ ] Turbopack `pnpm build` — pre-existing machine issue ("Invalid symlink" during module resolution, first observed 2026-08-08, before this plan; unrelated to these changes).

---

# 3. Risks and Open Items

- Database tests and type regeneration require a Supabase environment (no Docker on this machine); both must run in CI before release.
- Consent timestamps are one-way; if legal documents change later, a re-consent flow is a separate plan.
- The onboarding wizard is single-pass per session; refresh mid-wizard restarts at step 1 without data loss (nothing is persisted until a step saves).
