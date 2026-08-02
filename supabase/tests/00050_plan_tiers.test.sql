begin;

select plan(11);

select results_eq(
  $$select enum_range(null::public.plan_tier)::text[]$$,
  $$values (array['free', 'lite', 'premium']::text[])$$,
  'plan tier enum is ordered Free, Lite, Premium'
);

insert into auth.users (id, email)
values ('12000000-0000-4000-8000-000000000001', 'tier-owner@example.invalid');
insert into public.profiles (id)
values ('12000000-0000-4000-8000-000000000001');

select is(
  private.effective_plan_tier('12000000-0000-4000-8000-000000000001'),
  'free'::public.plan_tier,
  'accounts without an active entitlement resolve to Free'
);

select is(
  private.active_habit_limit('12000000-0000-4000-8000-000000000001'),
  5,
  'Free accounts have five active habit slots'
);

insert into public.entitlements (
  id,
  user_id,
  product_code,
  status,
  valid_from
)
values (
  '52000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'lite_monthly',
  'active',
  timezone('utc', now()) - interval '1 day'
);

select is(
  private.effective_plan_tier('12000000-0000-4000-8000-000000000001'),
  'lite'::public.plan_tier,
  'an active Lite entitlement resolves to Lite'
);

select is(
  private.active_habit_limit('12000000-0000-4000-8000-000000000001'),
  10,
  'Lite accounts have ten active habit slots'
);

insert into public.entitlements (
  id,
  user_id,
  product_code,
  status,
  valid_from
)
values (
  '52000000-0000-4000-8000-000000000002',
  '12000000-0000-4000-8000-000000000001',
  'premium_monthly',
  'active',
  timezone('utc', now()) - interval '1 day'
);

select is(
  private.effective_plan_tier('12000000-0000-4000-8000-000000000001'),
  'premium'::public.plan_tier,
  'an active Premium entitlement outranks Lite'
);

select is(
  private.active_habit_limit('12000000-0000-4000-8000-000000000001'),
  30,
  'Premium accounts have thirty active habit slots'
);

update public.entitlements
set valid_until = timezone('utc', now()) - interval '1 hour'
where id = '52000000-0000-4000-8000-000000000002';

select is(
  private.effective_plan_tier('12000000-0000-4000-8000-000000000001'),
  'lite'::public.plan_tier,
  'an expired Premium entitlement falls back to active Lite'
);

update public.entitlements
set status = 'cancelled',
    valid_until = timezone('utc', now()) + interval '1 day'
where id = '52000000-0000-4000-8000-000000000002';

select is(
  private.effective_plan_tier('12000000-0000-4000-8000-000000000001'),
  'premium'::public.plan_tier,
  'a cancelled Premium entitlement remains active until its expiry'
);

update public.entitlements
set status = 'past_due'
where id = '52000000-0000-4000-8000-000000000002';

select is(
  private.effective_plan_tier('12000000-0000-4000-8000-000000000001'),
  'premium'::public.plan_tier,
  'a past-due Premium entitlement follows its stored entitlement window'
);

update public.entitlements
set valid_until = timezone('utc', now()) - interval '1 hour'
where id = '52000000-0000-4000-8000-000000000002';

select is(
  private.effective_plan_tier('12000000-0000-4000-8000-000000000001'),
  'lite'::public.plan_tier,
  'a past-due Premium entitlement falls back after its window expires'
);

select * from finish();
rollback;
