alter table private.billing_customers
  drop constraint if exists billing_customers_provider_check,
  add constraint billing_customers_provider_check
    check (provider in ('paddle', 'doku'));

alter table private.billing_subscriptions
  drop constraint if exists billing_subscriptions_provider_check,
  add constraint billing_subscriptions_provider_check
    check (provider in ('paddle', 'doku'));

alter table private.checkout_attempts
  drop constraint if exists checkout_attempts_provider_check,
  add constraint checkout_attempts_provider_check
    check (provider in ('paddle', 'doku'));

alter table private.checkout_attempts
  add column if not exists provider_checkout_url text;

alter table private.checkout_attempts
  drop constraint if exists checkout_attempts_provider_checkout_url_check,
  add constraint checkout_attempts_provider_checkout_url_check
    check (provider_checkout_url is null or provider_checkout_url ~ '^https://');

alter table private.billing_webhook_failures
  drop constraint if exists billing_webhook_failures_provider_check,
  add constraint billing_webhook_failures_provider_check
    check (provider in ('paddle', 'doku'));

alter table private.payment_events
  drop constraint if exists payment_events_provider_check,
  add constraint payment_events_provider_check
    check (provider in ('xendit', 'paddle', 'doku'));

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef(
    'private.process_normalized_billing_event(text,text,text,timestamptz,uuid,text,text,text,public.entitlement_status,timestamptz,timestamptz,boolean,text)'::regprocedure
  )
  into function_definition;

  if function_definition is null
    or position('if p_provider <> ''paddle'' then' in function_definition) = 0 then
    raise exception 'Unexpected process_normalized_billing_event definition';
  end if;

  function_definition := replace(
    function_definition,
    'if p_provider <> ''paddle'' then',
    'if p_provider not in (''paddle'', ''doku'') then'
  );

  execute function_definition;
end;
$$;
