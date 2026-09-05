# Account Data Surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fabricated Review, Insights, and Reminders account-page values with account-scoped persisted data and explicit empty or unavailable states.

**Architecture:** A server-only account-surfaces reader will load the current local week, persisted recommendations, reminder configurations, and channel registration state through the authenticated Supabase SSR client. Pure mappers will aggregate session outcomes and normalize reminder/recommendation values. The three server pages will pass the normalized read model to presentational components, which never substitute sample data after an empty result or query failure.

**Tech Stack:** Next.js App Router Server Components, React, TypeScript, Supabase SSR, Vitest, React Testing Library, pnpm.

---

### Task 1: Define and test the account-surface aggregation contracts

**Files:**
- Create: `src/server/account/account-surface-mappers.ts`
- Test: `tests/unit/account/account-surface-mappers.test.ts`

- [x] **Step 1: Write the failing mapper tests**

Create tests for these exact behaviors:

```ts
it('aggregates persisted outcomes into weekly and insight rates', () => {
  expect(
    summarizeSessionOutcomes([
      { status: 'full' },
      { status: 'minimum' },
      { status: 'manual_skipped' },
      { status: 'unrecorded' },
    ]),
  ).toEqual({
    resolvedSessions: 3,
    successfulSessions: 2,
    minimumSessions: 1,
    fullSessions: 1,
    fullTargetRate: 33.33,
    nonZeroRate: 66.67,
  });
});

it('returns null rates when no sessions are resolved', () => {
  expect(summarizeSessionOutcomes([{ status: 'unrecorded' }])).toMatchObject({
    resolvedSessions: 0,
    fullTargetRate: null,
    nonZeroRate: null,
  });
});

it('normalizes only readable persisted recommendation text', () => {
  expect(
    normalizeRecommendation({
      explanation_key: 'recommendation.reduce_target.repeated_too_difficult',
      evidence: { summary: 'Evening sessions are often skipped.' },
    }),
  ).toBe('Evening sessions are often skipped.');
  expect(
    normalizeRecommendation({ explanation_key: 'recommendation.unknown', evidence: {} }),
  ).toBeNull();
});

it('maps Web Push registration independently from reminder enablement', () => {
  expect(mapReminderRegistration('web_push', true)).toBe('registered');
  expect(mapReminderRegistration('web_push', false)).toBe('needs_permission');
  expect(mapReminderRegistration('email', false)).toBe('not_applicable');
});
```

The test fixture should use the session status union from `src/lib/supabase/database.types.ts` and should not import a page or Supabase client.

- [x] **Step 2: Run the mapper tests to verify RED**

Run:

```bash
pnpm exec vitest run tests/unit/account/account-surface-mappers.test.ts
```

Expected: the run fails because `src/server/account/account-surface-mappers.ts` and its exported functions do not exist.

Verification: the focused run failed during import resolution because the mapper module did not exist.

- [x] **Step 3: Implement the pure mapper functions**

Create the module with these exports:

```ts
export type AccountSessionOutcome =
  | 'unrecorded'
  | 'full'
  | 'minimum'
  | 'manual_skipped'
  | 'automatic_skipped'
  | 'excused';

export type SessionSurfaceMetrics = {
  resolvedSessions: number;
  successfulSessions: number;
  minimumSessions: number;
  fullSessions: number;
  fullTargetRate: number | null;
  nonZeroRate: number | null;
};

export function summarizeSessionOutcomes(
  rows: ReadonlyArray<{ status: AccountSessionOutcome }>,
): SessionSurfaceMetrics;

export function normalizeRecommendation(row: {
  explanation_key: string;
  evidence: unknown;
}): string | null;

export function mapReminderRegistration(
  channel: string,
  hasGrantedPushSubscription: boolean,
): 'registered' | 'needs_permission' | 'not_applicable';
```

Count `full`, `minimum`, `manual_skipped`, and `automatic_skipped` as resolved; count `full` and `minimum` as successful; count only `minimum` as minimum-baseline sessions. Round non-null percentages to two decimal places. `normalizeRecommendation` may return a string only when `evidence.summary` or `evidence.message` is a non-empty string; unknown payloads return `null`. Treat only `web_push` as requiring a granted push subscription.

- [x] **Step 4: Run the mapper tests to verify GREEN**

Run:

```bash
pnpm exec vitest run tests/unit/account/account-surface-mappers.test.ts
```

Expected: all mapper tests pass with no warnings.

Verification: the mapper suite passed 1 file and 4 tests; Prettier passed after formatting the new module and tests.

- [x] **Step 5: Commit the tested mapper contract**

```bash
git add src/server/account/account-surface-mappers.ts tests/unit/account/account-surface-mappers.test.ts
git diff --cached --check
git commit -m "feat: add account surface aggregation contracts"
```

### Task 2: Build the authenticated account-surfaces reader

**Files:**
- Create: `src/server/account/account-surfaces.ts`
- Test: `tests/unit/account/account-surfaces.test.ts`

- [x] **Step 1: Write the failing reader tests**

Create tests against an injected typed Supabase client double for these cases:

```ts
it('returns account-scoped Review, Insights, and Reminder data', async () => {
  const result = await readAccountSurfaces({
    client: clientWithRows({
      sessions: [
        { status: 'full', scheduled_local_date: '2026-09-03', habit_id: 'habit-1' },
        { status: 'minimum', scheduled_local_date: '2026-09-04', habit_id: 'habit-1' },
      ],
      weekly_review_summary_view: [{ pending_items: 2, window_end: '2026-09-06' }],
      recommendations: [
        {
          explanation_key: 'recommendation.shift_time',
          evidence: { summary: 'Evening sessions are often skipped.' },
        },
      ],
      reminder_configs: [
        {
          habit_id: 'habit-1',
          channel: 'web_push',
          local_time: '08:00:00',
          timezone: 'Asia/Jakarta',
          enabled: true,
        },
      ],
      habits: [{ id: 'habit-1', title: 'Morning Grounding' }],
      email_preferences: [{ reminder_opt_in: false }],
      push_subscriptions: [{ id: 'push-1' }],
    }),
    userId: 'user-1',
    timezone: 'Asia/Jakarta',
    now: new Date('2026-09-05T04:00:00.000Z'),
  });

  expect(result).toMatchObject({
    status: 'ready',
    review: {
      startDate: '2026-08-31',
      endDate: '2026-09-06',
      pendingItems: 2,
      resolvedSessions: 2,
      successfulSessions: 2,
      minimumSessions: 1,
    },
    insights: {
      fullTargetRate: 50,
      nonZeroRate: 100,
      recommendation: 'Evening sessions are often skipped.',
    },
    reminders: {
      emailOptIn: false,
      configs: [
        expect.objectContaining({
          habitId: 'habit-1',
          habitTitle: 'Morning Grounding',
          registration: 'registered',
        }),
      ],
    },
  });
});

it('returns an empty ready result when the account has no records', async () => {
  await expect(
    readAccountSurfaces({
      client: clientWithRows(),
      userId: 'user-1',
      timezone: 'UTC',
      now: new Date('2026-09-05T04:00:00.000Z'),
    }),
  ).resolves.toMatchObject({
    status: 'ready',
    review: { resolvedSessions: 0, pendingItems: 0 },
    insights: { fullTargetRate: null, nonZeroRate: null, recommendation: null },
    reminders: { configs: [], emailOptIn: false },
  });
});

it('returns unavailable instead of mixing partial data after a query error', async () => {
  await expect(
    readAccountSurfaces({
      client: clientWithError('sessions'),
      userId: 'user-1',
      timezone: 'UTC',
      now: new Date('2026-09-05T04:00:00.000Z'),
    }),
  ).resolves.toMatchObject({ status: 'unavailable' });
});
```

The fake client must record the `user_id` filters and date range so the test also asserts that sessions, recommendations, reminders, habits, email preferences, push subscriptions, and review summary queries are scoped to `user-1`.
Implement `clientWithRows` and `clientWithError` as test-local Supabase doubles with chainable `select`, `eq`, `in`, `is`, `gte`, `lte`, `order`, `limit`, and `maybeSingle` methods; each double should record table, column, and value arguments before returning the fixture row or error.

- [x] **Step 2: Run the reader tests to verify RED**

Run:

```bash
pnpm exec vitest run tests/unit/account/account-surfaces.test.ts
```

Expected: the run fails because the reader module and `AccountSurfacesRead` result type do not exist.

Verification: the focused run failed during import resolution because the reader module did not exist.

- [x] **Step 3: Implement the server-only reader**

Create `src/server/account/account-surfaces.ts` with `import 'server-only'`, the exported `AccountSurfacesRead` type, and:

```ts
export type AccountSurfacesRead = {
  status: 'ready' | 'unavailable';
  review: {
    startDate: string;
    endDate: string;
    pendingItems: number;
    resolvedSessions: number;
    successfulSessions: number;
    minimumSessions: number;
  };
  insights: {
    fullTargetRate: number | null;
    nonZeroRate: number | null;
    recommendation: string | null;
  };
  reminders: {
    configs: Array<{
      habitId: string;
      habitTitle: string;
      channel: 'web_push' | 'email';
      localTime: string;
      timezone: string;
      enabled: boolean;
      registration: 'registered' | 'needs_permission' | 'not_applicable';
    }>;
    emailOptIn: boolean;
  };
};

export async function readAccountSurfaces(input: {
  client: SupabaseClient<Database>;
  userId: string;
  timezone: string;
  now?: Date;
}): Promise<AccountSurfacesRead>;
```

Use `getLocalDateForTimezone` and `getLocalWeekRange` for the date window. Query all independent account-scoped datasets with the authenticated client, selecting only the columns required by the design. Choose the newest pending recommendation and newest review summary row. Join reminder configuration rows to non-deleted account-owned habit titles in memory. Mark Web Push registration as `registered` only when a non-revoked subscription has `capability_status = 'granted'`; email rows use `not_applicable`. Convert missing email preferences to `emailOptIn: false`. On any query error, return the week dates plus conservative empty fields and `status: 'unavailable'`; do not return successful partial data.

- [x] **Step 4: Run the reader tests to verify GREEN**

Run:

```bash
pnpm exec vitest run tests/unit/account/account-surfaces.test.ts
```

Expected: all reader tests pass, including account and date-range filter assertions.

Verification: the reader suite passed 1 file and 3 tests, including account filters and the Asia/Jakarta local-week range.

- [x] **Step 5: Commit the reader**

```bash
git add src/server/account/account-surfaces.ts tests/unit/account/account-surfaces.test.ts
git diff --cached --check
git commit -m "feat: read account data surfaces from Supabase"
```

### Task 3: Render persisted Review and Insights data

**Files:**
- Create: `src/components/account/account-data-panels.tsx`
- Modify: `src/app/(app)/app/review/page.tsx`
- Modify: `src/app/(app)/app/insights/page.tsx`
- Test: `tests/component/account-data-panels.test.tsx`

- [x] **Step 1: Write the failing panel tests**

Render focused panel components with ready, empty, and unavailable read models. Assert that persisted rates and recommendation text render, fixed values `85%`, `92%`, `98%`, `14`, and `2` never render, and empty/unavailable messages are explicit. Assert that a ready reminder-free Review/Insights state does not invent a recommendation.

- [x] **Step 2: Run the panel tests to verify RED**

```bash
pnpm exec vitest run tests/component/account-data-panels.test.tsx
```

Expected: the run fails because the presentational components do not exist.

Verification: the focused run failed during import resolution because the panel module did not exist.

- [x] **Step 3: Implement the Review and Insights panels and page readers**

Create serializable `ReviewPanel` and `InsightsPanel` components that accept `AccountSurfacesRead`. Format non-null rates as percentages and render an em dash for null metrics. Review should label the minimum count as `Minimum baseline sessions`, show pending review items only from `pendingItems`, and display `No sessions recorded for this week yet.` when the ready result has no resolved sessions. Insights should display `No recommendation available yet.` when `recommendation` is null. Unavailable reads must display `Account data is temporarily unavailable. Please try again shortly.` without sample numbers.

Convert both pages to async Server Components with `dynamic = 'force-dynamic'`. Each page must call `requireAccount` with its route, create the authenticated Supabase server client, call `readAccountSurfaces` with the account ID and account timezone, and render the panel inside the existing `AppShell`. Remove `'use client'` from the pages; the panel module must remain server-compatible.

- [x] **Step 4: Run the panel tests to verify GREEN**

```bash
pnpm exec vitest run tests/component/account-data-panels.test.tsx
```

Expected: all Review and Insights populated, empty, unavailable, and anti-fabrication assertions pass.

Verification: the panel suite passed 1 file and 4 Review/Insights tests; typecheck passed after the page readers were wired.

- [x] **Step 5: Commit the Review and Insights surfaces**

```bash
git add src/components/account/account-data-panels.tsx 'src/app/(app)/app/review/page.tsx' 'src/app/(app)/app/insights/page.tsx' tests/component/account-data-panels.test.tsx
git diff --cached --check
git commit -m "fix: render persisted review and insight data"
```

### Task 4: Render truthful reminder configuration and registration state

**Files:**
- Modify: `src/components/account/account-data-panels.tsx`
- Modify: `src/app/(app)/app/reminders/page.tsx`
- Modify: `tests/component/account-data-panels.test.tsx`

- [x] **Step 1: Extend the failing panel tests for reminders**

Add assertions that a persisted reminder renders its actual habit title, local time, timezone, channel, and status; a disabled config renders `Disabled`; an enabled Web Push config without a granted subscription renders `Needs browser permission`; email opt-in is reported as persisted preference text; and an empty result renders `No reminder schedules configured yet.` without `Morning Meditation` or `Hydration & Water`.

- [x] **Step 2: Implement the Reminders panel and page reader**

Add a `RemindersPanel` that maps each persisted config to a row. Use `Disabled` whenever `enabled` is false, `Needs browser permission` for enabled Web Push without `registered`, and `Enabled` for enabled email or registered Web Push. Show the email opt-in state without claiming that email was delivered. On an unavailable read, show the shared unavailable message and no rows. Convert the page to an async Server Component using the same authenticated reader and `AppShell showCreateHabitActions={false}`.

- [x] **Step 3: Run the reminder and affected panel tests**

```bash
pnpm exec vitest run tests/component/account-data-panels.test.tsx tests/unit/account/account-surface-mappers.test.ts tests/unit/account/account-surfaces.test.ts
```

Expected: all reminder, panel, mapper, and reader tests pass.

Verification: the affected run passed 3 files and 13 tests; typecheck passed.

- [x] **Step 4: Commit the Reminders surface**

```bash
git add src/components/account/account-data-panels.tsx 'src/app/(app)/app/reminders/page.tsx' tests/component/account-data-panels.test.tsx
git diff --cached --check
git commit -m "fix: show persisted reminder registration state"
```

### Task 5: Run the quality gate and prepare the pull request

**Files:**
- Modify: `docs/superpowers/plans/2026-09-05-account-data-surfaces.md`

- [x] **Step 1: Run focused and full verification**

```bash
pnpm exec vitest run tests/unit/account/account-surface-mappers.test.ts tests/unit/account/account-surfaces.test.ts tests/component/account-data-panels.test.tsx
pnpm verify
pnpm exec supabase db reset
pnpm exec supabase test db
git diff --check
```

Expected: focused tests and the full application, database, and whitespace checks pass. If local Docker/Postgres is unavailable, record that limitation and rely on the hosted Supabase CI job for database verification; do not mark the database step complete until that hosted job passes.

Verification: the focused run passed 3 files and 13 tests. `pnpm verify` passed formatting, lint, typecheck, all 90 test files and 363 tests, environment/repository checks, and the Next production build. `git diff --check` passed. Local `supabase db reset` returned `LegacyDbBootstrapError: failed to inspect service`, and `supabase test db` returned `LegacyDbConnectError: failed to connect to postgres`; the hosted Supabase database job passed in [workflow run 33975408095](https://github.com/farzah14/recovery-first/actions/runs/33975408095).

- [x] **Step 2: Review the diff and mark the plan complete**

Review:

```bash
git status --short
git diff --stat origin/main...HEAD
git diff --check
```

Confirm that only the account-surfaces design/plan, reader, mappers, panels, three pages, and their tests changed. After fresh verification succeeds, mark every checkbox complete and record the exact local and hosted results in this plan.

Verification: the diff contains only the account-surfaces design/plan, reader, mappers, panels, the Review/Insights/Reminders pages, and their tests; the worktree has no generated `next-env.d.ts` change and no whitespace errors.

- [x] **Step 3: Commit, push, and verify the pull request**

```bash
git add docs/superpowers/plans/2026-09-05-account-data-surfaces.md
git diff --cached --check
git commit -m "docs: record account data surface verification"
git push --set-upstream origin fix/account-data-surfaces
gh pr create --base main --head fix/account-data-surfaces --title "Fix account pages to use persisted data" --body-file /tmp/account-data-surfaces-pr.md
gh pr checks --watch --interval 10
```

The pull request body must state that Review, Insights, and Reminders no longer display fabricated personal data, name the account-scoped Supabase reader, list the local test count, and link the hosted database and browser checks. Do not claim the work is merged; leave the PR open for review.

Verification: branch `fix/account-data-surfaces` was pushed and [PR #15](https://github.com/farzah14/recovery-first/pull/15) was opened. The [Application quality](https://github.com/farzah14/recovery-first/actions/runs/33975408095/job/101331112769), [Supabase database](https://github.com/farzah14/recovery-first/actions/runs/33975408095/job/101331113243), [Browser smoke tests](https://github.com/farzah14/recovery-first/actions/runs/33975408095/job/101331112977), Vercel, and Vercel Preview Comments checks all passed.
