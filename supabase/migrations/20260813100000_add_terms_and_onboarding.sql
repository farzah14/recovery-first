alter table public.profiles
  add column terms_accepted_at timestamptz,
  add column onboarding_completed_at timestamptz;

create index profiles_terms_accepted_idx
  on public.profiles (terms_accepted_at);

create index profiles_onboarding_completed_idx
  on public.profiles (onboarding_completed_at);
