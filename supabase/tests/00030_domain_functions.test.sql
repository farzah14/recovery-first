begin;

select plan(16);

insert into auth.users (id, email)
values ('11000000-0000-4000-8000-000000000001', 'function-owner@example.invalid');
insert into public.profiles (id, timezone)
values ('11000000-0000-4000-8000-000000000001', 'Asia/Jakarta');

insert into public.habits (id, user_id, title)
values (
  '21000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000001',
  'Function Fixture Habit'
);

select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.create_habit_version(
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    1,
    '{"kind":"count","value":20}'::jsonb,
    '{"kind":"count","value":5}'::jsonb,
    '{"kind":"daily"}'::jsonb,
    '{"kind":"after_breakfast"}'::jsonb,
    '{"durationSessions":3,"successThreshold":2}'::jsonb,
    'creation',
    '41000000-0000-4000-8000-000000000001'
  )$$,
  'first habit version is created'
);

select results_eq(
  $$select version_number from public.habit_versions where id = '31000000-0000-4000-8000-000000000001'$$,
  $$values (1)$$,
  'first version number is one'
);

select lives_ok(
  $$select public.create_habit_version(
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    1,
    '{"kind":"count","value":20}'::jsonb,
    '{"kind":"count","value":5}'::jsonb,
    '{"kind":"daily"}'::jsonb,
    '{"kind":"after_breakfast"}'::jsonb,
    '{"durationSessions":3,"successThreshold":2}'::jsonb,
    'creation',
    '41000000-0000-4000-8000-000000000001'
  )$$,
  'duplicate version command replays safely'
);

select results_eq(
  $$select count(*)::integer from public.habit_versions where habit_id = '21000000-0000-4000-8000-000000000001'$$,
  $$values (1)$$,
  'duplicate command does not duplicate the version'
);

select throws_ok(
  $$select public.create_habit_version(
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    1,
    '{"kind":"count","value":20}'::jsonb,
    '{"kind":"count","value":6}'::jsonb,
    '{"kind":"daily"}'::jsonb,
    '{"kind":"after_breakfast"}'::jsonb,
    '{"durationSessions":3,"successThreshold":2}'::jsonb,
    'creation',
    '41000000-0000-4000-8000-000000000001'
  )$$,
  '22000',
  'idempotency_key_reused_with_different_request',
  'reusing a command ID with a different request is rejected'
);

select lives_ok(
  $$select public.activate_habit(
    '21000000-0000-4000-8000-000000000001',
    2,
    '42000000-0000-4000-8000-000000000001'
  )$$,
  'habit activation succeeds'
);

select results_eq(
  $$select lifecycle_state::text from public.habits where id = '21000000-0000-4000-8000-000000000001'$$,
  $$values ('starting'::text)$$,
  'activation moves the habit to Starting'
);

select lives_ok(
  $$select public.ensure_session(
    '51000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    '2026-08-01',
    '07:30',
    'Asia/Jakarta',
    '2026-08-01 00:30:00+00',
    '2026-08-04 16:59:59+00',
    '43000000-0000-4000-8000-000000000001'
  )$$,
  'deterministic session creation succeeds'
);

select lives_ok(
  $$select public.ensure_session(
    '51000000-0000-4000-8000-000000000099',
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    '2026-08-01',
    '07:30',
    'Asia/Jakarta',
    '2026-08-01 00:30:00+00',
    '2026-08-04 16:59:59+00',
    '43000000-0000-4000-8000-000000000002'
  )$$,
  'duplicate occurrence resolves to the existing session'
);

select results_eq(
  $$select count(*)::integer from public.sessions where habit_id = '21000000-0000-4000-8000-000000000001'$$,
  $$values (1)$$,
  'duplicate occurrence does not duplicate a session'
);

select lives_ok(
  $$select public.record_check_in(
    '61000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    'manual_skipped',
    'too_tired',
    null,
    '2026-08-01 07:35:00+07',
    'Asia/Jakarta',
    1,
    '44000000-0000-4000-8000-000000000001'
  )$$,
  'first Manual Skipped check-in succeeds'
);

select results_eq(
  $$select consecutive_manual_skips from public.habits where id = '21000000-0000-4000-8000-000000000001'$$,
  $$values (1)$$,
  'Manual Skipped increments the Recovery counter'
);

select lives_ok(
  $$select public.record_check_in(
    '61000000-0000-4000-8000-000000000099',
    '51000000-0000-4000-8000-000000000001',
    'minimum',
    null,
    null,
    '2026-08-01 08:00:00+07',
    'Asia/Jakarta',
    2,
    '44000000-0000-4000-8000-000000000002'
  )$$,
  'same-session edit succeeds'
);

select results_eq(
  $$select count(*)::integer from public.check_in_history where session_id = '51000000-0000-4000-8000-000000000001'$$,
  $$values (1)$$,
  'same-session edit preserves prior history'
);

select results_eq(
  $$select consecutive_manual_skips from public.habits where id = '21000000-0000-4000-8000-000000000001'$$,
  $$values (0)$$,
  'Minimum resets the Recovery counter'
);

select throws_ok(
  $$select public.activate_habit(
    '21000000-0000-4000-8000-000000000001',
    999,
    '42000000-0000-4000-8000-000000000099'
  )$$,
  '40001',
  'revision_conflict',
  'stale revisions are rejected'
);

select * from finish();
rollback;
