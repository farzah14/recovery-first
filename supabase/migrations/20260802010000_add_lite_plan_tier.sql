alter type public.plan_tier add value if not exists 'lite' before 'premium';

alter table public.entitlements
  add constraint entitlements_supported_product_code_check
  check (
    product_code in (
      'lite',
      'lite_monthly',
      'lite_annual',
      'premium',
      'premium_monthly',
      'premium_annual'
    )
  ) not valid;
