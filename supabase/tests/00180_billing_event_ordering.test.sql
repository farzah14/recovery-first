begin;

select plan(8);

insert into auth.users (id, email)
values
  ('13000000-0000-4000-8000-000000000001', 'billing-owner@example.invalid'),
  ('13000000-0000-4000-8000-000000000002', 'billing-other@example.invalid');

insert into public.profiles (id)
values
  ('13000000-0000-4000-8000-000000000001'),
  ('13000000-0000-4000-8000-000000000002');

select is(
  private.process_normalized_billing_event(
    'paddle',
    'evt_01',
    'subscription_created',
    '2026-08-03T00:00:00Z',
    '13000000-0000-4000-8000-000000000001',
    'ctm_ordering_01',
    'sub_ordering_01',
    'premium_monthly',
    'active',
    '2026-08-03T00:00:00Z',
    '2026-09-03T00:00:00Z',
    false,
    'hash_01'
  )->>'result',
  'applied',
  'the first normalized billing event is applied'
);

select is(
  private.process_normalized_billing_event(
    'paddle', 'evt_01', 'subscription_created', '2026-08-03T00:00:00Z',
    '13000000-0000-4000-8000-000000000001', 'ctm_ordering_01', 'sub_ordering_01',
    'premium_monthly', 'active', '2026-08-03T00:00:00Z', '2026-09-03T00:00:00Z',
    false, 'hash_01'
  )->>'result',
  'duplicate',
  'replaying an event ID returns duplicate'
);

select is(
  private.process_normalized_billing_event(
    'paddle', 'evt_00', 'subscription_past_due', '2026-08-02T23:59:59Z',
    '13000000-0000-4000-8000-000000000001', 'ctm_ordering_01', 'sub_ordering_01',
    'premium_monthly', 'past_due', '2026-08-03T00:00:00Z', '2026-09-03T00:00:00Z',
    false, 'hash_00'
  )->>'result',
  'stale',
  'an older provider event is ignored'
);

select is(
  private.process_normalized_billing_event(
    'paddle', 'evt_02', 'subscription_cancelled', '2026-08-04T00:00:00Z',
    '13000000-0000-4000-8000-000000000001', 'ctm_ordering_01', 'sub_ordering_01',
    'premium_monthly', 'cancelled', '2026-08-03T00:00:00Z', '2026-09-03T00:00:00Z',
    true, 'hash_02'
  )->>'result',
  'applied',
  'a newer cancellation is applied'
);

select is(
  (select normalized_status::text from private.billing_subscriptions
   where provider_subscription_id = 'sub_ordering_01'),
  'cancelled',
  'the subscription stores the newest normalized status'
);

select throws_ok(
  $$select private.process_normalized_billing_event(
    'paddle', 'evt_other', 'subscription_created', '2026-08-05T00:00:00Z',
    '13000000-0000-4000-8000-000000000002', 'ctm_ordering_01', 'sub_ordering_01',
    'premium_monthly', 'active', '2026-08-05T00:00:00Z', '2026-09-05T00:00:00Z',
    false, 'hash_other'
  )$$,
  '42501',
  null,
  'a provider customer cannot move to another account'
);

select is(
  (select count(*)::integer from private.audit_events
   where event_type = 'billing_event_processed'
     and metadata ? 'rawPayload'),
  0,
  'billing audit metadata excludes raw payloads'
);

select is(
  (select count(*)::integer from private.payment_events
   where provider = 'paddle' and provider_event_id = 'evt_00'
     and processing_status = 'ignored' and ignored_reason = 'stale_event'),
  1,
  'stale events are recorded as ignored'
);

select * from finish();
rollback;
