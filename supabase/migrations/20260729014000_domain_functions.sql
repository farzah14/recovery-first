create or replace function private.is_slot_consuming(
  p_state public.habit_lifecycle_state
)
returns boolean
language sql
immutable
strict
as $$
  select p_state in (
    'starting',
    'building',
    'active',
    'stable',
    'at_risk',
    'recovery',
    'rebuilding',
    'needs_review'
  );
$$;

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
        and status in ('trial_active', 'active', 'grace_period')
        and valid_from <= timezone('utc', now())
        and (valid_until is null or valid_until > timezone('utc', now()))
    ) then 'premium'::public.plan_tier
    else 'free'::public.plan_tier
  end;
$$;

create or replace function private.active_habit_limit(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, private
as $$
  select case private.effective_plan_tier(p_user_id)
    when 'premium' then 20
    else 5
  end;
$$;

create or replace function private.command_hash(p_request jsonb)
returns text
language sql
immutable
strict
set search_path = public, private, extensions
as $$
  select encode(digest(convert_to(p_request::text, 'UTF8'), 'sha256'), 'hex');
$$;

create or replace function private.replay_idempotent_result(
  p_user_id uuid,
  p_operation_type text,
  p_command_id uuid,
  p_request jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private, extensions
as $$
declare
  v_record private.idempotency_records%rowtype;
begin
  select *
  into v_record
  from private.idempotency_records
  where user_id = p_user_id
    and operation_type = p_operation_type
    and idempotency_key = p_command_id;

  if not found then
    return null;
  end if;

  if v_record.request_hash <> private.command_hash(p_request) then
    raise exception using
      errcode = '22000',
      message = 'idempotency_key_reused_with_different_request';
  end if;

  return v_record.result_payload;
end;
$$;

create or replace function private.store_idempotent_result(
  p_user_id uuid,
  p_operation_type text,
  p_command_id uuid,
  p_request jsonb,
  p_result jsonb
)
returns void
language sql
security definer
set search_path = public, private, extensions
as $$
  insert into private.idempotency_records (
    user_id,
    operation_type,
    idempotency_key,
    request_hash,
    result_payload,
    expires_at
  )
  values (
    p_user_id,
    p_operation_type,
    p_command_id,
    private.command_hash(p_request),
    p_result,
    timezone('utc', now()) + interval '90 days'
  )
  on conflict (user_id, operation_type, idempotency_key) do nothing;
$$;

create or replace function public.activate_habit(
  p_habit_id uuid,
  p_expected_revision bigint,
  p_command_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_habit public.habits%rowtype;
  v_active_count integer;
  v_limit integer;
  v_request jsonb;
  v_result jsonb;
  v_replayed jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  v_request := jsonb_build_object(
    'habitId', p_habit_id,
    'expectedRevision', p_expected_revision
  );

  v_replayed := private.replay_idempotent_result(
    v_user_id,
    'activate_habit',
    p_command_id,
    v_request
  );
  if v_replayed is not null then
    return v_replayed;
  end if;

  select * into v_habit
  from public.habits
  where id = p_habit_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'habit_not_found';
  end if;
  if v_habit.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'revision_conflict';
  end if;
  if v_habit.current_version_id is null then
    raise exception using errcode = '23514', message = 'habit_version_required';
  end if;

  if private.is_slot_consuming(v_habit.lifecycle_state) then
    v_result := jsonb_build_object(
      'habitId', v_habit.id,
      'lifecycleState', v_habit.lifecycle_state,
      'revision', v_habit.revision,
      'alreadyActive', true
    );
    perform private.store_idempotent_result(
      v_user_id,
      'activate_habit',
      p_command_id,
      v_request,
      v_result
    );
    return v_result;
  end if;

  select count(*)::integer into v_active_count
  from public.habits
  where user_id = v_user_id
    and deleted_at is null
    and private.is_slot_consuming(lifecycle_state);

  v_limit := private.active_habit_limit(v_user_id);
  if v_active_count >= v_limit then
    raise exception using errcode = 'P0001', message = 'active_limit_reached';
  end if;

  update public.habits
  set lifecycle_state = 'starting',
      state_changed_at = timezone('utc', now()),
      revision = revision + 1
  where id = p_habit_id
  returning * into v_habit;

  insert into private.audit_events (user_id, event_type, entity_type, entity_id)
  values (v_user_id, 'habit_activated', 'habit', p_habit_id);

  v_result := jsonb_build_object(
    'habitId', v_habit.id,
    'lifecycleState', v_habit.lifecycle_state,
    'revision', v_habit.revision,
    'activeCount', v_active_count + 1,
    'limit', v_limit,
    'alreadyActive', false
  );

  perform private.store_idempotent_result(
    v_user_id,
    'activate_habit',
    p_command_id,
    v_request,
    v_result
  );
  return v_result;
end;
$$;

create or replace function public.create_habit_version(
  p_habit_id uuid,
  p_version_id uuid,
  p_expected_revision bigint,
  p_normal_target jsonb,
  p_minimum_target jsonb,
  p_schedule_rule jsonb,
  p_cue jsonb,
  p_recovery_structure jsonb,
  p_source text,
  p_command_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_habit public.habits%rowtype;
  v_version_number integer;
  v_request jsonb;
  v_result jsonb;
  v_replayed jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if p_source not in ('creation', 'redesign', 'recommendation', 'restore') then
    raise exception using errcode = '23514', message = 'invalid_version_source';
  end if;
  if jsonb_typeof(p_normal_target) <> 'object'
     or jsonb_typeof(p_minimum_target) <> 'object'
     or jsonb_typeof(p_schedule_rule) <> 'object'
     or jsonb_typeof(p_recovery_structure) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_version_payload';
  end if;
  if p_normal_target = p_minimum_target then
    raise exception using errcode = '23514', message = 'minimum_must_differ_from_normal';
  end if;

  v_request := jsonb_build_object(
    'habitId', p_habit_id,
    'versionId', p_version_id,
    'expectedRevision', p_expected_revision,
    'normalTarget', p_normal_target,
    'minimumTarget', p_minimum_target,
    'scheduleRule', p_schedule_rule,
    'cue', p_cue,
    'recoveryStructure', p_recovery_structure,
    'source', p_source
  );

  v_replayed := private.replay_idempotent_result(
    v_user_id,
    'create_habit_version',
    p_command_id,
    v_request
  );
  if v_replayed is not null then
    return v_replayed;
  end if;

  select * into v_habit
  from public.habits
  where id = p_habit_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'habit_not_found';
  end if;
  if v_habit.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'revision_conflict';
  end if;

  select coalesce(max(version_number), 0) + 1
  into v_version_number
  from public.habit_versions
  where habit_id = p_habit_id;

  insert into public.habit_versions (
    id,
    habit_id,
    user_id,
    version_number,
    normal_target,
    minimum_target,
    schedule_rule,
    cue,
    recovery_structure,
    source,
    parent_version_id
  )
  values (
    p_version_id,
    p_habit_id,
    v_user_id,
    v_version_number,
    p_normal_target,
    p_minimum_target,
    p_schedule_rule,
    p_cue,
    p_recovery_structure,
    p_source,
    v_habit.current_version_id
  );

  update public.habits
  set current_version_id = p_version_id,
      revision = revision + 1
  where id = p_habit_id
  returning * into v_habit;

  insert into private.audit_events (user_id, event_type, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'habit_version_created',
    'habit',
    p_habit_id,
    jsonb_build_object('versionId', p_version_id, 'versionNumber', v_version_number)
  );

  v_result := jsonb_build_object(
    'habitId', p_habit_id,
    'versionId', p_version_id,
    'versionNumber', v_version_number,
    'habitRevision', v_habit.revision
  );

  perform private.store_idempotent_result(
    v_user_id,
    'create_habit_version',
    p_command_id,
    v_request,
    v_result
  );
  return v_result;
end;
$$;

create or replace function public.ensure_session(
  p_session_id uuid,
  p_habit_id uuid,
  p_habit_version_id uuid,
  p_scheduled_local_date date,
  p_scheduled_local_time time,
  p_timezone_snapshot text,
  p_eligible_at timestamptz,
  p_resolution_due_at timestamptz,
  p_command_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_request jsonb;
  v_result jsonb;
  v_replayed jsonb;
  v_existing public.sessions%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if p_resolution_due_at < p_eligible_at then
    raise exception using errcode = '23514', message = 'invalid_resolution_window';
  end if;
  if not exists (
    select 1
    from public.habits h
    join public.habit_versions hv
      on hv.habit_id = h.id
     and hv.id = p_habit_version_id
    where h.id = p_habit_id
      and h.user_id = v_user_id
      and hv.user_id = v_user_id
  ) then
    raise exception using errcode = 'P0002', message = 'habit_version_not_found';
  end if;

  v_request := jsonb_build_object(
    'sessionId', p_session_id,
    'habitId', p_habit_id,
    'habitVersionId', p_habit_version_id,
    'scheduledLocalDate', p_scheduled_local_date,
    'scheduledLocalTime', p_scheduled_local_time,
    'timezoneSnapshot', p_timezone_snapshot,
    'eligibleAt', p_eligible_at,
    'resolutionDueAt', p_resolution_due_at
  );

  v_replayed := private.replay_idempotent_result(
    v_user_id,
    'ensure_session',
    p_command_id,
    v_request
  );
  if v_replayed is not null then
    return v_replayed;
  end if;

  insert into public.sessions (
    id,
    habit_id,
    habit_version_id,
    user_id,
    scheduled_local_date,
    scheduled_local_time,
    timezone_snapshot,
    eligible_at,
    resolution_due_at
  )
  values (
    p_session_id,
    p_habit_id,
    p_habit_version_id,
    v_user_id,
    p_scheduled_local_date,
    p_scheduled_local_time,
    p_timezone_snapshot,
    p_eligible_at,
    p_resolution_due_at
  )
  on conflict (
    habit_id,
    habit_version_id,
    scheduled_local_date,
    scheduled_local_time
  ) do nothing;

  select * into v_existing
  from public.sessions
  where habit_id = p_habit_id
    and habit_version_id = p_habit_version_id
    and scheduled_local_date = p_scheduled_local_date
    and scheduled_local_time is not distinct from p_scheduled_local_time;

  v_result := jsonb_build_object(
    'sessionId', v_existing.id,
    'revision', v_existing.revision,
    'status', v_existing.status
  );

  perform private.store_idempotent_result(
    v_user_id,
    'ensure_session',
    p_command_id,
    v_request,
    v_result
  );
  return v_result;
end;
$$;

create or replace function public.record_check_in(
  p_check_in_id uuid,
  p_session_id uuid,
  p_outcome public.check_in_outcome,
  p_friction_code text,
  p_friction_note text,
  p_recorded_local_at timestamptz,
  p_timezone_snapshot text,
  p_expected_session_revision bigint,
  p_command_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_existing public.check_ins%rowtype;
  v_habit public.habits%rowtype;
  v_counter integer;
  v_next_state public.habit_lifecycle_state;
  v_request jsonb;
  v_result jsonb;
  v_replayed jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if p_outcome <> 'manual_skipped'
     and (p_friction_code is not null or p_friction_note is not null) then
    raise exception using errcode = '23514', message = 'friction_only_allowed_for_manual_skip';
  end if;

  v_request := jsonb_build_object(
    'checkInId', p_check_in_id,
    'sessionId', p_session_id,
    'outcome', p_outcome,
    'frictionCode', p_friction_code,
    'frictionNote', p_friction_note,
    'recordedLocalAt', p_recorded_local_at,
    'timezoneSnapshot', p_timezone_snapshot,
    'expectedSessionRevision', p_expected_session_revision
  );

  v_replayed := private.replay_idempotent_result(
    v_user_id,
    'record_check_in',
    p_command_id,
    v_request
  );
  if v_replayed is not null then
    return v_replayed;
  end if;

  select * into v_session
  from public.sessions
  where id = p_session_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'session_not_found';
  end if;
  if v_session.revision <> p_expected_session_revision then
    raise exception using errcode = '40001', message = 'revision_conflict';
  end if;

  select * into v_existing
  from public.check_ins
  where session_id = p_session_id
  for update;

  if found then
    insert into public.check_in_history (
      check_in_id,
      session_id,
      user_id,
      previous_outcome,
      previous_friction_code,
      previous_friction_note,
      previous_revision
    )
    values (
      v_existing.id,
      v_existing.session_id,
      v_existing.user_id,
      v_existing.outcome,
      v_existing.friction_code,
      v_existing.friction_note,
      v_existing.revision
    );

    update public.check_ins
    set outcome = p_outcome,
        friction_code = p_friction_code,
        friction_note = p_friction_note,
        recorded_at = timezone('utc', now()),
        recorded_local_at = p_recorded_local_at,
        timezone_snapshot = p_timezone_snapshot,
        revision = revision + 1
    where id = v_existing.id
    returning * into v_existing;
  else
    insert into public.check_ins (
      id,
      session_id,
      user_id,
      outcome,
      friction_code,
      friction_note,
      recorded_local_at,
      timezone_snapshot
    )
    values (
      p_check_in_id,
      p_session_id,
      v_user_id,
      p_outcome,
      p_friction_code,
      p_friction_note,
      p_recorded_local_at,
      p_timezone_snapshot
    )
    returning * into v_existing;
  end if;

  update public.sessions
  set status = p_outcome::text::public.session_status,
      status_source = 'user',
      revision = revision + 1
  where id = p_session_id
  returning * into v_session;

  select * into v_habit
  from public.habits
  where id = v_session.habit_id
    and user_id = v_user_id
  for update;

  if p_outcome in ('full', 'minimum') then
    v_counter := 0;
  elsif p_outcome = 'manual_skipped' then
    v_counter := v_habit.consecutive_manual_skips + 1;
  else
    v_counter := v_habit.consecutive_manual_skips;
  end if;

  v_next_state := v_habit.lifecycle_state;
  if v_counter >= 3
     and v_habit.lifecycle_state in ('building', 'active', 'stable', 'at_risk', 'rebuilding') then
    v_next_state := 'recovery';
  end if;

  update public.habits
  set consecutive_manual_skips = v_counter,
      lifecycle_state = v_next_state,
      state_changed_at = case
        when lifecycle_state <> v_next_state then timezone('utc', now())
        else state_changed_at
      end,
      revision = revision + 1
  where id = v_habit.id
  returning * into v_habit;

  insert into private.audit_events (user_id, event_type, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'check_in_recorded',
    'session',
    p_session_id,
    jsonb_build_object('outcome', p_outcome, 'habitId', v_habit.id)
  );

  v_result := jsonb_build_object(
    'checkInId', v_existing.id,
    'checkInRevision', v_existing.revision,
    'sessionId', v_session.id,
    'sessionRevision', v_session.revision,
    'sessionStatus', v_session.status,
    'habitId', v_habit.id,
    'habitRevision', v_habit.revision,
    'habitLifecycleState', v_habit.lifecycle_state,
    'consecutiveManualSkips', v_habit.consecutive_manual_skips,
    'recoveryTriggered', v_habit.lifecycle_state = 'recovery'
  );

  perform private.store_idempotent_result(
    v_user_id,
    'record_check_in',
    p_command_id,
    v_request,
    v_result
  );
  return v_result;
end;
$$;

revoke all on function public.activate_habit(uuid, bigint, uuid) from public;
revoke all on function public.create_habit_version(uuid, uuid, bigint, jsonb, jsonb, jsonb, jsonb, jsonb, text, uuid) from public;
revoke all on function public.ensure_session(uuid, uuid, uuid, date, time, text, timestamptz, timestamptz, uuid) from public;
revoke all on function public.record_check_in(uuid, uuid, public.check_in_outcome, text, text, timestamptz, text, bigint, uuid) from public;

grant execute on function public.activate_habit(uuid, bigint, uuid) to authenticated;
grant execute on function public.create_habit_version(uuid, uuid, bigint, jsonb, jsonb, jsonb, jsonb, jsonb, text, uuid) to authenticated;
grant execute on function public.ensure_session(uuid, uuid, uuid, date, time, text, timestamptz, timestamptz, uuid) to authenticated;
grant execute on function public.record_check_in(uuid, uuid, public.check_in_outcome, text, text, timestamptz, text, bigint, uuid) to authenticated;
