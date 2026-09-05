# Task 12 Account Tier and Entitlement Integrity

## Problem

The application shell currently reads `profiles.plan_code` to label the account and to seed the owner used by repository read models. Billing access is stored separately in `public.entitlements`, and authenticated users can update their own `plan_code`. The profile value can therefore disagree with the verified entitlement that the database uses for active-habit authorization.

## Decision

Expose a narrowly scoped authenticated RPC, `public.effective_plan_tier()`, that delegates to the existing `private.effective_plan_tier(auth.uid())`. This keeps the UI and server authorization on the same status, product, and validity-window rules, while preventing callers from selecting another user. The RPC returns `free`, `lite`, or `premium`; an RPC error is represented as a conservative Free tier with an `unavailable` entitlement status so the UI never grants paid access from stale profile data.

Account layouts will stop selecting or reading `profiles.plan_code`. They will resolve the verified tier through the RPC and pass it, together with the resolution status, into `AccountContext`. `buildAccountContext` will use the verified tier supplied by its caller and default to Free when no verified result is available. Repository read models will use the shared `activeHabitLimitFor` policy for the already verified owner tier, keeping the displayed limit mapping aligned with the SQL authorization limits.

Profile writes will be limited at the database column privilege boundary to preference and onboarding fields. Authenticated clients will retain the existing owner-only RLS policies and can update display name, locale, timezone, week start, quiet hours, terms acceptance, and onboarding completion, but cannot insert or update `plan_code`. The auth callback will omit `plan_code` and rely on the database default. Privileged billing workflows remain able to project authoritative entitlements through their existing service-role path.

## Out of scope

- Changing the entitlement statuses, product codes, validity windows, or active-habit limits already defined by the database contract.
- Synchronizing or deleting the cached `profiles.plan_code` column; it remains a legacy database field that is no longer used for authorization or display.
- Adding client-side billing queries or exposing service-role credentials.
- Changing checkout, webhook, reconciliation, downgrade, or subscription-page behavior beyond the shared tier read contract.
