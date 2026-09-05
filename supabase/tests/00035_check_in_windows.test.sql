begin;

truncate table auth.users cascade;

select plan(15);

insert into auth.users (id, email)
values ('13000000-0000-4000-8000-000000000001', 'window-owner@example.invalid');
insert into public.profiles (id, timezone)
values ('13000000-0000-4000-8000-000000000001', 'Asia/Jakarta');

insert into public.habits (id, user_id, title, lifecycle_state)
values (
  '23000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000001',
  'Check-in Window Fixture',
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
  '33000000-0000-4000-8000-000000000001',
  '23000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000001',
  1,
  '{"kind":"count","value":20}',
  '{"kind":"count","value":5}',
  '{"kind":"daily"}',
  'creation'
);

update public.habits
set current_version_id = '33000000-0000-4000-8000-000000000001'
where id = '23000000-0000-4000-8000-000000000001';

create temporary table test_session_clock (
  timezone_name text not null,
  local_date date not null
) on commit drop;

insert into test_session_clock (timezone_name, local_date)
select candidate.timezone_name, (now() at time zone candidate.timezone_name)::date
from (
  values ('Pacific/Kiritimati'), ('Pacific/Honolulu')
) as candidate(timezone_name)
where (now() at time zone candidate.timezone_name)::date <>
  (now() at time zone 'UTC')::date
limit 1;

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
  status
)
values
  (
    '53000000-0000-4000-8000-000000000001',
    '23000000-0000-4000-8000-000000000001',
    '33000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    (now() at time zone 'Asia/Jakarta')::date + 1,
    '07:00',
    'Asia/Jakarta',
    now() + interval '1 hour',
    now() + interval '4 days',
    'unrecorded'
  ),
  (
    '53000000-0000-4000-8000-000000000002',
    '23000000-0000-4000-8000-000000000001',
    '33000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    (now() at time zone 'Asia/Jakarta')::date - 5,
    '07:00',
    'Asia/Jakarta',
    now() - interval '5 days',
    now() - interval '1 second',
    'unrecorded'
  ),
  (
    '53000000-0000-4000-8000-000000000003',
    '23000000-0000-4000-8000-000000000001',
    '33000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    (now() at time zone 'Asia/Jakarta')::date - 4,
    '07:00',
    'Asia/Jakarta',
    now() - interval '4 days',
    now() - interval '1 second',
    'automatic_skipped'
  ),
  (
    '53000000-0000-4000-8000-000000000004',
    '23000000-0000-4000-8000-000000000001',
    '33000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    (now() at time zone 'Asia/Jakarta')::date,
    '07:00',
    'Asia/Jakarta',
    now() - interval '1 day',
    now() + interval '2 days',
    'unrecorded'
  ),
  (
    '53000000-0000-4000-8000-000000000005',
    '23000000-0000-4000-8000-000000000001',
    '33000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    (now() at time zone 'Asia/Jakarta')::date - 2,
    '07:00',
    'Asia/Jakarta',
    now() - interval '2 days',
    now() + interval '1 day',
    'unrecorded'
  ),
  (
    '53000000-0000-4000-8000-000000000007',
    '23000000-0000-4000-8000-000000000001',
    '33000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    (now() at time zone 'Asia/Jakarta')::date,
    '09:00',
    'Asia/Jakarta',
    now() - interval '1 hour',
    now() + interval '3 days',
    'excused'
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
  status
)
select
  '53000000-0000-4000-8000-000000000006',
  '23000000-0000-4000-8000-000000000001',
  '33000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000001',
  test_session_clock.local_date,
  '08:00',
  test_session_clock.timezone_name,
  now() - interval '1 hour',
  now() + interval '3 days',
  'unrecorded'
from test_session_clock;

insert into public.check_ins (
  id,
  session_id,
  user_id,
  outcome,
  recorded_local_at,
  timezone_snapshot
)
values
  (
    '63000000-0000-4000-8000-000000000004',
    '53000000-0000-4000-8000-000000000004',
    '13000000-0000-4000-8000-000000000001',
    'full',
    now() - interval '1 day',
    'Asia/Jakarta'
  ),
  (
    '63000000-0000-4000-8000-000000000006',
    '53000000-0000-4000-8000-000000000006',
    '13000000-0000-4000-8000-000000000001',
    'full',
    now(),
    (select timezone_name from test_session_clock)
  );

update public.sessions
set scheduled_local_date = case
      when id = '53000000-0000-4000-8000-000000000004'
        then scheduled_local_date - 1
      else scheduled_local_date
    end,
    status = 'full'
where id in (
  '53000000-0000-4000-8000-000000000004',
  '53000000-0000-4000-8000-000000000006'
);

select set_config('request.jwt.claim.sub', '13000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"13000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select throws_ok(
  $$select public.record_check_in(
    '63000000-0000-4000-8000-000000000001',
    '53000000-0000-4000-8000-000000000001',
    'full', null, null, now(), 'Asia/Jakarta', 1,
    '43000000-0000-4000-8000-000000000001'
  )$$,
  '55000',
  'session_not_yet_eligible',
  'future sessions reject check-ins'
);

select is_empty(
  $$select id from public.check_ins where session_id = '53000000-0000-4000-8000-000000000001'$$,
  'a rejected future check-in creates no row'
);

select throws_ok(
  $$select public.record_check_in(
    '63000000-0000-4000-8000-000000000002',
    '53000000-0000-4000-8000-000000000002',
    'minimum', null, null, now(), 'Asia/Jakarta', 1,
    '43000000-0000-4000-8000-000000000002'
  )$$,
  '55000',
  'session_resolution_window_closed',
  'expired Unrecorded sessions reject late classification'
);

select results_eq(
  $$select status::text from public.sessions where id = '53000000-0000-4000-8000-000000000002'$$,
  $$values ('unrecorded'::text)$$,
  'a rejected expired classification leaves the session unchanged'
);

select throws_ok(
  $$select public.record_check_in(
    '63000000-0000-4000-8000-000000000003',
    '53000000-0000-4000-8000-000000000003',
    'full', null, null, now(), 'Asia/Jakarta', 1,
    '43000000-0000-4000-8000-000000000003'
  )$$,
  '55000',
  'session_permanently_locked',
  'Automatic Skipped sessions reject classification permanently'
);

select results_eq(
  $$select status::text from public.sessions where id = '53000000-0000-4000-8000-000000000003'$$,
  $$values ('automatic_skipped'::text)$$,
  'a rejected permanent-lock write leaves Automatic Skipped unchanged'
);

select throws_ok(
  $$select public.record_check_in(
    '63000000-0000-4000-8000-000000000007',
    '53000000-0000-4000-8000-000000000007',
    'full', null, null, now(), 'Asia/Jakarta', 1,
    '43000000-0000-4000-8000-000000000007'
  )$$,
  '55000',
  'session_already_resolved',
  'resolved sessions without a check-in reject replacement classification'
);

select throws_ok(
  $$select public.record_check_in(
    '63000000-0000-4000-8000-000000000014',
    '53000000-0000-4000-8000-000000000004',
    'minimum', null, null, now(), 'Asia/Jakarta', 1,
    '43000000-0000-4000-8000-000000000004'
  )$$,
  '55000',
  'check_in_edit_window_closed',
  'recorded check-ins reject edits after the session local day'
);

select is_empty(
  $$select id from public.check_in_history where session_id = '53000000-0000-4000-8000-000000000004'$$,
  'a rejected edit creates no history row'
);

select lives_ok(
  $$select public.record_check_in(
    '63000000-0000-4000-8000-000000000005',
    '53000000-0000-4000-8000-000000000005',
    'minimum', null, null, now(), 'Asia/Jakarta', 1,
    '43000000-0000-4000-8000-000000000005'
  )$$,
  'Unrecorded sessions remain classifiable inside the resolution window'
);

select throws_ok(
  $$select public.record_check_in(
    '63000000-0000-4000-8000-000000000015',
    '53000000-0000-4000-8000-000000000005',
    'full', null, null, now(), 'Asia/Jakarta', 2,
    '43000000-0000-4000-8000-000000000015'
  )$$,
  '55000',
  'check_in_edit_window_closed',
  'a late classification locks immediately after confirmation'
);

select lives_ok(
  $$select public.record_check_in(
    '63000000-0000-4000-8000-000000000016',
    '53000000-0000-4000-8000-000000000006',
    'minimum', null, null, now(),
    (select timezone_name from test_session_clock), 1,
    '43000000-0000-4000-8000-000000000006'
  )$$,
  'same-day edits use the session timezone instead of the database timezone'
);

select results_eq(
  $$select count(*)::integer from public.check_in_history where session_id = '53000000-0000-4000-8000-000000000006'$$,
  $$values (1)$$,
  'an allowed same-day edit preserves history'
);

update public.sessions
set scheduled_local_date = scheduled_local_date - 1
where id = '53000000-0000-4000-8000-000000000006';

select lives_ok(
  $$select public.record_check_in(
    '63000000-0000-4000-8000-000000000016',
    '53000000-0000-4000-8000-000000000006',
    'minimum', null, null, now(),
    (select timezone_name from test_session_clock), 1,
    '43000000-0000-4000-8000-000000000006'
  )$$,
  'an idempotent replay succeeds after the edit window closes'
);

select is(
  has_function_privilege(
    'authenticated',
    'private.enforce_check_in_window()',
    'execute'
  ),
  false,
  'authenticated users cannot execute the private window guard directly'
);

select * from finish();
rollback;
