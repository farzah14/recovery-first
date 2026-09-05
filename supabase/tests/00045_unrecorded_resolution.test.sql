begin;

select plan(33);

insert into auth.users (id, email)
values
  ('14000000-0000-4000-8000-000000000001', 'resolution-owner@example.invalid'),
  ('14000000-0000-4000-8000-000000000002', 'resolution-other@example.invalid');

insert into public.profiles (id, timezone)
values
  ('14000000-0000-4000-8000-000000000001', 'Asia/Jakarta'),
  ('14000000-0000-4000-8000-000000000002', 'UTC');

insert into public.habits (id, user_id, title, lifecycle_state, consecutive_manual_skips)
values
  (
    '24000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000001',
    'Resolution Fixture',
    'active',
    2
  ),
  (
    '24000000-0000-4000-8000-000000000002',
    '14000000-0000-4000-8000-000000000002',
    'Other Resolution Fixture',
    'active',
    1
  );

insert into public.habit_versions (
  id, habit_id, user_id, version_number, normal_target, minimum_target, schedule_rule, source
)
values
  (
    '34000000-0000-4000-8000-000000000001',
    '24000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000001',
    1,
    '{"kind":"count","value":20}'::jsonb,
    '{"kind":"count","value":5}'::jsonb,
    '{"kind":"daily"}'::jsonb,
    'creation'
  ),
  (
    '34000000-0000-4000-8000-000000000002',
    '24000000-0000-4000-8000-000000000002',
    '14000000-0000-4000-8000-000000000002',
    1,
    '{"kind":"count","value":20}'::jsonb,
    '{"kind":"count","value":5}'::jsonb,
    '{"kind":"daily"}'::jsonb,
    'creation'
  );

insert into public.sessions (
  id,
  habit_id,
  habit_version_id,
  user_id,
  scheduled_local_date,
  scheduled_local_time,
  timezone_snapshot,
  eligible_at,
  resolution_due_at,
  status,
  status_source,
  revision
)
values
  (
    '54000000-0000-4000-8000-000000000001',
    '24000000-0000-4000-8000-000000000001',
    '34000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000001',
    (now() at time zone 'Asia/Jakarta')::date - 4,
    '07:00',
    'Asia/Jakarta',
    now() - interval '4 days',
    now() - interval '1 second',
    'unrecorded',
    'system',
    2
  ),
  (
    '54000000-0000-4000-8000-000000000002',
    '24000000-0000-4000-8000-000000000001',
    '34000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000001',
    (now() at time zone 'Asia/Jakarta')::date,
    '07:00',
    'Asia/Jakarta',
    now() - interval '1 hour',
    now() + interval '1 day',
    'unrecorded',
    'system',
    1
  ),
  (
    '54000000-0000-4000-8000-000000000003',
    '24000000-0000-4000-8000-000000000001',
    '34000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000001',
    (now() at time zone 'Asia/Jakarta')::date - 5,
    '07:00',
    'Asia/Jakarta',
    now() - interval '5 days',
    now() - interval '1 day',
    'manual_skipped',
    'user',
    4
  ),
  (
    '54000000-0000-4000-8000-000000000004',
    '24000000-0000-4000-8000-000000000002',
    '34000000-0000-4000-8000-000000000002',
    '14000000-0000-4000-8000-000000000002',
    (now() at time zone 'UTC')::date - 4,
    '07:00',
    'UTC',
    now() - interval '4 days',
    now() - interval '1 second',
    'unrecorded',
    'system',
    1
  );

select set_config('request.jwt.claim.sub', '14000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"14000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select is(
  public.resolve_expired_unrecorded(now()),
  1,
  'one overdue owner session is automatically resolved'
);

select results_eq(
  $$select status::text from public.sessions where id = '54000000-0000-4000-8000-000000000001'$$,
  $$values ('automatic_skipped'::text)$$,
  'overdue session becomes Automatic Skipped'
);

select results_eq(
  $$select status_source from public.sessions where id = '54000000-0000-4000-8000-000000000001'$$,
  $$values ('system'::text)$$,
  'automatic classification records system source'
);

select results_eq(
  $$select revision from public.sessions where id = '54000000-0000-4000-8000-000000000001'$$,
  $$values (3::bigint)$$,
  'automatic classification increments session revision'
);

select is_empty(
  $$select id from public.check_ins where session_id = '54000000-0000-4000-8000-000000000001'$$,
  'automatic classification does not create a check-in row'
);

select results_eq(
  $$select metadata ->> 'reason' from private.audit_events where entity_id = '54000000-0000-4000-8000-000000000001'$$,
  $$values ('not_recorded_within_three_days'::text)$$,
  'automatic classification records its reason'
);

select results_eq(
  $$select consecutive_manual_skips from public.habits where id = '24000000-0000-4000-8000-000000000001'$$,
  $$values (2)$$,
  'Automatic Skipped does not change the manual skip counter'
);

select results_eq(
  $$select status::text from public.sessions where id = '54000000-0000-4000-8000-000000000002'$$,
  $$values ('unrecorded'::text)$$,
  'in-window unrecorded sessions remain unresolved'
);

select results_eq(
  $$select status::text from public.sessions where id = '54000000-0000-4000-8000-000000000003'$$,
  $$values ('manual_skipped'::text)$$,
  'already-resolved sessions are unchanged'
);

select results_eq(
  $$select status::text from public.sessions where id = '54000000-0000-4000-8000-000000000004'$$,
  $$values ('unrecorded'::text)$$,
  'another user’s overdue session is not changed'
);

select is(
  public.resolve_expired_unrecorded(now()),
  0,
  'rerunning resolution is idempotent'
);

select results_eq(
  $$select count(*)::integer from private.audit_events where entity_id = '54000000-0000-4000-8000-000000000001'$$,
  $$values (1)$$,
  'rerunning resolution does not duplicate the audit event'
);

select is(
  has_function_privilege(
    'authenticated',
    'public.resolve_expired_unrecorded(timestamptz)',
    'execute'
  ),
  true,
  'authenticated users can execute the expiration command'
);

select is(
  has_function_privilege(
    'anon',
    'public.resolve_expired_unrecorded(timestamptz)',
    'execute'
  ),
  false,
  'anonymous users cannot execute the expiration command'
);

insert into public.sessions (
  id,
  habit_id,
  habit_version_id,
  user_id,
  scheduled_local_date,
  scheduled_local_time,
  timezone_snapshot,
  eligible_at,
  resolution_due_at,
  status,
  status_source,
  revision
)
values
  (
    '54000000-0000-4000-8000-000000000005',
    '24000000-0000-4000-8000-000000000001',
    '34000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000001',
    (now() at time zone 'Asia/Jakarta')::date - 4,
    '06:00',
    'Asia/Jakarta',
    now() - interval '4 days',
    now() - interval '3 hours',
    'unrecorded',
    'system',
    1
  ),
  (
    '54000000-0000-4000-8000-000000000006',
    '24000000-0000-4000-8000-000000000002',
    '34000000-0000-4000-8000-000000000002',
    '14000000-0000-4000-8000-000000000002',
    (now() at time zone 'UTC')::date - 4,
    '06:00',
    'UTC',
    now() - interval '4 days',
    now() - interval '2 hours',
    'unrecorded',
    'system',
    1
  ),
  (
    '54000000-0000-4000-8000-000000000007',
    '24000000-0000-4000-8000-000000000002',
    '34000000-0000-4000-8000-000000000002',
    '14000000-0000-4000-8000-000000000002',
    (now() at time zone 'UTC')::date - 4,
    '08:00',
    'UTC',
    now() - interval '4 days',
    now() - interval '1 hour',
    'unrecorded',
    'system',
    1
  );

select is(
  private.resolve_expired_unrecorded_batch(
    '14000000-0000-4000-8000-000000000001',
    1
  ),
  1,
  'an owner-filtered batch resolves one overdue session'
);

select results_eq(
  $$select status::text from public.sessions where id = '54000000-0000-4000-8000-000000000005'$$,
  $$values ('automatic_skipped'::text)$$,
  'the owner-filtered batch resolves the matching account'
);

select results_eq(
  $$select status::text from public.sessions where id = '54000000-0000-4000-8000-000000000006'$$,
  $$values ('unrecorded'::text)$$,
  'the owner filter cannot resolve another account'
);

select is(
  private.resolve_expired_unrecorded_batch(null, 1),
  1,
  'the system batch enforces its row limit'
);

select results_eq(
  $$select status::text from public.sessions where id = '54000000-0000-4000-8000-000000000006'$$,
  $$values ('automatic_skipped'::text)$$,
  'the system batch resolves the oldest remaining deadline first'
);

select results_eq(
  $$select status::text from public.sessions where id = '54000000-0000-4000-8000-000000000007'$$,
  $$values ('unrecorded'::text)$$,
  'a later candidate remains pending after a one-row batch'
);

select is(
  private.resolve_expired_unrecorded_batch(null, 500),
  2,
  'a later system batch resolves the remaining overdue backlog'
);

select results_eq(
  $$
    select id
    from public.sessions
    where id in (
      '54000000-0000-4000-8000-000000000004',
      '54000000-0000-4000-8000-000000000005',
      '54000000-0000-4000-8000-000000000006',
      '54000000-0000-4000-8000-000000000007'
    )
      and status = 'automatic_skipped'
    order by id
  $$,
  $$
    values
      ('54000000-0000-4000-8000-000000000004'::uuid),
      ('54000000-0000-4000-8000-000000000005'::uuid),
      ('54000000-0000-4000-8000-000000000006'::uuid),
      ('54000000-0000-4000-8000-000000000007'::uuid)
  $$,
  'system batches resolve overdue sessions across account owners'
);

select results_eq(
  $$select revision from public.sessions where id = '54000000-0000-4000-8000-000000000005'$$,
  $$values (2::bigint)$$,
  'system resolution increments the session revision'
);

select results_eq(
  $$
    select count(*)::integer
    from private.audit_events
    where entity_id in (
      '54000000-0000-4000-8000-000000000004',
      '54000000-0000-4000-8000-000000000005',
      '54000000-0000-4000-8000-000000000006',
      '54000000-0000-4000-8000-000000000007'
    )
      and event_type = 'session_automatically_skipped'
  $$,
  $$values (4)$$,
  'system resolution records one audit event per transition'
);

select is_empty(
  $$
    select id
    from public.check_ins
    where session_id in (
      '54000000-0000-4000-8000-000000000004',
      '54000000-0000-4000-8000-000000000005',
      '54000000-0000-4000-8000-000000000006',
      '54000000-0000-4000-8000-000000000007'
    )
  $$,
  'system resolution does not create check-in rows'
);

select results_eq(
  $$select id, consecutive_manual_skips from public.habits order by id$$,
  $$
    values
      ('24000000-0000-4000-8000-000000000001'::uuid, 2),
      ('24000000-0000-4000-8000-000000000002'::uuid, 1)
  $$,
  'system resolution preserves every Manual Skipped counter'
);

select is(
  private.resolve_expired_unrecorded_batch(null, 500),
  0,
  'rerunning the system batch is idempotent'
);

select has_function(
  'private',
  'resolve_expired_unrecorded_batch',
  array['uuid', 'integer'],
  'the private scheduled resolver exists'
);

select ok(
  position(
    'for update skip locked' in
    lower(pg_get_functiondef('private.resolve_expired_unrecorded_batch(uuid,integer)'::regprocedure))
  ) > 0,
  'the batch resolver skips rows locked by a concurrent worker'
);

select is(
  has_function_privilege(
    'authenticated',
    'private.resolve_expired_unrecorded_batch(uuid,integer)',
    'execute'
  ),
  false,
  'authenticated users cannot execute the system resolver'
);

select is(
  has_function_privilege(
    'anon',
    'private.resolve_expired_unrecorded_batch(uuid,integer)',
    'execute'
  ),
  false,
  'anonymous users cannot execute the system resolver'
);

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end;
$$;

select is(
  has_function_privilege(
    'service_role',
    'private.resolve_expired_unrecorded_batch(uuid,integer)',
    'execute'
  ),
  false,
  'the service role cannot invoke the system resolver through the API'
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

select * from finish();

rollback;
