begin;

select plan(12);

insert into auth.users (id, email)
values ('15000000-0000-4000-8000-000000000001', 'lifecycle-owner@example.invalid');

insert into public.profiles (id)
values ('15000000-0000-4000-8000-000000000001');

select is(
  (private.project_billing_entitlement(
    '15000000-0000-4000-8000-000000000001',
    'sub_lifecycle_02',
    'premium_monthly',
    'trial_active',
    '2026-08-03T00:00:00Z',
    '2026-09-03T00:00:00Z',
    false,
    'evt_lifecycle_trial_01'
  )).status::text,
  'trial_active',
  'trial start grants the trial_active state'
);

select is(
  (private.project_billing_entitlement(
    '15000000-0000-4000-8000-000000000001',
    'sub_lifecycle_02',
    'premium_monthly',
    'trial_cancelled',
    '2026-08-03T00:00:00Z',
    null,
    true,
    'evt_lifecycle_trial_02'
  )).valid_until,
  '2026-09-03T00:00:00Z'::timestamptz,
  'trial cancellation preserves the existing trial end'
);

select is(
  (private.project_billing_entitlement(
    '15000000-0000-4000-8000-000000000001',
    'sub_lifecycle_02',
    'premium_monthly',
    'grace_period',
    '2026-08-03T00:00:00Z',
    '2026-09-03T00:00:00Z',
    false,
    'evt_lifecycle_grace_01'
  )).status::text,
  'grace_period',
  'grace-period state remains explicitly represented'
);

select is(
  (private.project_billing_entitlement(
    '15000000-0000-4000-8000-000000000001',
    'sub_lifecycle_02',
    'premium_monthly',
    'cancelled',
    '2026-08-03T00:00:00Z',
    null,
    true,
    'evt_lifecycle_cancel_01'
  )).valid_until,
  '2026-09-03T00:00:00Z'::timestamptz,
  'scheduled cancellation preserves the existing paid end'
);

select is(
  (private.project_billing_entitlement(
    '15000000-0000-4000-8000-000000000001',
    'sub_lifecycle_01',
    'premium_monthly',
    'past_due',
    '2026-08-03T00:00:00Z',
    '2026-09-03T00:00:00Z',
    false,
    'evt_lifecycle_01'
  )).status::text,
  'past_due',
  'failed payment preserves the past_due access window'
);

select is(
  (private.project_billing_entitlement(
    '15000000-0000-4000-8000-000000000001',
    'sub_lifecycle_01',
    'premium_monthly',
    'active',
    '2026-09-03T00:00:00Z',
    '2026-10-03T00:00:00Z',
    false,
    'evt_lifecycle_02'
  )).status::text,
  'active',
  'a later successful renewal restores active status'
);

select is(
  (private.project_billing_entitlement(
    '15000000-0000-4000-8000-000000000001',
    'sub_lifecycle_01',
    'premium_monthly',
    'expired',
    '2026-08-03T00:00:00Z',
    '2026-11-03T00:00:00Z',
    false,
    'evt_lifecycle_03'
  )).status::text,
  'expired',
  'expiry changes the entitlement to a non-granting state'
);

select ok(
  (select valid_until <= timezone('utc', now())
   from public.entitlements
   where provider_subscription_id = 'sub_lifecycle_01'),
  'expiry closes the entitlement window'
);

select is(
  (private.project_billing_entitlement(
    '15000000-0000-4000-8000-000000000001',
    'sub_lifecycle_01',
    'premium_monthly',
    'refunded',
    '2026-08-03T00:00:00Z',
    '2026-11-03T00:00:00Z',
    false,
    'evt_lifecycle_04'
  )).status::text,
  'refunded',
  'a refund remains explicitly non-granting'
);

select is(
  (private.project_billing_entitlement(
    '15000000-0000-4000-8000-000000000001',
    'sub_lifecycle_01',
    'premium_monthly',
    'revoked',
    '2026-08-03T00:00:00Z',
    '2026-11-03T00:00:00Z',
    false,
    'evt_lifecycle_05'
  )).status::text,
  'revoked',
  'a chargeback revokes the entitlement'
);

select ok(
  (select valid_until <= timezone('utc', now())
   from public.entitlements
   where provider_subscription_id = 'sub_lifecycle_01'),
  'revocation closes the entitlement window'
);

select is(
  (select count(*)::integer from public.entitlements
   where provider_subscription_id = 'sub_lifecycle_01'),
  1,
  'lifecycle transitions retain one entitlement history projection'
);

select * from finish();
rollback;
