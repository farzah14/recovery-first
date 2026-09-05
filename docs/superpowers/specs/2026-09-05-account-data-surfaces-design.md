# Account Data Surfaces Design

**Date:** 2026-09-05
**Scope:** Review, Insights, and Reminders account pages

## Problem

The authenticated Review, Insights, and Reminders pages currently render fixed example values and habit names. Those claims are disconnected from the signed-in account and can misrepresent personal progress, recommendations, or reminder delivery.

## Goals

- Render Review and Insights metrics from the authenticated account's persisted sessions.
- Render recommendations only when a persisted recommendation exists.
- Render reminder rows only from persisted reminder configuration records.
- Distinguish an enabled reminder schedule from actual Web Push registration.
- Show explicit empty or unavailable states when data is absent or a read fails.
- Keep every read scoped to the authenticated account and preserve the existing visual language.

## Non-goals

- Building the full Weekly Review decision workflow.
- Adding reminder creation, editing, Web Push delivery, or email delivery.
- Adding new database tables, views, or background jobs.
- Replacing the existing Today or Habits repository contracts.

## Architecture

Add a server-only account-surfaces reader with a small typed result covering the three pages. It receives the authenticated account ID and timezone, obtains the current local week, and reads sessions, review summary rows, recommendations, reminder configurations, email preferences, and active push subscriptions through the Supabase server client. The reader returns normalized data plus an `unavailable` flag when any account read cannot be trusted; pages never substitute sample data after an error.

The pages become server components that require an authenticated account, call the reader, and pass serializable results into focused presentational components. Review computes resolved-session completion and minimum-baseline counts from the week’s sessions. Insights computes full-target and non-zero rates from the same persisted outcomes and displays a persisted pending recommendation when one exists. Reminders joins reminder configurations to account-owned habit titles and reports `Enabled`, `Disabled`, or `Needs browser permission` from configuration and active push capability. Email configurations report their persisted opt-in state without claiming delivery.

## Data contracts

The reader uses these account-scoped records:

- `sessions`: `scheduled_local_date`, `status`, and `habit_id` for the current local week.
- `recommendations`: the newest pending row and its JSON explanation/evidence payload, when present.
- `reminder_configs`: `habit_id`, `channel`, `local_time`, `timezone`, and `enabled`.
- `habits`: titles for reminder rows, filtered to non-deleted account-owned habits.
- `email_preferences`: persisted opt-in/frequency state, when present.
- `push_subscriptions`: non-revoked capability rows for the account.

The normalized result is intentionally read-only:

```ts
type AccountSurfacesRead = {
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
```

Rows with no sessions, recommendations, or reminder configs are valid empty results. A failed query produces `status: 'unavailable'` and the pages render a truthful recovery message without partial fabricated values.

## Error handling and security

Each page calls `requireAccount` and the reader filters every table query by that account ID. The server client uses the authenticated SSR cookies and never exposes a service-role client. Query errors are logged only through the existing safe server boundary if logging is needed, then converted to the normalized unavailable result. The UI must not label a reminder as delivered based solely on an enabled configuration.

## Verification

- Unit tests cover session aggregation, recommendation normalization, reminder registration mapping, empty results, and query failure handling.
- Page/component tests assert that fixed example metrics and habit names are absent, persisted values render, and empty/unavailable states are explicit.
- Existing formatting, lint, typecheck, test, build, database, and browser smoke checks remain green.
