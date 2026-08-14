begin;

select plan(2);

select hasnt_column(
  'public',
  'profiles',
  'terms_accepted_at',
  'terms acceptance column is removed'
);

select hasnt_column(
  'public',
  'profiles',
  'onboarding_completed_at',
  'onboarding completion column is removed'
);

select * from finish();
rollback;
