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
  terms_accepted_at,
  onboarding_completed_at,
  plan_code
)
values (
  '13000000-0000-4000-8000-000000000001',
  'Seed User',
  'en-US',
  'Asia/Jakarta',
  1,
  '2026-01-01 00:00:00+00',
  '2026-01-01 00:00:00+00',
  'free'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  locale = excluded.locale,
  timezone = excluded.timezone,
  week_start = excluded.week_start,
  terms_accepted_at = excluded.terms_accepted_at,
  onboarding_completed_at = excluded.onboarding_completed_at;

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
  metadata,
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
  '{"version":1,"description":"Read a few pages to wind down and keep learning consistent.","icon":"reading","fromTime":"19:00","untilTime":"19:30","timingContext":"07:00 PM - 07:30 PM","startLocalDate":"2026-01-01","recurrence":{"kind":"daily"},"cue":{"type":"after_activity","value":"After dinner"}}'::jsonb,
  '{"durationSessions":3,"successThreshold":2}'::jsonb,
  'creation'
)
on conflict (id) do nothing;

update public.habits
set current_version_id = '33000000-0000-4000-8000-000000000001'
where id = '23000000-0000-4000-8000-000000000001';

insert into public.habits (
  id,
  user_id,
  title,
  category,
  lifecycle_state,
  revision
)
values
  (
    '26000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    'Daily Meditation',
    'mindfulness',
    'active',
    1
  ),
  (
    '27000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    'Morning Hydration',
    'health',
    'active',
    1
  ),
  (
    '28000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    'Read Tech Documentation',
    'learning',
    'paused',
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
  metadata,
  recovery_structure,
  source
)
values
  (
    '36000000-0000-4000-8000-000000000001',
    '26000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    1,
    '{"kind":"duration_minutes","value":10,"unit":"minutes","label":"10 minutes"}'::jsonb,
    '{"kind":"duration_minutes","value":2,"unit":"minutes","label":"2 minutes"}'::jsonb,
    '{"kind":"daily"}'::jsonb,
    '{"type":"time","value":"08:00 AM"}'::jsonb,
    '{"version":1,"description":"A short grounding practice to start the day with clarity.","icon":"meditation","fromTime":"08:00","untilTime":"09:00","timingContext":"08:00 AM - 09:00 AM","startLocalDate":"2026-01-01","recurrence":{"kind":"daily"},"cue":{"type":"time","value":"08:00 AM"}}'::jsonb,
    '{"durationSessions":3,"successThreshold":2}'::jsonb,
    'creation'
  ),
  (
    '38000000-0000-4000-8000-000000000001',
    '27000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    1,
    '{"kind":"quantity","value":500,"unit":"ml","label":"500 ml water"}'::jsonb,
    '{"kind":"quantity","value":250,"unit":"ml","label":"250 ml water"}'::jsonb,
    '{"kind":"daily"}'::jsonb,
    '{"type":"after_activity","value":"After breakfast"}'::jsonb,
    '{"version":1,"description":"Start the day hydrated before work begins.","icon":"water","fromTime":"09:00","untilTime":"09:15","timingContext":"09:00 AM - 09:15 AM","startLocalDate":"2026-01-01","recurrence":{"kind":"daily"},"cue":{"type":"after_activity","value":"After breakfast"}}'::jsonb,
    '{"durationSessions":3,"successThreshold":2}'::jsonb,
    'creation'
  ),
  (
    '39000000-0000-4000-8000-000000000001',
    '28000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    1,
    '{"kind":"duration_minutes","value":30,"unit":"minutes","label":"30 minutes reading"}'::jsonb,
    '{"kind":"duration_minutes","value":5,"unit":"minutes","label":"5 minutes reading"}'::jsonb,
    '{"kind":"weekdays","weekdays":[1,2,3,4,5]}'::jsonb,
    '{"type":"after_activity","value":"After evening meal"}'::jsonb,
    '{"version":1,"description":"Keep professional reading available without pressure.","icon":"reading","fromTime":"19:00","untilTime":"20:00","timingContext":"07:00 PM - 08:00 PM","startLocalDate":"2026-01-01","recurrence":{"kind":"weekdays","weekdays":[1,2,3,4,5]},"cue":{"type":"after_activity","value":"After evening meal"}}'::jsonb,
    '{"durationSessions":3,"successThreshold":2}'::jsonb,
    'creation'
  )
on conflict (id) do nothing;

update public.habits
set current_version_id = case id
  when '26000000-0000-4000-8000-000000000001' then '36000000-0000-4000-8000-000000000001'::uuid
  when '27000000-0000-4000-8000-000000000001' then '38000000-0000-4000-8000-000000000001'::uuid
  when '28000000-0000-4000-8000-000000000001' then '39000000-0000-4000-8000-000000000001'::uuid
end
where id in (
  '26000000-0000-4000-8000-000000000001',
  '27000000-0000-4000-8000-000000000001',
  '28000000-0000-4000-8000-000000000001'
);

-- Keep the synthetic browser fixture stable across CI runs. The production
-- schema intentionally defaults these timestamps to now(), but visual tests
-- must not change when the workflow runs on a different day.
update public.habits
set state_changed_at = '2026-01-01 00:00:00+00'::timestamptz,
    created_at = '2026-01-01 00:00:00+00'::timestamptz,
    updated_at = '2026-01-01 00:00:00+00'::timestamptz
where user_id = '13000000-0000-4000-8000-000000000001';

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
values
  (
    '63000000-0000-4000-8000-000000000001',
    '26000000-0000-4000-8000-000000000001',
    '36000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    '2026-01-15',
    '08:00',
    'Asia/Jakarta',
    '2026-01-15 01:00:00+00',
    '2026-01-18 16:59:59+00',
    'minimum',
    'user'
  ),
  (
    '73000000-0000-4000-8000-000000000001',
    '27000000-0000-4000-8000-000000000001',
    '38000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    '2026-01-15',
    '09:00',
    'Asia/Jakarta',
    '2026-01-15 02:00:00+00',
    '2026-01-18 16:59:59+00',
    'unrecorded',
    'system'
  ),
  (
    '83000000-0000-4000-8000-000000000001',
    '23000000-0000-4000-8000-000000000001',
    '33000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    '2026-01-15',
    '19:00',
    'Asia/Jakarta',
    '2026-01-15 12:00:00+00',
    '2026-01-18 16:59:59+00',
    'full',
    'user'
  )
on conflict (
  habit_id,
  habit_version_id,
  scheduled_local_date,
  scheduled_local_time
) do nothing;

-- These fixed historical fixtures intentionally bypass the runtime write-window
-- trigger. Supabase executes seed.sql as a trusted database owner after all
-- migrations, while application writes still run with the trigger enabled.
set session_replication_role = replica;

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
    '93000000-0000-4000-8000-000000000001',
    '63000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    'minimum',
    '2026-01-15 08:10:00+07',
    'Asia/Jakarta'
  ),
  (
    'A3000000-0000-4000-8000-000000000001',
    '83000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    'full',
    '2026-01-15 19:25:00+07',
    'Asia/Jakarta'
  )
on conflict (id) do nothing;

set session_replication_role = origin;

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

-- Keep the historical demo record stable without weakening production guards.
set session_replication_role = replica;

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

set session_replication_role = origin;
