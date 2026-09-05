create or replace function private.count_consecutive_manual_skips(
  p_user_id uuid,
  p_habit_id uuid
)
returns integer
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select count(*)::integer
  from (
    select
      s.status,
      count(*) filter (where s.status in ('full', 'minimum')) over (
        order by
          s.scheduled_local_date desc,
          s.scheduled_local_time desc nulls first,
          s.id desc
        rows between unbounded preceding and current row
      ) as later_successes
    from public.sessions as s
    where s.user_id = p_user_id
      and s.habit_id = p_habit_id
  ) as ordered_sessions
  where ordered_sessions.status = 'manual_skipped'
    and ordered_sessions.later_successes = 0;
$$;

revoke all on function private.count_consecutive_manual_skips(uuid, uuid) from public;
revoke all on function private.count_consecutive_manual_skips(uuid, uuid) from anon;
revoke all on function private.count_consecutive_manual_skips(uuid, uuid) from authenticated;

update public.habits as h
set consecutive_manual_skips = private.count_consecutive_manual_skips(h.user_id, h.id),
    revision = h.revision + 1
where h.consecutive_manual_skips is distinct from
  private.count_consecutive_manual_skips(h.user_id, h.id);

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

  v_counter := private.count_consecutive_manual_skips(v_user_id, v_habit.id);

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
