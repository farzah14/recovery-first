insert into private.foundation_metadata (key, value)
values
  ('seed_stage', 'database-domain-model'),
  ('seed_fixture_policy', 'synthetic-only')
on conflict (key) do update set value = excluded.value;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '13000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'seed-user@example.invalid',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  crypt('local-development-only', gen_salt('bf')),
  timezone('utc', now()),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  timezone('utc', now()),
  timezone('utc', now())
)
on conflict (id) do nothing;

insert into public.profiles (
  id,
  display_name,
  locale,
  timezone,
  week_start,
  plan_code
)
values (
  '13000000-0000-4000-8000-000000000001',
  'Seed User',
  'en-US',
  'Asia/Jakarta',
  1,
  'free'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  locale = excluded.locale,
  timezone = excluded.timezone,
  week_start = excluded.week_start;

insert into public.habits (
  id,
  user_id,
  title,
  category,
  lifecycle_state,
  revision
)
values (
  '23000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000001',
  'Read for ten minutes',
  'learning',
  'starting',
  1
)
on conflict (id) do nothing;

insert into public.habit_versions (
  id,
  habit_id,
  user_id,
  version_number,
  normal_target,
  minimum_target,
  schedule_rule,
  cue,
  recovery_structure,
  source
)
values (
  '33000000-0000-4000-8000-000000000001',
  '23000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000001',
  1,
  '{"kind":"duration_minutes","value":10}'::jsonb,
  '{"kind":"duration_minutes","value":2}'::jsonb,
  '{"kind":"daily"}'::jsonb,
  '{"kind":"after_breakfast"}'::jsonb,
  '{"durationSessions":3,"successThreshold":2}'::jsonb,
  'creation'
)
on conflict (id) do nothing;

update public.habits
set current_version_id = '33000000-0000-4000-8000-000000000001'
where id = '23000000-0000-4000-8000-000000000001';

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
  status_source
)
values (
  '43000000-0000-4000-8000-000000000001',
  '23000000-0000-4000-8000-000000000001',
  '33000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000001',
  '2026-08-01',
  '07:00',
  'Asia/Jakarta',
  '2026-08-01 00:00:00+00',
  '2026-08-04 16:59:59+00',
  'minimum',
  'user'
)
on conflict (id) do nothing;

insert into public.check_ins (
  id,
  session_id,
  user_id,
  outcome,
  recorded_local_at,
  timezone_snapshot
)
values (
  '53000000-0000-4000-8000-000000000001',
  '43000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000001',
  'minimum',
  '2026-08-01 07:05:00+07',
  'Asia/Jakarta'
)
on conflict (id) do nothing;
