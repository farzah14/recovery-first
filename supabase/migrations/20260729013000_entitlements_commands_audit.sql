create table public.entitlements (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null check (char_length(product_code) between 1 and 80),
  status public.entitlement_status not null,
  valid_from timestamptz not null,
  valid_until timestamptz,
  cancel_at_period_end boolean not null default false,
  provider_customer_id text,
  provider_subscription_id text,
  revision bigint not null default 1 check (revision >= 1),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint entitlement_window check (valid_until is null or valid_until >= valid_from),
  unique (provider_subscription_id)
);

create trigger entitlements_set_updated_at
before update on public.entitlements
for each row execute function private.set_updated_at();

create table private.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('xendit', 'paddle')),
  provider_event_id text not null,
  signature_valid boolean not null,
  processing_status text not null check (
    processing_status in ('received', 'processed', 'ignored', 'failed')
  ),
  payload_hash text not null,
  normalized_payload jsonb not null check (jsonb_typeof(normalized_payload) = 'object'),
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  error_code text,
  unique (provider, provider_event_id)
);

create table private.idempotency_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_type text not null check (char_length(operation_type) between 1 and 100),
  idempotency_key uuid not null,
  request_hash text not null,
  result_payload jsonb not null check (jsonb_typeof(result_payload) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  unique (user_id, operation_type, idempotency_key)
);

create table private.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  installation_id uuid,
  event_type text not null check (char_length(event_type) between 1 and 120),
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default timezone('utc', now())
);

create index entitlements_user_status_idx
  on public.entitlements (user_id, status);
create index payment_events_provider_event_idx
  on private.payment_events (provider, provider_event_id);
create index idempotency_user_operation_idx
  on private.idempotency_records (user_id, operation_type, idempotency_key);
create index audit_events_user_created_idx
  on private.audit_events (user_id, created_at desc);

revoke all on table private.payment_events from public, anon, authenticated;
revoke all on table private.idempotency_records from public, anon, authenticated;
revoke all on table private.audit_events from public, anon, authenticated;
