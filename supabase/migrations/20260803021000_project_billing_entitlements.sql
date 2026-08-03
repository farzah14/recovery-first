create or replace function private.project_billing_entitlement(
  p_user_id uuid,
  p_subscription_id text,
  p_plan_code text,
  p_status public.entitlement_status,
  p_valid_from timestamptz,
  p_valid_until timestamptz,
  p_cancel_at_period_end boolean,
  p_source_event_id text
)
returns public.entitlements
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_existing public.entitlements%rowtype;
  v_entitlement public.entitlements%rowtype;
  v_valid_until timestamptz := p_valid_until;
  v_now timestamptz := timezone('utc', now());
begin
  if p_plan_code not in ('lite_monthly', 'lite_annual', 'premium_monthly', 'premium_annual') then
    raise exception using errcode = '22023', message = 'unsupported_billing_plan';
  end if;

  select *
  into v_existing
  from public.entitlements
  where provider_subscription_id = p_subscription_id
  for update;

  if found and p_status in ('trial_cancelled', 'cancelled') and p_valid_until is null then
    v_valid_until := v_existing.valid_until;
  end if;

  if p_status in ('expired', 'refunded', 'revoked') then
    v_valid_until := least(coalesce(p_valid_until, v_now), v_now);
  end if;

  if found then
    update public.entitlements
    set product_code = p_plan_code,
        status = p_status,
        valid_from = p_valid_from,
        valid_until = v_valid_until,
        cancel_at_period_end = p_cancel_at_period_end,
        provider_customer_id = coalesce(v_existing.provider_customer_id, null),
        revision = v_existing.revision + 1
    where id = v_existing.id
    returning * into v_entitlement;
  else
    insert into public.entitlements (
      id,
      user_id,
      product_code,
      status,
      valid_from,
      valid_until,
      cancel_at_period_end,
      provider_subscription_id,
      revision
    )
    values (
      gen_random_uuid(),
      p_user_id,
      p_plan_code,
      p_status,
      p_valid_from,
      v_valid_until,
      p_cancel_at_period_end,
      p_subscription_id,
      1
    )
    returning * into v_entitlement;
  end if;

  insert into private.audit_events (user_id, event_type, entity_type, metadata)
  values (
    p_user_id,
    'billing_entitlement_projected',
    'entitlement',
    jsonb_build_object(
      'providerSubscriptionId', p_subscription_id,
      'sourceEventId', p_source_event_id,
      'status', p_status,
      'revision', v_entitlement.revision
    )
  );

  return v_entitlement;
end;
$$;

revoke all on function private.project_billing_entitlement(
  uuid, text, text, public.entitlement_status, timestamptz, timestamptz, boolean, text
) from public, anon, authenticated;
