# Scheduled Unrecorded Session Expiration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Repository instructions require one agent and sequential execution.

**Goal:** Automatically convert overdue Unrecorded sessions to locked Automatic Skipped results through a bounded Supabase PostgreSQL Cron job.

**Architecture:** Add a private, server-time-based batch resolver that supports an optional owner filter and uses `FOR UPDATE SKIP LOCKED`. Keep the existing authenticated RPC as an owner-scoped wrapper, and schedule the private function every fifteen minutes with `pg_cron`.

**Tech Stack:** PostgreSQL 17+, Supabase Cron/`pg_cron`, pgTAP, TypeScript repository verification.

---

### Task 1: Add failing scheduled-resolution database tests

**Files:**

- Modify: `supabase/tests/00045_unrecorded_resolution.test.sql`

- [x] **Step 1: Extend the fixture for bounded cross-owner resolution**

Increase the pgTAP plan and add three overdue `unrecorded` sessions after the existing owner-scoped assertions. Use both existing owners and distinct deadlines so the test can prove owner filtering, oldest-first selection, and a one-row batch limit.

The assertions must call the wished-for private API directly:

```sql
select is(
  private.resolve_expired_unrecorded_batch(
    '14000000-0000-4000-8000-000000000001',
    1
  ),
  1,
  'an owner-filtered batch resolves one overdue session'
);

select results_eq(
  $$
    select user_id
    from public.sessions
    where id = '54000000-0000-4000-8000-000000000005'
      and status = 'automatic_skipped'
  $$,
  $$values ('14000000-0000-4000-8000-000000000001'::uuid)$$,
  'the owner filter cannot resolve another account'
);

select is(
  private.resolve_expired_unrecorded_batch(null, 1),
  1,
  'the system batch enforces its row limit'
);
```

Add result assertions showing the oldest remaining deadline changed first, a later candidate remains `unrecorded`, the final batch resolves the backlog, revisions increment, counters do not change, and each transitioned session has one audit event but no check-in.

- [x] **Step 2: Add security and cron-contract assertions**

Add pgTAP assertions for the private function and named schedule:

```sql
select is(
  has_function_privilege(
    'authenticated',
    'private.resolve_expired_unrecorded_batch(uuid,integer)',
    'execute'
  ),
  false,
  'authenticated users cannot execute the system resolver'
);

select results_eq(
  $$
    select schedule, command
    from cron.job
    where jobname = 'resolve-expired-unrecorded-sessions'
  $$,
  $$
    values (
      '*/15 * * * *'::text,
      'select private.resolve_expired_unrecorded_batch(null, 500)'::text
    )
  $$,
  'one scheduled job invokes the bounded system resolver every fifteen minutes'
);
```

Also inspect `pg_get_functiondef` and assert that the batch candidate query contains `FOR UPDATE SKIP LOCKED`.

- [x] **Step 3: Run the focused test and verify RED**

Run:

```bash
psql -v ON_ERROR_STOP=1 -d recovery_windows_final \
  -f supabase/tests/00045_unrecorded_resolution.test.sql
```

Expected: the test fails because `private.resolve_expired_unrecorded_batch(uuid, integer)` and the named cron job do not exist.

---

### Task 2: Add the private batch resolver and scheduled job

**Files:**

- Create: `supabase/migrations/20260905031000_schedule_unrecorded_resolution.sql`

- [x] **Step 1: Create the bounded private resolver**

Create the migration with the following function shape:

```sql
create extension if not exists pg_cron with schema pg_catalog;

create or replace function private.resolve_expired_unrecorded_batch(
  p_user_id uuid,
  p_limit integer default 500
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 500), 5000));
  v_resolved_count integer := 0;
begin
  with candidates as materialized (
    select s.id
    from public.sessions as s
    where s.status = 'unrecorded'
      and s.resolution_due_at < statement_timestamp()
      and (p_user_id is null or s.user_id = p_user_id)
    order by s.resolution_due_at, s.id
    for update skip locked
    limit v_limit
  ),
  resolved as (
    update public.sessions as s
    set status = 'automatic_skipped',
        status_source = 'system',
        revision = s.revision + 1
    from candidates
    where s.id = candidates.id
      and s.status = 'unrecorded'
    returning s.id, s.habit_id, s.user_id
  ),
  audited as (
    insert into private.audit_events (
      user_id,
      event_type,
      entity_type,
      entity_id,
      metadata
    )
    select
      resolved.user_id,
      'session_automatically_skipped',
      'session',
      resolved.id,
      jsonb_build_object(
        'habitId', resolved.habit_id,
        'reason', 'not_recorded_within_three_days',
        'statusSource', 'automatic'
      )
    from resolved
    returning 1
  )
  select count(*)::integer into v_resolved_count
  from audited;

  return v_resolved_count;
end;
$$;
```

Revoke execution from `public`, `anon`, `authenticated`, and `service_role`. Keep every object reference schema-qualified and do not expose this function through the browser API.

- [x] **Step 2: Replace the authenticated wrapper with delegation**

Keep `public.resolve_expired_unrecorded(timestamptz)` compatible with the TypeScript adapter. Validate `auth.uid()` and non-null `p_now`, then return:

```sql
return private.resolve_expired_unrecorded_batch(v_user_id, 5000);
```

Continue granting only the public wrapper to `authenticated`. The supplied timestamp remains a compatibility parameter; database `statement_timestamp()` is authoritative inside the private function.

- [x] **Step 3: Register the named schedule**

Use the name-based `cron.schedule` overload so applying the migration leaves one job with the approved definition:

```sql
select cron.schedule(
  'resolve-expired-unrecorded-sessions',
  '*/15 * * * *',
  'select private.resolve_expired_unrecorded_batch(null, 500)'
);
```

- [x] **Step 4: Run the focused test and verify GREEN**

Apply the migration to a clean local database, then run:

```bash
psql -v ON_ERROR_STOP=1 -d recovery_windows_final \
  -f supabase/tests/00045_unrecorded_resolution.test.sql
```

Expected: every assertion passes, including bounded ordering, cross-owner system resolution, account isolation, audit behavior, permissions, and the cron contract.

- [x] **Step 5: Commit the database behavior**

```bash
git add \
  supabase/migrations/20260905031000_schedule_unrecorded_resolution.sql \
  supabase/tests/00045_unrecorded_resolution.test.sql
git commit -m "fix: schedule expired session resolution"
```

---

### Task 3: Run database regression and scheduler verification

**Files:**

- Verify: `supabase/migrations/*.sql`
- Verify: `supabase/tests/*.sql`

- [x] **Step 1: Run a clean migration reset**

Run the complete ordered migration chain against the PostgreSQL test environment. Confirm `pg_cron` loads, all migrations apply exactly once, and the seed completes.

- [x] **Step 2: Run every pgTAP file**

Run each file under `supabase/tests/` with `ON_ERROR_STOP=1`. Record the exact number of files and assertions. No SQL failure or skipped required assertion is acceptable.

- [x] **Step 3: Inspect the registered job**

Run:

```sql
select jobname, schedule, command, active
from cron.job
where jobname = 'resolve-expired-unrecorded-sessions';
```

Expected: exactly one active row with `*/15 * * * *` and the bounded private-function command.

Check `cron.job_run_details` when the local scheduler supports background execution. If the local package cannot run the worker, record staging verification as a release requirement rather than claiming live scheduler execution.

---

### Task 4: Run the application quality gate and hand off

**Files:**

- Verify only; do not modify the unrelated reflection-note worktree changes.

- [x] **Step 1: Run application verification**

Run against committed scheduled-expiration code without collecting the unrelated failing reflection-note tests:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm check:env-example
pnpm check:repository
pnpm build
```

If the reflection-note red tests or contract changes prevent a clean current-worktree gate, create a temporary detached worktree at the scheduled-expiration commit and verify there. Do not stash, reset, overwrite, or commit the reflection-note files.

- [x] **Step 2: Review the final state**

Run:

```bash
git diff --check
git status --short --branch
git log --oneline -5
```

Confirm that only the previously existing reflection-note work remains uncommitted.

- [x] **Step 3: Report completion**

Report the migration and test files, commit hash, exact SQL and application test totals, build result, cron job definition, and any staging-only scheduler verification that remains.
