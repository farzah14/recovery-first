begin;

select plan(6);

insert into auth.users (id, email)
values ('14000000-0000-4000-8000-000000000001', 'doku-owner@example.invalid');

insert into public.profiles (id)
values ('14000000-0000-4000-8000-000000000001');

select is(
  private.process_normalized_billing_event(
    'doku',
    'doku_evt_01',
    'payment_succeeded',
    '2026-08-04T00:00:00Z',
    '14000000-0000-4000-8000-000000000001',
    'doku_customer_01',
    'doku_subscription_01',
    'premium_monthly',
    'active',
    '2026-08-04T00:00:00Z',
    '2026-09-04T00:00:00Z',
    false,
    'doku_hash_01'
  )->>'result',
  'applied',
  'the first DOKU event is applied'
);

select is(
  private.process_normalized_billing_event(
    'doku', 'doku_evt_01', 'payment_succeeded', '2026-08-04T00:00:00Z',
    '14000000-0000-4000-8000-000000000001', 'doku_customer_01', 'doku_subscription_01',
    'premium_monthly', 'active', '2026-08-04T00:00:00Z', '2026-09-04T00:00:00Z',
    false, 'doku_hash_01'
  )->>'result',
  'duplicate',
  'replaying a DOKU event remains idempotent'
);

select is(
  (select provider from private.billing_subscriptions where provider_subscription_id = 'doku_subscription_01'),
  'doku',
  'the subscription stores DOKU as its provider'
);

select is(
  (select normalized_status::text from private.billing_subscriptions where provider_subscription_id = 'doku_subscription_01'),
  'active',
  'the DOKU payment projects active status'
);

select is(
  (select provider from private.billing_customers where provider_customer_id = 'doku_customer_01'),
  'doku',
  'the DOKU customer is owned by the account'
);

select throws_ok(
  $$select private.process_normalized_billing_event(
    'unsupported', 'doku_evt_bad', 'payment_succeeded', '2026-08-04T00:00:00Z',
    '14000000-0000-4000-8000-000000000001', 'doku_customer_01', 'doku_subscription_01',
    'premium_monthly', 'active', '2026-08-04T00:00:00Z', '2026-09-04T00:00:00Z',
    false, 'doku_hash_bad'
  )$$,
  '22023',
  null,
  'unsupported providers remain rejected'
);

select * from finish();
rollback;
