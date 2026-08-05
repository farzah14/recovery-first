alter table public.habit_versions
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.habit_versions
  drop constraint if exists habit_versions_metadata_object;

alter table public.habit_versions
  add constraint habit_versions_metadata_object
  check (jsonb_typeof(metadata) = 'object');

create or replace function public.create_habit(
  p_habit_id uuid,
  p_version_id uuid,
  p_title text,
  p_category text,
  p_normal_target jsonb,
  p_minimum_target jsonb,
  p_schedule_rule jsonb,
  p_cue jsonb,
  p_metadata jsonb,
  p_recovery_structure jsonb,
  p_activate boolean,
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
  v_active_count integer;
  v_limit integer;
  v_state public.habit_lifecycle_state := 'draft';
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 120 then
    raise exception using errcode = '22023', message = 'invalid_habit_title';
  end if;
  if jsonb_typeof(p_normal_target) <> 'object'
     or jsonb_typeof(p_minimum_target) <> 'object'
     or jsonb_typeof(p_schedule_rule) <> 'object'
     or jsonb_typeof(p_recovery_structure) <> 'object'
     or jsonb_typeof(coalesce(p_cue, '{}'::jsonb)) <> 'object'
     or jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_habit_payload';
  end if;
  if p_normal_target = p_minimum_target then
    raise exception using errcode = '23514', message = 'minimum_must_differ_from_normal';
  end if;

  v_request := jsonb_build_object(
    'habitId', p_habit_id,
    'versionId', p_version_id,
    'title', btrim(p_title),
    'category', p_category,
    'normalTarget', p_normal_target,
    'minimumTarget', p_minimum_target,
    'scheduleRule', p_schedule_rule,
    'cue', p_cue,
    'metadata', p_metadata,
    'recoveryStructure', p_recovery_structure,
    'activate', p_activate
  );

  v_replayed := private.replay_idempotent_result(
    v_user_id,
    'create_habit',
    p_command_id,
    v_request
  );
  if v_replayed is not null then
    return v_replayed;
  end if;

  if p_activate then
    select count(*)::integer into v_active_count
    from public.habits
    where user_id = v_user_id
      and deleted_at is null
      and private.is_slot_consuming(lifecycle_state);

    v_limit := private.active_habit_limit(v_user_id);
    if v_active_count >= v_limit then
      raise exception using errcode = 'P0001', message = 'active_limit_reached';
    end if;
    v_state := 'starting';
  else
    v_active_count := 0;
    v_limit := private.active_habit_limit(v_user_id);
  end if;

  insert into public.habits (id, user_id, title, category, lifecycle_state)
  values (p_habit_id, v_user_id, btrim(p_title), nullif(btrim(p_category), ''), v_state);

  insert into public.habit_versions (
    id,
    habit_id,
    user_id,
    version_number,
    normal_target,
    minimum_target,
    schedule_rule,
    cue,
    metadata,
    recovery_structure,
    source
  )
  values (
    p_version_id,
    p_habit_id,
    v_user_id,
    1,
    p_normal_target,
    p_minimum_target,
    p_schedule_rule,
    p_cue,
    coalesce(p_metadata, '{}'::jsonb),
    p_recovery_structure,
    'creation'
  );

  update public.habits
  set current_version_id = p_version_id,
      revision = revision + 1
  where id = p_habit_id;

  insert into private.audit_events (user_id, event_type, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'habit_created',
    'habit',
    p_habit_id,
    jsonb_build_object('versionId', p_version_id, 'activated', p_activate)
  );

  v_result := jsonb_build_object(
    'habitId', p_habit_id,
    'habitVersionId', p_version_id,
    'lifecycleState', v_state,
    'activeCount', case when p_activate then v_active_count + 1 else v_active_count end,
    'activeLimit', v_limit
  );

  perform private.store_idempotent_result(
    v_user_id,
    'create_habit',
    p_command_id,
    v_request,
    v_result
  );
  return v_result;
end;
$$;

create or replace function public.set_habit_lifecycle(
  p_habit_id uuid,
  p_expected_revision bigint,
  p_next_state public.habit_lifecycle_state,
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
  v_request jsonb;
  v_result jsonb;
  v_replayed jsonb;
  v_is_valid boolean := false;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  v_request := jsonb_build_object(
    'habitId', p_habit_id,
    'expectedRevision', p_expected_revision,
    'nextState', p_next_state
  );

  v_replayed := private.replay_idempotent_result(
    v_user_id,
    'set_habit_lifecycle',
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

  v_is_valid :=
    (p_next_state = 'paused' and private.is_slot_consuming(v_habit.lifecycle_state))
    or (p_next_state = 'starting' and v_habit.lifecycle_state = 'paused')
    or (p_next_state = 'trash' and v_habit.lifecycle_state <> 'trash')
    or (p_next_state = 'archived' and v_habit.lifecycle_state in ('stopped', 'completed'));

  if not v_is_valid then
    raise exception using errcode = '22023', message = 'invalid_lifecycle_transition';
  end if;

  update public.habits
  set lifecycle_state = p_next_state,
      deleted_at = case when p_next_state = 'trash' then timezone('utc', now()) else null end,
      purge_after = case
        when p_next_state = 'trash' then timezone('utc', now()) + interval '30 days'
        else null
      end,
      state_changed_at = timezone('utc', now()),
      revision = revision + 1
  where id = p_habit_id
  returning * into v_habit;

  insert into private.audit_events (user_id, event_type, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'habit_lifecycle_changed',
    'habit',
    p_habit_id,
    jsonb_build_object('lifecycleState', p_next_state)
  );

  v_result := jsonb_build_object(
    'habitId', v_habit.id,
    'lifecycleState', v_habit.lifecycle_state,
    'revision', v_habit.revision
  );

  perform private.store_idempotent_result(
    v_user_id,
    'set_habit_lifecycle',
    p_command_id,
    v_request,
    v_result
  );
  return v_result;
end;
$$;

revoke all on function public.create_habit(uuid, uuid, text, text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, boolean, uuid) from public;
revoke all on function public.set_habit_lifecycle(uuid, bigint, public.habit_lifecycle_state, uuid) from public;

grant execute on function public.create_habit(uuid, uuid, text, text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, boolean, uuid) to authenticated;
grant execute on function public.set_habit_lifecycle(uuid, bigint, public.habit_lifecycle_state, uuid) to authenticated;
