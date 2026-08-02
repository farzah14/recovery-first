create table public.recommendations (
  id uuid primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  habit_version_id uuid not null references public.habit_versions(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_code text not null check (char_length(signal_code) between 1 and 80),
  evidence jsonb not null check (jsonb_typeof(evidence) = 'object'),
  proposed_change jsonb not null check (jsonb_typeof(proposed_change) = 'object'),
  explanation_key text not null check (char_length(explanation_key) between 1 and 120),
  status public.recommendation_status not null default 'pending',
  decision_payload jsonb check (decision_payload is null or jsonb_typeof(decision_payload) = 'object'),
  decided_at timestamptz,
  created_version_id uuid references public.habit_versions(id),
  created_at timestamptz not null default timezone('utc', now()),
  constraint recommendations_decision_state check (
    (status = 'pending' and decided_at is null)
    or (status <> 'pending' and decided_at is not null)
  )
);

create table public.recovery_plans (
  id uuid primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  habit_version_id uuid not null references public.habit_versions(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.recovery_plan_status not null default 'proposed',
  target_definition jsonb not null check (jsonb_typeof(target_definition) = 'object'),
  duration_sessions integer not null default 3 check (duration_sessions between 1 and 14),
  success_threshold integer not null default 2 check (success_threshold >= 1),
  started_at timestamptz,
  completed_at timestamptz,
  failure_sequence integer not null default 0 check (failure_sequence >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  constraint recovery_threshold_within_duration check (success_threshold <= duration_sessions),
  constraint recovery_completion_state check (
    (status in ('proposed', 'deferred') and started_at is null and completed_at is null)
    or (status = 'active' and started_at is not null and completed_at is null)
    or (status in ('succeeded', 'failed', 'cancelled') and completed_at is not null)
  )
);

create table public.review_cycles (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start date not null,
  window_end date not null,
  status text not null default 'open' check (status in ('open', 'completed', 'dismissed')),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint review_cycle_window check (window_end >= window_start),
  unique (user_id, window_start, window_end)
);

create table public.review_items (
  id uuid primary key,
  review_cycle_id uuid references public.review_cycles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete cascade,
  item_type text not null check (
    item_type in ('weekly_summary', 'recovery', 'at_risk', 'unrecorded', 'recommendation', 'downgrade')
  ),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  priority integer not null default 100 check (priority between 1 and 1000),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.reminder_configs (
  id uuid primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('web_push', 'email')),
  local_time time not null,
  timezone text not null check (char_length(timezone) between 1 and 100),
  follow_up_minutes integer check (follow_up_minutes is null or follow_up_minutes between 5 and 1440),
  enabled boolean not null default true,
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (habit_id, channel)
);

create trigger reminder_configs_set_updated_at
before update on public.reminder_configs
for each row execute function private.set_updated_at();

create table public.push_subscriptions (
  id uuid primary key,
  installation_id uuid not null references public.browser_installations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint_hash text not null,
  encrypted_subscription jsonb not null check (jsonb_typeof(encrypted_subscription) = 'object'),
  capability_status text not null check (capability_status in ('granted', 'expired', 'revoked')),
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, endpoint_hash)
);

create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row execute function private.set_updated_at();

create table public.email_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reminder_opt_in boolean not null default false,
  reminder_frequency text not null default 'off'
    check (reminder_frequency in ('off', 'daily', 'weekly')),
  unsubscribed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger email_preferences_set_updated_at
before update on public.email_preferences
for each row execute function private.set_updated_at();

create index recommendations_user_status_idx
  on public.recommendations (user_id, status, created_at desc);
create index recovery_plans_user_status_idx
  on public.recovery_plans (user_id, status, created_at desc);
create index review_items_user_status_idx
  on public.review_items (user_id, status, priority);
create index reminder_configs_user_enabled_idx
  on public.reminder_configs (user_id, enabled);
