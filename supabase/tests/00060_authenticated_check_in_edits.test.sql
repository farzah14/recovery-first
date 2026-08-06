begin;

select plan(12);

insert into auth.users (id, email)
values ('15000000-0000-4000-8000-000000000001', 'edit-owner@example.invalid');

insert into public.profiles (id, timezone)
values ('15000000-0000-4000-8000-000000000001', 'Asia/Jakarta');

insert into public.habits (id, user_id, title, lifecycle_state)
values (
  '25000000-0000-4000-8000-000000000001',
  '15000000-0000-4000-8000-000000000001',
  'Edit Fixture Habit',
  'active'
);

insert into public.habit_versions (
  id,
  habit_id,
  user_id,
  version_number,
  normal_target,
  minimum_target,
  schedule_rule,
  source
)
values (
  '35000000-0000-4000-8000-000000000001',
  '25000000-0000-4000-8000-000000000001',
  '15000000-0000-4000-8000-000000000001',
  1,
  '{"kind":"count","value":20}'::jsonb,
  '{"kind":"count","value":5}'::jsonb,
  '{"kind":"daily"}'::jsonb,
  'creation'
);

update public.habits
set current_version_id = '35000000-0000-4000-8000-000000000001'
where id = '25000000-0000-4000-8000-000000000001';

insert into public.sessions (
  id,
  habit_id,
  habit_version_id,
  user_id,
  scheduled_local_date,
  timezone_snapshot,
  eligible_at,
  resolution_due_at,
  status,
  revision
)
values (
  '55000000-0000-4000-8000-000000000001',
  '25000000-0000-4000-8000-000000000001',
  '35000000-0000-4000-8000-000000000001',
  '15000000-0000-4000-8000-000000000001',
  (now() at time zone 'Asia/Jakarta')::date,
  'Asia/Jakarta',
  now() - interval '1 hour',
  now() + interval '2 days',
  'full',
  1
);

insert into public.check_ins (
  id,
  session_id,
  user_id,
  outcome,
  recorded_local_at,
  timezone_snapshot,
  revision
)
values (
  '65000000-0000-4000-8000-000000000001',
  '55000000-0000-4000-8000-000000000001',
  '15000000-0000-4000-8000-000000000001',
  'full',
  now(),
  'Asia/Jakarta',
  1
);

select set_config('request.jwt.claim.sub', '15000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"15000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.edit_same_day_check_in(
    '65000000-0000-4000-8000-000000000001',
    '55000000-0000-4000-8000-000000000001',
    'minimum',
    null,
    null,
    now(),
    'Asia/Jakarta',
    1,
    1,
    '73000000-0000-4000-8000-000000000001'
  )$$,
  'same-day edit succeeds for the authenticated owner'
);

select is(
  (select outcome::text from public.check_ins where id = '65000000-0000-4000-8000-000000000001'),
  'minimum',
  'edit updates the current check-in projection'
);

select is(
  (select revision from public.check_ins where id = '65000000-0000-4000-8000-000000000001'),
  2::bigint,
  'edit increments the check-in revision'
);

select is(
  (select status::text from public.sessions where id = '55000000-0000-4000-8000-000000000001'),
  'minimum',
  'edit updates the session status'
);

select is(
  (select revision from public.sessions where id = '55000000-0000-4000-8000-000000000001'),
  2::bigint,
  'edit increments the session revision'
);

select is(
  (select count(*)::integer from public.check_in_history where check_in_id = '65000000-0000-4000-8000-000000000001'),
  1,
  'edit appends exactly one immutable history row'
);

select is(
  (select previous_outcome::text from public.check_in_history where check_in_id = '65000000-0000-4000-8000-000000000001'),
  'full',
  'history preserves the replaced outcome'
);

select lives_ok(
  $$select public.edit_same_day_check_in(
    '65000000-0000-4000-8000-000000000001',
    '55000000-0000-4000-8000-000000000001',
    'minimum',
    null,
    null,
    now(),
    'Asia/Jakarta',
    1,
    1,
    '73000000-0000-4000-8000-000000000001'
  )$$,
  'the same edit command replays idempotently'
);

select is(
  (select count(*)::integer from public.check_in_history where check_in_id = '65000000-0000-4000-8000-000000000001'),
  1,
  'idempotent replay does not append duplicate history'
);

select throws_ok(
  $$select public.edit_same_day_check_in(
    '65000000-0000-4000-8000-000000000001',
    '55000000-0000-4000-8000-000000000001',
    'full',
    null,
    null,
    now(),
    'Asia/Jakarta',
    1,
    2,
    '73000000-0000-4000-8000-000000000002'
  )$$,
  '40001',
  'revision_conflict',
  'stale session revisions are rejected'
);

select throws_ok(
  $$select public.edit_same_day_check_in(
    '65000000-0000-4000-8000-000000000001',
    '55000000-0000-4000-8000-000000000001',
    'manual_skipped',
    'no_time',
    null,
    now() - interval '1 day',
    'Asia/Jakarta',
    2,
    2,
    '73000000-0000-4000-8000-000000000003'
  )$$,
  'P0001',
  'same_day_edit_closed',
  'edits with a different local day are rejected'
);

select is(
  (select previous_revision from public.check_in_history where check_in_id = '65000000-0000-4000-8000-000000000001'),
  1::bigint,
  'history stores the replaced revision'
);

select * from finish();
rollback;
