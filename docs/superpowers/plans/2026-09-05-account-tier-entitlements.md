# Account Tier and Entitlement Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make displayed account tiers and repository limits use the verified entitlement contract, and prevent authenticated profile writes from changing the cached `plan_code`.

**Architecture:** Add an authenticated `public.effective_plan_tier()` RPC that delegates to the existing private entitlement resolver. Server layouts resolve that RPC before building account context, with a conservative Free/unavailable fallback on lookup failure; the account context no longer derives tier from profile data. Add a migration with column-level profile privileges and update the auth callback to rely on the database default.

**Tech Stack:** Next.js App Router Server Components, Supabase PostgreSQL/RLS, strict TypeScript, Vitest, pgTAP, pnpm.

---

### Task 1: Lock the verified tier contract in domain and account-context tests

**Files:**
- Modify: `tests/unit/auth/account-context.test.ts`
- Create: `tests/unit/auth/verified-account-tier.test.ts`
- Modify: `src/lib/auth/account-context.ts`
- Create: `src/lib/auth/verified-account-tier.ts`

- [x] **Step 1: Write the failing tests**

Update the account-context tests so a profile containing a stale `plan_code: 'premium'` does not control the result, while an explicitly supplied verified `planTier: 'lite'` does. Assert that the context carries `entitlementStatus: 'resolved'` for a verified result and defaults to Free/resolved when no result is supplied. Add a unit test for `readVerifiedAccountTier` that accepts a valid RPC tier and returns `{ planTier: 'premium', entitlementStatus: 'resolved' }`, and a second test that converts an RPC error into `{ planTier: 'free', entitlementStatus: 'unavailable' }`.

- [x] **Step 2: Run the focused tests to verify RED**

```bash
pnpm exec vitest run tests/unit/auth/account-context.test.ts tests/unit/auth/verified-account-tier.test.ts
```

Expected: the tests fail because account context still reads `profile.plan_code` and the verified-tier reader does not exist.

Verification: the focused run failed with the expected stale profile tier and missing module errors.

- [x] **Step 3: Implement the minimal account-context and RPC reader contracts**

Change `buildAccountContext` to accept a third options object:

```ts
type AccountContextOptions = {
  planTier?: PlanTier;
  entitlementStatus?: 'resolved' | 'unavailable';
};
```

Use `options.planTier ?? 'free'` and `options.entitlementStatus ?? 'resolved'`; never read `plan_code` from the profile type. Add the server-only `readVerifiedAccountTier(client)` helper, call `client.rpc('effective_plan_tier')`, validate the returned value with `isPlanTier`, and return the conservative Free/unavailable result for an RPC error or invalid value.

- [x] **Step 4: Run the focused tests to verify GREEN**

```bash
pnpm exec vitest run tests/unit/auth/account-context.test.ts tests/unit/auth/verified-account-tier.test.ts
```

Expected: all account-context and verified-tier tests pass.

Verification: the focused run passed 2 files and 4 tests.

### Task 2: Wire layouts and the repository read model to verified tier

**Files:**
- Modify: `src/app/(app)/app/layout.tsx`
- Modify: `src/app/(app)/onboarding/layout.tsx`
- Modify: `src/lib/repositories/signed-in/supabase-product-repository.ts`
- Modify: `src/lib/supabase/database.types.ts`
- Modify: `tests/unit/repositories/supabase-product-repository.test.ts`

- [x] **Step 1: Add a repository limit characterization**

Extend the existing Today repository test to assert Free returns `activeHabitLimit: 5`, and add a Lite owner fixture with the same persisted data that asserts `activeHabitLimit: 10`. These assertions characterize the existing contract before replacing the inline mapping with the shared policy.

- [x] **Step 2: Run the repository test**

```bash
pnpm exec vitest run tests/unit/repositories/supabase-product-repository.test.ts
```

Expected: the existing behavior passes the characterization assertions before the equivalent policy refactor.

Verification: the repository suite passed 19 tests before the refactor.

- [x] **Step 3: Add the public RPC type and wire both layouts**

Add `effective_plan_tier: { Args: Record<PropertyKey, never>; Returns: Database['public']['Enums']['plan_tier'] }` to the generated public `Functions` map. In each layout, select only the profile fields needed for display/onboarding, call `readVerifiedAccountTier(supabase)`, and pass its `planTier` and `entitlementStatus` to `buildAccountContext`. The application layout must perform this lookup before rendering `AccountStateProvider`; the onboarding layout uses the same reader so the account state is consistent across both authenticated shells.

- [x] **Step 4: Replace the duplicate limit mapping**

Import `activeHabitLimitFor` into the Supabase product repository and return `activeHabitLimitFor(owner.planTier)` from `getToday`.

- [x] **Step 5: Run focused affected tests**

```bash
pnpm exec vitest run tests/unit/auth/account-context.test.ts tests/unit/auth/verified-account-tier.test.ts tests/unit/repositories/supabase-product-repository.test.ts tests/component/account-tier-presentation.test.tsx tests/component/today-dashboard-page.test.tsx
```

Expected: all focused tests pass, including Free and Lite read-model limits.

Verification: the focused affected run passed 6 files and 44 tests.

### Task 3: Add the database RPC and restrict profile writes

**Files:**
- Create: `supabase/migrations/20260905050000_expose_verified_plan_tier.sql`
- Create: `supabase/tests/00055_verified_plan_tier_access.test.sql`
- Modify: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Write the database contract test**

Create a pgTAP test that inserts an auth user and profile, verifies `public.effective_plan_tier()` returns Free without an entitlement, inserts a valid Premium entitlement and verifies Premium, and asserts:

```sql
select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'plan_code', 'UPDATE'),
  'authenticated clients cannot update profiles.plan_code'
);
select ok(
  has_function_privilege('authenticated', 'public.effective_plan_tier()', 'EXECUTE'),
  'authenticated clients can resolve their verified plan tier'
);
```

Run the database test/reset command. In an environment with the local database available, this test is expected to fail before the migration because the public RPC and restricted column grants do not yet exist.

Verification: the test was written, but local RED verification is unavailable because the environment has no Docker/Postgres service.

- [x] **Step 2: Implement the migration**

Create the authenticated RPC as a stable SQL function that calls `private.effective_plan_tier(auth.uid())`, revoke function execution from `public` and `anon`, and grant it only to `authenticated`. Revoke table-level `INSERT` and `UPDATE` on `public.profiles` from `authenticated`, then grant `INSERT` for `id` and the profile preference/onboarding columns and `UPDATE` for those same preference/onboarding columns, leaving `plan_code` excluded. Preserve the existing owner-only RLS policies.

- [x] **Step 3: Make the auth callback rely on the database default**

Change the profile upsert payload from `{ id: user.id, plan_code: 'free' }` to `{ id: user.id }`, leaving the `plan_code` default responsible for new profiles and ensuring the callback does not require client-level access to that column.

- [ ] **Step 4: Run the database contract checks to verify GREEN**

```bash
pnpm exec supabase db reset
pnpm exec supabase test db
```

Expected: the migration applies, the verified-tier and profile-privilege assertions pass, and the existing SQL suite remains green.

### Task 4: Run the full quality gate, review, and commit

**Files:**
- Modify: `docs/superpowers/plans/2026-09-05-account-tier-entitlements.md`

- [ ] **Step 1: Run the complete verification**

```bash
pnpm verify
pnpm exec supabase db reset
pnpm exec supabase test db
git diff --check
```

Expected: the full Vitest suite, repository checks, production build, database reset, pgTAP suite, and whitespace check pass with zero failures.

- [ ] **Step 2: Review the staged diff and commit**

Review `git status --short`, `git diff --stat`, and the staged diff to confirm only Task 12 files changed. Mark plan checkboxes complete after the fresh verification succeeds, then commit:

```bash
git add docs/superpowers/specs/2026-09-05-account-tier-entitlements-design.md docs/superpowers/plans/2026-09-05-account-tier-entitlements.md src/lib/auth/account-context.ts src/lib/auth/verified-account-tier.ts 'src/app/(app)/app/layout.tsx' 'src/app/(app)/onboarding/layout.tsx' src/lib/repositories/signed-in/supabase-product-repository.ts src/lib/supabase/database.types.ts tests/unit/auth/account-context.test.ts tests/unit/auth/verified-account-tier.test.ts tests/unit/repositories/supabase-product-repository.test.ts supabase/migrations/20260905050000_expose_verified_plan_tier.sql supabase/tests/00055_verified_plan_tier_access.test.sql src/app/auth/callback/route.ts
git diff --cached --check
git commit -m "fix: derive account tier from verified entitlements"
```
