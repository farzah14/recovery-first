# Scheduled Unrecorded Session Expiration Design

**Status:** Approved on 2026-09-05

**Scope:** Complete recovery analysis finding 4 by resolving expired Unrecorded sessions without requiring the user to open the application.

## Objective

Run a server-authoritative database job every fifteen minutes. Each run converts a bounded batch of sessions whose resolution window has passed from `unrecorded` to `automatic_skipped`. The operation must remain safe under overlapping runs, preserve Manual Skipped recovery counters, and record one audit event for each transition.

The existing authenticated read-time resolver remains available as a fallback. It continues to resolve only the current account's rows before Today and Habits reads.

## Architecture

Add a private PostgreSQL batch function and schedule it through Supabase PostgreSQL Cron (`pg_cron`). This keeps the state transition in the same transaction as the authoritative session rows and avoids an HTTP endpoint, service-role key, or shared cron secret.

The private function accepts an optional owner ID and a batch limit:

```sql
private.resolve_expired_unrecorded_batch(
  p_user_id uuid,
  p_limit integer default 500
) returns integer
```

Passing an owner ID limits work to that account. Passing `null` permits the database-owned scheduled job to process every account. Execute permission remains revoked from `public`, `anon`, `authenticated`, and `service_role`; the database migration owner runs the scheduled invocation.

The existing public RPC retains its current signature for application compatibility. After validating `auth.uid()`, it delegates to the private batch function with the authenticated account ID. Client-supplied time remains non-authoritative; `statement_timestamp()` determines expiration.

## Scheduled Job

The migration enables `pg_cron` when necessary and registers one named job:

- Job name: `resolve-expired-unrecorded-sessions`
- Schedule: `*/15 * * * *`
- Batch size: 500 sessions
- Command: invoke the private batch function without an owner filter

The migration must avoid duplicate named schedules. Database resets and deployments therefore leave exactly one active job with the approved cadence and command.

Five hundred transitions per run provides capacity for 48,000 overdue sessions per day while bounding locks, audit writes, and transaction duration. A remaining backlog is processed by later runs.

## Transaction and Concurrency

Each invocation:

1. Selects only `unrecorded` sessions with `resolution_due_at < statement_timestamp()`.
2. Applies the optional owner filter.
3. Orders candidates by `resolution_due_at`, then session ID.
4. Locks at most the clamped batch limit with `FOR UPDATE SKIP LOCKED`.
5. Updates locked rows to `automatic_skipped`, sets `status_source = 'system'`, and increments the revision.
6. Inserts one `session_automatically_skipped` audit event for each updated session.
7. Returns the number of transitioned sessions.

Concurrent jobs or account-triggered fallback calls skip rows already locked by another invocation. A repeated call finds no matching rows, so it creates no duplicate transition or audit event. Any error rolls back the batch; the next scheduled run retries it.

Automatic classification does not create a check-in row and does not update `habits.consecutive_manual_skips`.

## Security

The private function is `security definer`, uses a fixed safe search path, and schema-qualifies referenced objects. Browser roles and the Supabase service role cannot execute the system-wide function directly.

The scheduled command contains no credentials. Preview, staging, and production databases receive independent schedules when their migrations are applied, preserving environment isolation.

## Verification

Database tests must prove:

- the private function resolves overdue sessions across multiple owners when no owner filter is supplied;
- an owner filter cannot affect another account;
- the batch limit is enforced and the oldest overdue rows are processed first;
- in-window and already-resolved sessions remain unchanged;
- concurrent-safe selection uses the approved bounded query;
- session revisions, status source, and audit metadata are correct;
- no check-in row is created and Manual Skipped counters remain unchanged;
- replay returns zero and does not duplicate audit events;
- browser roles cannot execute the private function;
- exactly one named cron job exists with the approved schedule and command.

Fresh database reset and the complete SQL suite are required before completion. Application tests, formatting, lint, type checking, repository policy checks, and the production build must also pass. If the local Supabase environment cannot execute `pg_cron`, completion remains pending until the schedule is verified in a compatible staging database.

## Deployment and Rollback

Deploy the migration first, then confirm the named job in the target Supabase database and observe at least one successful run. Audit events provide per-session evidence of completed transitions.

Operators inspect `cron.job_run_details` for scheduler failures and execution duration. A failed run raises an operational alert when scheduled-job monitoring is connected later; the database transaction itself remains safe to retry without manual cleanup.

Rollback means disabling or unscheduling the named job. Already classified sessions are historical domain results and are not automatically reverted.
