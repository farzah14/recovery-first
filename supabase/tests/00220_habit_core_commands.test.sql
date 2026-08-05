begin;

select plan(11);

insert into auth.users (id, email)
values ('15000000-0000-4000-8000-000000000001', 'core-loop-owner@example.invalid');
insert into public.profiles (id, timezone)
values ('15000000-0000-4000-8000-000000000001', 'Asia/Jakarta');

select set_config('request.jwt.claim.sub', '15000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"15000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.create_habit(
    '25000000-0000-4000-8000-000000000001',
    '35000000-0000-4000-8000-000000000001',
    'Daily Grounding',
    'Mindfulness',
    '{"kind":"count","value":10,"unit":"minutes"}'::jsonb,
    '{"kind":"count","value":2,"unit":"minutes"}'::jsonb,
    '{"kind":"daily","fromTime":"08:00","untilTime":"09:00","startLocalDate":"2026-08-06"}'::jsonb,
    '{"type":"time","value":"08:00"}'::jsonb,
    '{"version":1,"description":"A short grounding practice.","icon":"meditation"}'::jsonb,
    '{"durationSessions":3,"successThreshold":2}'::jsonb,
    true,
    '45000000-0000-4000-8000-000000000001'
  )$$,
  'atomic habit creation succeeds'
);

select results_eq(
  $$select title from public.habits where id = '25000000-0000-4000-8000-000000000001'$$,
  $$values ('Daily Grounding'::text)$$,
  'created habit title is persisted'
);

select results_eq(
  $$select lifecycle_state::text from public.habits where id = '25000000-0000-4000-8000-000000000001'$$,
  $$values ('starting'::text)$$,
  'created active habit starts in the slot-consuming state'
);

select results_eq(
  $$select (schedule_rule->>'fromTime') from public.habit_versions where id = '35000000-0000-4000-8000-000000000001'$$,
  $$values ('08:00'::text)$$,
  'schedule metadata is persisted with the immutable version'
);

select results_eq(
  $$select (cue->>'value') from public.habit_versions where id = '35000000-0000-4000-8000-000000000001'$$,
  $$values ('08:00'::text)$$,
  'cue metadata is persisted'
);

select lives_ok(
  $$select public.create_habit(
    '25000000-0000-4000-8000-000000000001',
    '35000000-0000-4000-8000-000000000001',
    'Daily Grounding',
    'Mindfulness',
    '{"kind":"count","value":10,"unit":"minutes"}'::jsonb,
    '{"kind":"count","value":2,"unit":"minutes"}'::jsonb,
    '{"kind":"daily","fromTime":"08:00","untilTime":"09:00","startLocalDate":"2026-08-06"}'::jsonb,
    '{"type":"time","value":"08:00"}'::jsonb,
    '{"version":1,"description":"A short grounding practice.","icon":"meditation"}'::jsonb,
    '{"durationSessions":3,"successThreshold":2}'::jsonb,
    true,
    '45000000-0000-4000-8000-000000000001'
  )$$,
  'replaying the create command is idempotent'
);

select lives_ok(
  $$select public.set_habit_lifecycle(
    '25000000-0000-4000-8000-000000000001',
    2,
    'paused',
    '46000000-0000-4000-8000-000000000001'
  )$$,
  'pausing an active habit succeeds'
);

select results_eq(
  $$select lifecycle_state::text from public.habits where id = '25000000-0000-4000-8000-000000000001'$$,
  $$values ('paused'::text)$$,
  'pause changes the lifecycle state'
);

select throws_ok(
  $$select public.set_habit_lifecycle(
    '25000000-0000-4000-8000-000000000001',
    1,
    'trash',
    '46000000-0000-4000-8000-000000000002'
  )$$,
  '40001',
  'revision_conflict',
  'stale lifecycle revisions are rejected'
);

select lives_ok(
  $$select public.redesign_habit(
    '25000000-0000-4000-8000-000000000001',
    'Updated Grounding',
    'Mindfulness',
    '37000000-0000-4000-8000-000000000001',
    3,
    '{"kind":"count","value":20,"unit":"minutes","label":"20 minutes grounding"}'::jsonb,
    '{"kind":"count","value":3,"unit":"minutes","label":"3 minutes grounding"}'::jsonb,
    '{"kind":"daily","fromTime":"09:00","untilTime":"10:00","startLocalDate":"2026-08-07"}'::jsonb,
    '{"type":"time","value":"09:00"}'::jsonb,
    '{"version":1,"description":"Updated grounding practice.","icon":"exercise","fromTime":"09:00","untilTime":"10:00","timingContext":"09:00 AM - 10:00 AM","startLocalDate":"2026-08-07","recurrence":{"kind":"daily"},"cue":{"type":"time","value":"09:00"}}'::jsonb,
    '{"durationSessions":3,"successThreshold":2}'::jsonb,
    'redesign',
    '47000000-0000-4000-8000-000000000001'
  )$$,
  'redesign creates a new immutable habit version'
);

select results_eq(
  $$select metadata->>'description' from public.habit_versions where id = '37000000-0000-4000-8000-000000000001'$$,
  $$values ('Updated grounding practice.'::text)$$,
  'redesign persists presentation metadata'
);

select * from finish();
rollback;
