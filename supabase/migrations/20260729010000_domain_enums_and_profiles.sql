create type public.plan_tier as enum ('free', 'premium');
create type public.habit_lifecycle_state as enum (
  'draft',
  'starting',
  'building',
  'active',
  'stable',
  'at_risk',
  'recovery',
  'rebuilding',
  'needs_review',
  'paused',
  'stopped',
  'completed',
  'archived',
  'trash',
  'decision_required'
);
create type public.session_status as enum (
  'unrecorded',
  'full',
  'minimum',
  'manual_skipped',
  'automatic_skipped',
  'excused'
);
create type public.check_in_outcome as enum (
  'full',
  'minimum',
  'manual_skipped',
  'excused'
);
create type public.recommendation_status as enum (
  'pending',
  'applied',
  'customized',
  'kept_current',
  'expired'
);
create type public.recovery_plan_status as enum (
  'proposed',
  'active',
  'deferred',
  'succeeded',
  'failed',
  'cancelled'
);
create type public.entitlement_status as enum (
  'trial_active',
  'active',
  'grace_period',
  'past_due',
  'cancelled',
  'expired',
  'refunded',
  'revoked'
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 80),
  locale text not null default 'en-US' check (char_length(locale) between 2 and 35),
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 100),
  week_start smallint not null default 1 check (week_start between 1 and 7),
  quiet_hours_start time,
  quiet_hours_end time,
  plan_code public.plan_tier not null default 'free',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deletion_requested_at timestamptz,
  constraint profiles_quiet_hours_pair check (
    (quiet_hours_start is null and quiet_hours_end is null)
    or (quiet_hours_start is not null and quiet_hours_end is not null)
  )
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create table public.browser_installations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  push_capability text not null default 'unsupported'
    check (push_capability in ('supported', 'unsupported', 'denied', 'granted', 'expired')),
  last_seen_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, id)
);

create index browser_installations_user_last_seen_idx
  on public.browser_installations (user_id, last_seen_at desc);
