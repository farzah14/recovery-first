create table private.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null check (provider = 'paddle'),
  provider_customer_id text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table private.billing_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null check (provider = 'paddle'),
  provider_customer_id text not null,
  provider_subscription_id text not null unique,
  plan_code text not null check (
    plan_code in ('lite_monthly', 'lite_annual', 'premium_monthly', 'premium_annual')
  ),
  provider_status text not null,
  normalized_status public.entitlement_status not null,
  provider_occurred_at timestamptz not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_event_id text not null,
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table private.checkout_attempts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null check (
    plan_code in ('lite_monthly', 'lite_annual', 'premium_monthly', 'premium_annual')
  ),
  provider text not null check (provider = 'paddle'),
  provider_transaction_id text unique,
  idempotency_key uuid not null,
  request_hash text not null,
  status text not null check (
    status in ('created', 'opened', 'processing', 'confirmed', 'failed', 'expired')
  ),
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, idempotency_key)
);

alter table private.payment_events
  add column event_type text,
  add column occurred_at timestamptz,
  add column provider_entity_id text,
  add column raw_payload text,
  add column raw_payload_expires_at timestamptz,
  add column processing_attempts integer not null default 0,
  add column ignored_reason text;

alter table private.payment_events
  add constraint payment_events_raw_payload_expiry_check
  check (raw_payload is null or raw_payload_expires_at is not null);

create table private.billing_webhook_failures (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider = 'paddle'),
  reason text not null check (reason in ('normalization_failed')),
  error_message text not null check (char_length(error_message) between 1 and 240),
  received_at timestamptz not null default timezone('utc', now())
);

create trigger billing_customers_set_updated_at
before update on private.billing_customers
for each row execute function private.set_updated_at();

create trigger billing_subscriptions_set_updated_at
before update on private.billing_subscriptions
for each row execute function private.set_updated_at();

create trigger checkout_attempts_set_updated_at
before update on private.checkout_attempts
for each row execute function private.set_updated_at();

create index billing_subscriptions_status_idx
  on private.billing_subscriptions (normalized_status, current_period_end);
create index checkout_attempts_user_created_idx
  on private.checkout_attempts (user_id, created_at desc);
create index payment_events_processing_idx
  on private.payment_events (processing_status, occurred_at);
create index payment_events_raw_expiry_idx
  on private.payment_events (raw_payload_expires_at)
  where raw_payload is not null;
create index billing_webhook_failures_received_idx
  on private.billing_webhook_failures (received_at desc);

revoke all on private.billing_customers from public, anon, authenticated;
revoke all on private.billing_subscriptions from public, anon, authenticated;
revoke all on private.checkout_attempts from public, anon, authenticated;
revoke all on private.billing_webhook_failures from public, anon, authenticated;
