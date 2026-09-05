create or replace function public.effective_plan_tier()
returns public.plan_tier
language sql
stable
security definer
set search_path = public, private
as $$
  select private.effective_plan_tier(auth.uid());
$$;

revoke all on function public.effective_plan_tier() from public, anon, authenticated;
grant execute on function public.effective_plan_tier() to authenticated;

revoke insert, update on table public.profiles from authenticated;

grant insert (
  id,
  display_name,
  locale,
  timezone,
  week_start,
  quiet_hours_start,
  quiet_hours_end,
  terms_accepted_at,
  onboarding_completed_at
)
on table public.profiles to authenticated;

grant update (
  display_name,
  locale,
  timezone,
  week_start,
  quiet_hours_start,
  quiet_hours_end,
  terms_accepted_at,
  onboarding_completed_at
)
on table public.profiles to authenticated;
