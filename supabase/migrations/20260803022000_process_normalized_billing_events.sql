create or replace function private.process_normalized_billing_event(
  p_provider text,
  p_event_id text,
  p_event_type text,
  p_occurred_at timestamptz,
  p_user_id uuid,
  p_customer_id text,
  p_subscription_id text,
  p_plan_code text,
  p_status public.entitlement_status,
  p_valid_from timestamptz,
  p_valid_until timestamptz,
  p_cancel_at_period_end boolean,
  p_payload_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_event private.payment_events%rowtype;
  v_customer private.billing_customers%rowtype;
  v_subscription private.billing_subscriptions%rowtype;
  v_entitlement public.entitlements%rowtype;
  v_now timestamptz := timezone('utc', now());
  v_normalized_payload jsonb := jsonb_build_object(
    'provider', p_provider,
    'eventId', p_event_id,
    'eventType', p_event_type,
    'occurredAt', p_occurred_at,
    'customerId', p_customer_id,
    'subscriptionId', p_subscription_id,
    'userId', p_user_id,
    'planCode', p_plan_code,
    'status', p_status,
    'validFrom', p_valid_from,
    'validUntil', p_valid_until,
    'cancelAtPeriodEnd', p_cancel_at_period_end
  );
begin
  if p_provider <> 'paddle' then
    raise exception using errcode = '22023', message = 'unsupported_billing_provider';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_subscription_id, 0));

  select *
  into v_event
  from private.payment_events
  where provider = p_provider
    and provider_event_id = p_event_id
  for update;

  if found and v_event.processing_status <> 'received' then
    return jsonb_build_object('result', 'duplicate', 'eventId', p_event_id);
  end if;

  if not found then
    insert into private.payment_events (
      provider,
      provider_event_id,
      signature_valid,
      processing_status,
      payload_hash,
      normalized_payload,
      event_type,
      occurred_at,
      provider_entity_id
    )
    values (
      p_provider,
      p_event_id,
      true,
      'received',
      p_payload_hash,
      v_normalized_payload,
      p_event_type,
      p_occurred_at,
      p_subscription_id
    )
    returning * into v_event;
  end if;

  select *
  into v_customer
  from private.billing_customers
  where provider_customer_id = p_customer_id
  for update;

  if found and v_customer.user_id <> p_user_id then
    raise exception using errcode = '42501', message = 'provider_customer_owned_by_another_user';
  end if;

  if not found then
    insert into private.billing_customers (user_id, provider, provider_customer_id)
    values (p_user_id, p_provider, p_customer_id)
    returning * into v_customer;
  end if;

  select *
  into v_subscription
  from private.billing_subscriptions
  where provider_subscription_id = p_subscription_id
  for update;

  if found and (
    v_subscription.user_id <> p_user_id
    or v_subscription.provider_customer_id <> p_customer_id
  ) then
    raise exception using errcode = '42501', message = 'provider_subscription_owned_by_another_user';
  end if;

  if found and (
    p_occurred_at < v_subscription.provider_occurred_at
    or (
      p_occurred_at = v_subscription.provider_occurred_at
      and p_event_id < v_subscription.last_event_id
    )
  ) then
    update private.payment_events
    set processing_status = 'ignored',
        ignored_reason = 'stale_event',
        processing_attempts = processing_attempts + 1,
        processed_at = v_now
    where id = v_event.id;

    return jsonb_build_object(
      'result', 'stale',
      'eventId', p_event_id,
      'subscriptionRevision', v_subscription.revision
    );
  end if;

  if found then
    update private.billing_subscriptions
    set provider = p_provider,
        provider_customer_id = p_customer_id,
        plan_code = p_plan_code,
        provider_status = p_event_type,
        normalized_status = p_status,
        provider_occurred_at = p_occurred_at,
        current_period_start = p_valid_from,
        current_period_end = p_valid_until,
        cancel_at_period_end = p_cancel_at_period_end,
        last_event_id = p_event_id,
        revision = revision + 1
    where provider_subscription_id = p_subscription_id
    returning * into v_subscription;
  else
    insert into private.billing_subscriptions (
      user_id,
      provider,
      provider_customer_id,
      provider_subscription_id,
      plan_code,
      provider_status,
      normalized_status,
      provider_occurred_at,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      last_event_id
    )
    values (
      p_user_id,
      p_provider,
      p_customer_id,
      p_subscription_id,
      p_plan_code,
      p_event_type,
      p_status,
      p_occurred_at,
      p_valid_from,
      p_valid_until,
      p_cancel_at_period_end,
      p_event_id
    )
    returning * into v_subscription;
  end if;

  v_entitlement := private.project_billing_entitlement(
    p_user_id,
    p_subscription_id,
    p_plan_code,
    p_status,
    p_valid_from,
    p_valid_until,
    p_cancel_at_period_end,
    p_event_id
  );

  update private.payment_events
  set processing_status = 'processed',
      event_type = p_event_type,
      occurred_at = p_occurred_at,
      provider_entity_id = p_subscription_id,
      processing_attempts = processing_attempts + 1,
      processed_at = v_now
  where id = v_event.id;

  insert into private.audit_events (user_id, event_type, entity_type, metadata)
  values (
    p_user_id,
    'billing_event_processed',
    'subscription',
    jsonb_build_object(
      'provider', p_provider,
      'eventId', p_event_id,
      'subscriptionRevision', v_subscription.revision,
      'entitlementRevision', v_entitlement.revision,
      'status', p_status
    )
  );

  return jsonb_build_object(
    'result', 'applied',
    'eventId', p_event_id,
    'subscriptionRevision', v_subscription.revision,
    'entitlementRevision', v_entitlement.revision
  );
end;
$$;

revoke all on function private.process_normalized_billing_event(
  text, text, text, timestamptz, uuid, text, text, text,
  public.entitlement_status, timestamptz, timestamptz, boolean, text
) from public, anon, authenticated;
