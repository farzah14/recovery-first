begin;

select plan(14);

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

select * from finish();

rollback;
