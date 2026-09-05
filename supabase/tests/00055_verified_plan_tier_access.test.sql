begin;

select plan(8);

insert into auth.users (id, email)
values ('12500000-0000-4000-8000-000000000001', 'verified-tier-owner@example.invalid');
insert into public.profiles (id)
values ('12500000-0000-4000-8000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', '12500000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"12500000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select is(
  public.effective_plan_tier(),
  'free'::public.plan_tier,
  'the authenticated account defaults to Free without an entitlement'
);

reset role;

insert into public.entitlements (
  id,
  user_id,
  product_code,
  status,
  valid_from
)
values (
  '52500000-0000-4000-8000-000000000001',
  '12500000-0000-4000-8000-000000000001',
  'premium_monthly',
  'active',
  timezone('utc', now()) - interval '1 day'
);

set local role authenticated;

select is(
  public.effective_plan_tier(),
  'premium'::public.plan_tier,
  'the authenticated account receives its tier from the verified entitlement'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'plan_code', 'UPDATE'),
  'authenticated clients cannot update profiles.plan_code'
);

select ok(
  has_column_privilege('authenticated', 'public.profiles', 'timezone', 'UPDATE'),
  'authenticated clients can update profile preferences'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'plan_code', 'INSERT'),
  'authenticated clients cannot insert profiles.plan_code'
);

select ok(
  has_function_privilege('authenticated', 'public.effective_plan_tier()', 'EXECUTE'),
  'authenticated clients can resolve their verified plan tier'
);

select ok(
  not has_function_privilege('anon', 'public.effective_plan_tier()', 'EXECUTE'),
  'anonymous clients cannot resolve an account plan tier'
);

select throws_ok(
  $$update public.profiles
    set plan_code = 'free'
    where id = '12500000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  'authenticated profile updates cannot change plan_code'
);

select * from finish();
rollback;
