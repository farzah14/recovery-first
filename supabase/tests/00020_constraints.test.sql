begin;

select plan(12);

insert into auth.users (id, email)
values ('10000000-0000-4000-8000-000000000001', 'fixture-owner@example.invalid');

insert into public.profiles (id, timezone)
values ('10000000-0000-4000-8000-000000000001', 'Asia/Jakarta');

insert into public.habits (id, user_id, title)
values (
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Fixture Habit'
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
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  1,
  '{"kind":"count","value":20}'::jsonb,
  '{"kind":"count","value":5}'::jsonb,
  '{"kind":"daily"}'::jsonb,
  'creation'
);

update public.habits
set current_version_id = '30000000-0000-4000-8000-000000000001'
where id = '20000000-0000-4000-8000-000000000001';

select throws_ok(
  $$insert into public.habits (id, user_id, title) values (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    ''
  )$$,
  '23514',
  null,
  'empty habit titles are rejected'
);

select throws_ok(
  $$update public.habit_versions
    set source = 'redesign'
    where id = '30000000-0000-4000-8000-000000000001'$$,
  '55000',
  'published_habit_versions_are_immutable',
  'published habit versions reject updates'
);

select throws_ok(
  $$delete from public.habit_versions
    where id = '30000000-0000-4000-8000-000000000001'$$,
  '55000',
  'published_habit_versions_are_immutable',
  'published habit versions reject deletes'
);

select throws_ok(
  $$insert into public.recovery_plans (
    id, habit_id, habit_version_id, user_id, target_definition,
    duration_sessions, success_threshold
  ) values (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '{}'::jsonb, 3, 4
  )$$,
  '23514',
  null,
  'Recovery threshold cannot exceed duration'
);

select throws_ok(
  $$insert into public.entitlements (
    id, user_id, product_code, status, valid_from, valid_until
  ) values (
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'premium', 'active', '2026-08-10', '2026-08-01'
  )$$,
  '23514',
  null,
  'entitlement validity window is ordered'
);

select has_table('public', 'recommendations', 'recommendations table exists');
select has_table('public', 'recovery_plans', 'Recovery plans table exists');
select has_table('public', 'review_cycles', 'review cycles table exists');
select has_table('public', 'review_items', 'review items table exists');
select has_table('public', 'reminder_configs', 'reminder configs table exists');
select has_table('public', 'entitlements', 'entitlements table exists');
select has_table('private', 'idempotency_records', 'idempotency records are private');

select * from finish();
rollback;
