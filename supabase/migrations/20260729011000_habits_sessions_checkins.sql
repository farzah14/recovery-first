create table public.habits (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  category text check (category is null or char_length(category) <= 50),
  lifecycle_state public.habit_lifecycle_state not null default 'draft',
  current_version_id uuid,
  state_changed_at timestamptz not null default timezone('utc', now()),
  revision bigint not null default 1 check (revision >= 1),
  consecutive_manual_skips integer not null default 0 check (consecutive_manual_skips >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  purge_after timestamptz,
  constraint habits_trash_dates check (
    (lifecycle_state <> 'trash' and deleted_at is null and purge_after is null)
    or (
      lifecycle_state = 'trash'
      and deleted_at is not null
      and purge_after is not null
      and purge_after >= deleted_at
    )
  )
);

create trigger habits_set_updated_at
before update on public.habits
for each row execute function private.set_updated_at();

create table public.habit_versions (
  id uuid primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  normal_target jsonb not null check (jsonb_typeof(normal_target) = 'object'),
  minimum_target jsonb not null check (jsonb_typeof(minimum_target) = 'object'),
  schedule_rule jsonb not null check (jsonb_typeof(schedule_rule) = 'object'),
  cue jsonb check (cue is null or jsonb_typeof(cue) = 'object'),
  recovery_structure jsonb not null default '{"durationSessions":3,"successThreshold":2}'::jsonb
    check (jsonb_typeof(recovery_structure) = 'object'),
  effective_from_session_id uuid,
  source text not null check (source in ('creation', 'redesign', 'recommendation', 'restore')),
  parent_version_id uuid references public.habit_versions(id),
  created_at timestamptz not null default timezone('utc', now()),
  unique (habit_id, version_number),
  unique (habit_id, id),
  constraint habit_versions_target_difference check (normal_target <> minimum_target)
);

alter table public.habits
  add constraint habits_current_version_fk
  foreign key (id, current_version_id)
  references public.habit_versions(habit_id, id)
  deferrable initially deferred;

create or replace function private.reject_habit_version_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'published_habit_versions_are_immutable';
end;
$$;

create trigger habit_versions_reject_update
before update on public.habit_versions
for each row execute function private.reject_habit_version_mutation();

create trigger habit_versions_reject_delete
before delete on public.habit_versions
for each row execute function private.reject_habit_version_mutation();

create table public.sessions (
  id uuid primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  habit_version_id uuid not null references public.habit_versions(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  scheduled_local_date date not null,
  scheduled_local_time time,
  timezone_snapshot text not null check (char_length(timezone_snapshot) between 1 and 100),
  eligible_at timestamptz not null,
  resolution_due_at timestamptz not null,
  status public.session_status not null default 'unrecorded',
  status_source text not null default 'system' check (status_source in ('user', 'system', 'import')),
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint sessions_resolution_after_eligibility check (resolution_due_at >= eligible_at),
  constraint sessions_user_date_identity unique nulls not distinct (
    habit_id,
    habit_version_id,
    scheduled_local_date,
    scheduled_local_time
  )
);

create trigger sessions_set_updated_at
before update on public.sessions
for each row execute function private.set_updated_at();

alter table public.habit_versions
  add constraint habit_versions_effective_session_fk
  foreign key (effective_from_session_id)
  references public.sessions(id)
  deferrable initially deferred;

create table public.check_ins (
  id uuid primary key,
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  outcome public.check_in_outcome not null,
  friction_code text check (
    friction_code is null
    or friction_code in (
      'forgot',
      'no_time',
      'too_tired',
      'target_too_heavy',
      'schedule_changed',
      'environment',
      'no_motivation',
      'other'
    )
  ),
  friction_note text check (friction_note is null or char_length(friction_note) <= 500),
  recorded_at timestamptz not null default timezone('utc', now()),
  recorded_local_at timestamptz not null,
  timezone_snapshot text not null check (char_length(timezone_snapshot) between 1 and 100),
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint check_ins_friction_only_for_skip check (
    outcome = 'manual_skipped'
    or (friction_code is null and friction_note is null)
  )
);

create trigger check_ins_set_updated_at
before update on public.check_ins
for each row execute function private.set_updated_at();

create table public.check_in_history (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references public.check_ins(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  previous_outcome public.check_in_outcome not null,
  previous_friction_code text,
  previous_friction_note text,
  previous_revision bigint not null,
  replaced_at timestamptz not null default timezone('utc', now())
);

create index habits_user_lifecycle_idx
  on public.habits (user_id, lifecycle_state);
create index habits_user_deleted_idx
  on public.habits (user_id, deleted_at);
create index habit_versions_habit_version_idx
  on public.habit_versions (habit_id, version_number desc);
create index sessions_user_date_idx
  on public.sessions (user_id, scheduled_local_date);
create index sessions_habit_date_idx
  on public.sessions (habit_id, scheduled_local_date);
create index sessions_resolution_idx
  on public.sessions (user_id, status, resolution_due_at);
create index check_ins_user_recorded_idx
  on public.check_ins (user_id, recorded_at desc);
create index check_in_history_check_in_idx
  on public.check_in_history (check_in_id, replaced_at desc);
