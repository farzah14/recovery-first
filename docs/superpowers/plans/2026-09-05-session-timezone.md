# Session Timezone Boundary Implementation Plan

> **For agentic workers:** Execute this plan sequentially in the current worktree. Complete each checkbox only after its fresh verification command passes.

**Goal:** Store `eligible_at` and `resolution_due_at` as the correct UTC instants for each session’s local schedule and timezone snapshot, including daylight-saving transitions.

**Architecture:** Add one deterministic IANA-timezone conversion helper based on `Intl.DateTimeFormat` parts. Use the scheduled local time for eligibility and local scheduled date plus three days at `23:59:59` for the resolution deadline. Existing local date, local time, and timezone snapshot fields remain the user-facing source of truth.

**Tech Stack:** TypeScript, ECMAScript `Intl`, Vitest, Supabase RPC payloads.

---

### Task 1: Add failing timezone regression tests

**Files:**
- Create: `tests/unit/dates/zoned-time.test.ts`
- Modify: `tests/unit/repositories/supabase-product-repository.test.ts`

- [x] **Step 1: Write the failing tests**

Prove that `2026-09-04 08:00` in `Asia/Jakarta` converts to `2026-09-04T01:00:00.000Z`, that a `23:59:59` deadline three local days later converts to `2026-09-07T16:59:59.000Z`, and that an America/Los_Angeles DST fallback date uses the correct offset. Add a repository assertion for the exact `ensure_session` timestamps.

- [x] **Step 2: Run focused tests before implementation**

```bash
pnpm exec vitest run tests/unit/dates/zoned-time.test.ts tests/unit/repositories/supabase-product-repository.test.ts
```

Expected: the helper import/test fails because the timezone conversion module does not yet exist, and the repository timestamp assertion exposes the current UTC-midnight payload.

### Task 2: Implement timezone-aware timestamp derivation

**Files:**
- Create: `src/lib/dates/zoned-time.ts`
- Modify: `src/lib/repositories/signed-in/supabase-product-repository.ts`

- [x] **Step 1: Implement deterministic local-to-UTC conversion**

Resolve a local ISO date/time in an IANA timezone by iterating against `Intl.DateTimeFormat(...).formatToParts`, returning an ISO UTC string and throwing `local_datetime_cannot_be_resolved` if the timezone cannot resolve the requested instant.

- [x] **Step 2: Use local schedule boundaries in session generation**

Derive eligibility from the session’s scheduled local time (or `00:00:00` when no time is available). Derive the deadline from the scheduled local date shifted three days at `23:59:59`, both using the habit timezone snapshot.

- [x] **Step 3: Run focused verification**

```bash
pnpm exec vitest run tests/unit/dates/zoned-time.test.ts tests/unit/repositories/supabase-product-repository.test.ts
pnpm typecheck
pnpm lint
```

### Task 3: Run the complete quality gate and commit

**Files:**
- Verify all changed files and existing SQL/application tests.

- [x] **Step 1: Run the full application verifier**

```bash
pnpm verify
```

Expected: all formatting, lint, type, test, repository, and build checks pass.

- [x] **Step 2: Commit the timezone fix**

```bash
git diff --check
git add docs/superpowers/plans/2026-09-05-session-timezone.md src/lib/dates/zoned-time.ts src/lib/repositories/signed-in/supabase-product-repository.ts tests/unit/dates/zoned-time.test.ts tests/unit/repositories/supabase-product-repository.test.ts
git commit -m "fix: derive session timestamps from timezone"
```
