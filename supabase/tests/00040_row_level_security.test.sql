begin;

select plan(12);

insert into auth.users (id, email)
values
  ('12000000-0000-4000-8000-000000000001', 'rls-owner@example.invalid'),
  ('12000000-0000-4000-8000-000000000002', 'rls-other@example.invalid');

insert into public.profiles (id, timezone)
values
  ('12000000-0000-4000-8000-000000000001', 'Asia/Jakarta'),
  ('12000000-0000-4000-8000-000000000002', 'UTC');

insert into public.browser_installations (id, user_id, display_name)
values (
  '22000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'Fixture Browser'
);

insert into public.habits (id, user_id, title)
values (
  '32000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'RLS Fixture Habit'
);

insert into public.habit_versions (
  id, habit_id, user_id, version_number, normal_target, minimum_target,
  schedule_rule, source
)
values (
  '42000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  1,
  '{"kind":"count","value":20}'::jsonb,
  '{"kind":"count","value":5}'::jsonb,
  '{"kind":"daily"}'::jsonb,
  'creation'
);

update public.habits
set current_version_id = '42000000-0000-4000-8000-000000000001'
where id = '32000000-0000-4000-8000-000000000001';

insert into public.sessions (
  id, habit_id, habit_version_id, user_id, scheduled_local_date,
  timezone_snapshot, eligible_at, resolution_due_at
)
values (
  '52000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000001',
  '42000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  (now() at time zone 'Asia/Jakarta')::date,
  'Asia/Jakarta',
  now() - interval '1 hour',
  now() + interval '3 days'
);

insert into public.check_ins (
  id, session_id, user_id, outcome, recorded_local_at, timezone_snapshot
)
values (
  '62000000-0000-4000-8000-000000000001',
  '52000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'minimum',
  now(),
  'Asia/Jakarta'
);

insert into public.check_in_history (
  check_in_id, session_id, user_id, previous_outcome, previous_revision
)
values (
  '62000000-0000-4000-8000-000000000001',
  '52000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'manual_skipped',
  1
);

insert into public.recommendations (
  id, habit_id, habit_version_id, user_id, signal_code, evidence,
  proposed_change, explanation_key
)
values (
  '72000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000001',
  '42000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'fixture_signal',
  '{}'::jsonb,
  '{"field":"minimumTarget"}'::jsonb,
  'recommendation.fixture'
);

insert into public.recovery_plans (
  id, habit_id, habit_version_id, user_id, target_definition
)
values (
  '82000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000001',
  '42000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  '{"kind":"minimum"}'::jsonb
);

insert into public.review_cycles (id, user_id, window_start, window_end)
values (
  '92000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  '2026-07-27',
  '2026-08-02'
);

insert into public.review_items (
  id, review_cycle_id, user_id, habit_id, item_type
)
values (
  'a2000000-0000-4000-8000-000000000001',
  '92000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000001',
  'weekly_summary'
);

insert into public.reminder_configs (
  id, habit_id, user_id, channel, local_time, timezone
)
values (
  'b2000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'web_push',
  '07:00',
  'Asia/Jakarta'
);

insert into public.push_subscriptions (
  id, installation_id, user_id, endpoint_hash, encrypted_subscription,
  capability_status
)
values (
  'c2000000-0000-4000-8000-000000000001',
  '22000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'fixture-endpoint-hash',
  '{"ciphertext":"fixture"}'::jsonb,
  'granted'
);

insert into public.email_preferences (user_id, reminder_opt_in, reminder_frequency)
values ('12000000-0000-4000-8000-000000000001', true, 'daily');

insert into public.entitlements (
  id, user_id, product_code, status, valid_from, valid_until
)
values (
  'd2000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'premium',
  'active',
  '2026-07-01',
  '2026-09-01'
);

insert into public.reflection_notes (user_id, local_date, timezone, note)
values (
  '12000000-0000-4000-8000-000000000001',
  '2026-08-06',
  'Asia/Jakarta',
  'Owner reflection'
);

select ok(
  (
    select count(*) = 16
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in (
        'profiles', 'browser_installations', 'habits', 'habit_versions',
        'sessions', 'check_ins', 'check_in_history', 'recommendations',
        'recovery_plans', 'review_cycles', 'review_items', 'reminder_configs',
        'push_subscriptions', 'email_preferences', 'entitlements', 'reflection_notes'
      )
      and c.relrowsecurity
  ),
  'RLS is enabled on every account-owned table'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select results_eq(
  $$select count(*)::bigint from public.habits$$,
  $$values (1::bigint)$$,
  'owner can read own habit'
);

select results_eq(
  $$select count(*)::bigint from public.today_session_view$$,
  $$values (1::bigint)$$,
  'security-invoker Today view exposes owner rows'
);

select results_eq(
  $$select count(*)::bigint from public.subscription_status_view$$,
  $$values (1::bigint)$$,
  'subscription view exposes owner entitlement without provider identifiers'
);

select set_config('request.jwt.claim.sub', '12000000-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

select results_eq(
  $$
    select sum(visible_count)::bigint
    from (
      select count(*)::bigint as visible_count from public.browser_installations
      union all select count(*) from public.habits
      union all select count(*) from public.habit_versions
      union all select count(*) from public.sessions
      union all select count(*) from public.check_ins
      union all select count(*) from public.check_in_history
      union all select count(*) from public.recommendations
      union all select count(*) from public.recovery_plans
      union all select count(*) from public.review_cycles
      union all select count(*) from public.review_items
      union all select count(*) from public.reminder_configs
      union all select count(*) from public.push_subscriptions
      union all select count(*) from public.email_preferences
      union all select count(*) from public.entitlements
      union all select count(*) from public.reflection_notes
    ) visible
  $$,
  $$values (0::bigint)$$,
  'other users cannot read any owner-scoped fixture row'
);

select throws_ok(
  $$insert into public.habits (id, user_id, title)
    values (
      '32000000-0000-4000-8000-000000000099',
      '12000000-0000-4000-8000-000000000001',
      'Cross-user insert'
    )$$,
  '42501',
  null,
  'other users cannot insert rows for the owner'
);

select results_eq(
  $$update public.reminder_configs
    set enabled = false
    where id = 'b2000000-0000-4000-8000-000000000001'
    returning id$$,
  $$select null::uuid where false$$,
  'other users cannot update owner reminder configuration'
);

select results_eq(
  $$select count(*)::bigint from public.today_session_view$$,
  $$values (0::bigint)$$,
  'security-invoker Today view denies cross-user rows'
);

select results_eq(
  $$select count(*)::bigint from public.subscription_status_view$$,
  $$values (0::bigint)$$,
  'subscription view denies cross-user entitlements'
);

select throws_ok(
  $$select count(*) from private.payment_events$$,
  '42501',
  null,
  'authenticated role cannot read private payment events'
);

select throws_ok(
  $$select count(*) from private.idempotency_records$$,
  '42501',
  null,
  'authenticated role cannot read private idempotency records'
);

select throws_ok(
  $$select count(*) from private.audit_events$$,
  '42501',
  null,
  'authenticated role cannot read private audit events'
);

select * from finish();
rollback;
