begin;

select plan(7);

insert into auth.users (id, email)
values ('14000000-0000-4000-8000-000000000001', 'projection-owner@example.invalid');
insert into public.profiles (id)
values ('14000000-0000-4000-8000-000000000001');

select is(
  (private.project_billing_entitlement(
    '14000000-0000-4000-8000-000000000001',
    'sub_projection_01',
    'premium_monthly',
    'active',
    '2026-08-03T00:00:00Z',
    '2026-09-03T00:00:00Z',
    false,
    'evt_projection_01'
  )).status::text,
  'active',
  'active provider state creates an active entitlement'
);

select is(
  (private.project_billing_entitlement(
    '14000000-0000-4000-8000-000000000001',
    'sub_projection_01',
    'premium_monthly',
    'cancelled',
    '2026-08-03T00:00:00Z',
    null,
    true,
    'evt_projection_02'
  )).valid_until,
  '2026-09-03T00:00:00Z'::timestamptz,
  'scheduled cancellation preserves the existing entitlement end'
);

select is(
  (private.project_billing_entitlement(
    '14000000-0000-4000-8000-000000000001',
    'sub_projection_01',
    'premium_monthly',
    'refunded',
    '2026-08-03T00:00:00Z',
    '2026-09-03T00:00:00Z',
    false,
    'evt_projection_03'
  )).status::text,
  'refunded',
  'refund changes the entitlement to a non-granting status'
);

select ok(
  (select valid_until <= timezone('utc', now())
   from public.entitlements
   where provider_subscription_id = 'sub_projection_01'),
  'refund shortens the entitlement window to now'
);

select is(
  (select revision from public.entitlements
   where provider_subscription_id = 'sub_projection_01'),
  3::bigint,
  'each authoritative projection increments the entitlement revision'
);

select is(
  (select count(*)::integer from public.entitlements
   where provider_subscription_id = 'sub_projection_01'),
  1,
  'one current entitlement is retained per provider subscription'
);

select is(
  (select count(*)::integer from private.audit_events
   where event_type = 'billing_entitlement_projected'),
  3,
  'each projection records a minimized audit event'
);

select * from finish();
rollback;
