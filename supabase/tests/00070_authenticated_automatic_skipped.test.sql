begin;

select plan(10);

insert into auth.users (id, email)
values
  ('14000000-0000-4000-8000-000000000001', 'resolver-owner@example.invalid'),
  ('14000000-0000-4000-8000-000000000002', 'resolver-other@example.invalid');

insert into public.profiles (id, timezone)
values
  ('14000000-0000-4000-8000-000000000001', 'Asia/Jakarta'),
  ('14000000-0000-4000-8000-000000000002', 'UTC');

insert into public.habits (id, user_id, title, lifecycle_state)
values
  ('24000000-0000-4000-8000-000000000001', '14000000-0000-4000-8000-000000000001', 'Resolver Habit', 'active'),
  ('24000000-0000-4000-8000-000000000002', '14000000-0000-4000-8000-000000000002', 'Other Habit', 'active');

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

update public.habits
set current_version_id = '34000000-0000-4000-8000-000000000001'
where id = '24000000-0000-4000-8000-000000000001';

update public.habits
set current_version_id = '34000000-0000-4000-8000-000000000002'
where id = '24000000-0000-4000-8000-000000000002';

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
  revision
)
values
  (
    '54000000-0000-4000-8000-000000000001',
    '24000000-0000-4000-8000-000000000001',
    '34000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000001',
    (now() at time zone 'Asia/Jakarta')::date,
    null,
    'Asia/Jakarta',
    now() - interval '2 days',
    now() - interval '1 hour',
    'unrecorded',
    1
  ),
  (
    '54000000-0000-4000-8000-000000000002',
    '24000000-0000-4000-8000-000000000001',
    '34000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000001',
    (now() at time zone 'Asia/Jakarta')::date,
    '12:00',
    'Asia/Jakarta',
    now(),
    now() + interval '1 hour',
    'unrecorded',
    1
  ),
  (
    '54000000-0000-4000-8000-000000000003',
    '24000000-0000-4000-8000-000000000002',
    '34000000-0000-4000-8000-000000000002',
    '14000000-0000-4000-8000-000000000002',
    (now() at time zone 'UTC')::date,
    null,
    'UTC',
    now() - interval '2 days',
    now() - interval '1 hour',
    'unrecorded',
    1
  );

select set_config('request.jwt.claim.sub', '14000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"14000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select is(
  public.resolve_unrecorded_sessions(now()),
  1,
  'only the authenticated owner''s expired session is resolved'
);

select is(
  (select status::text from public.sessions where id = '54000000-0000-4000-8000-000000000001'),
  'automatic_skipped',
  'expired session receives the Automatic Skipped status'
);

select is(
  (select status_source from public.sessions where id = '54000000-0000-4000-8000-000000000001'),
  'system',
  'Automatic Skipped is system-classified'
);

select is(
  (select revision from public.sessions where id = '54000000-0000-4000-8000-000000000001'),
  2::bigint,
  'Automatic Skipped increments the session revision'
);

select is(
  (select count(*)::integer from public.check_ins where session_id = '54000000-0000-4000-8000-000000000001'),
  0,
  'Automatic Skipped does not create a manual check-in'
);

select is(
  (select consecutive_manual_skips from public.habits where id = '24000000-0000-4000-8000-000000000001'),
  0,
  'Automatic Skipped does not increment the manual recovery counter'
);

select is(
  public.resolve_unrecorded_sessions(now()),
  0,
  're-running resolution is idempotent'
);

select is(
  (select status::text from public.sessions where id = '54000000-0000-4000-8000-000000000002'),
  'unrecorded',
  'a non-expired owner session remains unrecorded'
);

select is(
  (select status::text from public.sessions where id = '54000000-0000-4000-8000-000000000003'),
  'unrecorded',
  'another user''s expired session is not changed'
);

select is(
  (select count(*)::integer from public.check_ins where user_id = '14000000-0000-4000-8000-000000000002'),
  0,
  'cross-user resolution cannot create records for another account'
);

select * from finish();
rollback;
