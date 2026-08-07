create or replace function public.edit_same_day_check_in(
  p_check_in_id uuid,
  p_session_id uuid,
  p_outcome public.check_in_outcome,
  p_friction_code text,
  p_friction_note text,
  p_recorded_local_at timestamptz,
  p_timezone_snapshot text,
  p_expected_session_revision bigint,
  p_expected_check_in_revision bigint,
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
  v_previous_outcome public.check_in_outcome;
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

  if p_friction_code is not null
     and p_friction_code not in (
       'forgot',
       'no_time',
       'too_tired',
       'target_too_heavy',
       'schedule_changed',
       'environment',
       'no_motivation',
       'other'
     ) then
    raise exception using errcode = '23514', message = 'invalid_friction_code';
  end if;

  if p_friction_note is not null and char_length(p_friction_note) > 500 then
    raise exception using errcode = '22001', message = 'friction_note_too_long';
  end if;

  v_request := jsonb_build_object(
    'checkInId', p_check_in_id,
    'sessionId', p_session_id,
    'outcome', p_outcome,
    'frictionCode', p_friction_code,
    'frictionNote', p_friction_note,
    'recordedLocalAt', p_recorded_local_at,
    'timezoneSnapshot', p_timezone_snapshot,
    'expectedSessionRevision', p_expected_session_revision,
    'expectedCheckInRevision', p_expected_check_in_revision
  );

  v_replayed := private.replay_idempotent_result(
    v_user_id,
    'edit_same_day_check_in',
    p_command_id,
    v_request
  );
  if v_replayed is not null then
    return v_replayed;
  end if;

  -- Keep the lock order session -> check-in -> habit aligned with record_check_in.
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
  if (now() at time zone v_session.timezone_snapshot)::date <> v_session.scheduled_local_date
     or (p_recorded_local_at at time zone v_session.timezone_snapshot)::date <> v_session.scheduled_local_date then
    raise exception using errcode = 'P0001', message = 'same_day_edit_closed';
  end if;

  select * into v_existing
  from public.check_ins
  where id = p_check_in_id
    and session_id = p_session_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'check_in_not_found';
  end if;
  if v_existing.revision <> p_expected_check_in_revision then
    raise exception using errcode = '40001', message = 'revision_conflict';
  end if;

  v_previous_outcome := v_existing.outcome;

  select * into v_habit
  from public.habits
  where id = v_session.habit_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'habit_not_found';
  end if;

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
      timezone_snapshot = v_session.timezone_snapshot,
      revision = revision + 1
  where id = v_existing.id
  returning * into v_existing;

  update public.sessions
  set status = p_outcome::text::public.session_status,
      status_source = 'user',
      revision = revision + 1
  where id = v_session.id
  returning * into v_session;

  if p_outcome in ('full', 'minimum') then
    v_counter := 0;
  elsif p_outcome = 'manual_skipped' and v_previous_outcome <> 'manual_skipped' then
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
    'check_in_edited',
    'session',
    p_session_id,
    jsonb_build_object(
      'outcome', p_outcome,
      'previousOutcome', v_previous_outcome,
      'habitId', v_habit.id
    )
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
    'edit_same_day_check_in',
    p_command_id,
    v_request,
    v_result
  );
  return v_result;
end;
$$;

revoke all on function public.edit_same_day_check_in(
  uuid,
  uuid,
  public.check_in_outcome,
  text,
  text,
  timestamptz,
  text,
  bigint,
  bigint,
  uuid
) from public;

grant execute on function public.edit_same_day_check_in(
  uuid,
  uuid,
  public.check_in_outcome,
  text,
  text,
  timestamptz,
  text,
  bigint,
  bigint,
  uuid
) to authenticated;
