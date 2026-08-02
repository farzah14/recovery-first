create or replace function private.effective_plan_tier(p_user_id uuid)
returns public.plan_tier
language sql
stable
security definer
set search_path = public, private
as $$
  select case
    when exists (
      select 1
      from public.entitlements
      where user_id = p_user_id
        and product_code in ('premium', 'premium_monthly', 'premium_annual')
        and status in ('trial_active', 'active', 'grace_period', 'cancelled', 'past_due')
        and valid_from <= timezone('utc', now())
        and (valid_until is null or valid_until > timezone('utc', now()))
    ) then 'premium'::public.plan_tier
    when exists (
      select 1
      from public.entitlements
      where user_id = p_user_id
        and product_code in ('lite', 'lite_monthly', 'lite_annual')
        and status in ('trial_active', 'active', 'grace_period', 'cancelled', 'past_due')
        and valid_from <= timezone('utc', now())
        and (valid_until is null or valid_until > timezone('utc', now()))
    ) then 'lite'::public.plan_tier
    else 'free'::public.plan_tier
  end;
$$;
