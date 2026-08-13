begin;

select plan(8);

insert into auth.users (id, email)
values ('10000000-0000-4000-8000-000000000002', 'fixture-owner@example.invalid');

insert into public.profiles (id, timezone)
values ('10000000-0000-4000-8000-000000000002', 'Asia/Jakarta');

select has_column('public', 'profiles', 'terms_accepted_at', 'profiles expose terms acceptance');
select has_column('public', 'profiles', 'onboarding_completed_at', 'profiles expose onboarding completion');

select col_is_null('public', 'profiles', 'terms_accepted_at', 'terms acceptance is nullable');
select col_is_null('public', 'profiles', 'onboarding_completed_at', 'onboarding completion is nullable');

select is(
  (select terms_accepted_at from public.profiles where id = '10000000-0000-4000-8000-000000000002'),
  null,
  'new profiles start without terms acceptance'
);

select is(
  (select onboarding_completed_at from public.profiles where id = '10000000-0000-4000-8000-000000000002'),
  null,
  'new profiles start without onboarding completion'
);

update public.profiles
set terms_accepted_at = timezone('utc', now()),
    onboarding_completed_at = timezone('utc', now())
where id = '10000000-0000-4000-8000-000000000002';

select isnt(
  (select terms_accepted_at from public.profiles where id = '10000000-0000-4000-8000-000000000002'),
  null,
  'owner can record terms acceptance'
);

select isnt(
  (select onboarding_completed_at from public.profiles where id = '10000000-0000-4000-8000-000000000002'),
  null,
  'owner can record onboarding completion'
);

select * from finish();
rollback;
