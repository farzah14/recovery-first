create or replace function public.redesign_habit(
  p_habit_id uuid,
  p_title text,
  p_category text,
  p_version_id uuid,
  p_expected_revision bigint,
  p_normal_target jsonb,
  p_minimum_target jsonb,
  p_schedule_rule jsonb,
  p_cue jsonb,
  p_metadata jsonb,
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
  if char_length(btrim(coalesce(p_title, ''))) not between 1 and 120 then
    raise exception using errcode = '22023', message = 'invalid_habit_title';
  end if;
  if char_length(coalesce(p_category, '')) > 50 then
    raise exception using errcode = '22023', message = 'invalid_habit_category';
  end if;
  if jsonb_typeof(p_normal_target) <> 'object'
     or jsonb_typeof(p_minimum_target) <> 'object'
     or jsonb_typeof(p_schedule_rule) <> 'object'
     or jsonb_typeof(p_recovery_structure) <> 'object'
     or jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_version_payload';
  end if;
  if p_normal_target = p_minimum_target then
    raise exception using errcode = '23514', message = 'minimum_must_differ_from_normal';
  end if;

  v_request := jsonb_build_object(
    'habitId', p_habit_id,
    'title', btrim(p_title),
    'category', p_category,
    'versionId', p_version_id,
    'expectedRevision', p_expected_revision,
    'normalTarget', p_normal_target,
    'minimumTarget', p_minimum_target,
    'scheduleRule', p_schedule_rule,
    'cue', p_cue,
    'metadata', coalesce(p_metadata, '{}'::jsonb),
    'recoveryStructure', p_recovery_structure,
    'source', p_source
  );

  v_replayed := private.replay_idempotent_result(
    v_user_id,
    'redesign_habit',
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
    metadata,
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
    coalesce(p_metadata, '{}'::jsonb),
    p_source,
    v_habit.current_version_id
  );

  update public.habits
  set title = btrim(p_title),
      category = nullif(btrim(p_category), ''),
      current_version_id = p_version_id,
      revision = revision + 1
  where id = p_habit_id
  returning * into v_habit;

  insert into private.audit_events (user_id, event_type, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'habit_version_created',
    'habit',
    p_habit_id,
    jsonb_build_object('versionId', p_version_id, 'versionNumber', v_version_number, 'source', p_source)
  );

  v_result := jsonb_build_object(
    'habitId', p_habit_id,
    'habitVersionId', p_version_id,
    'versionNumber', v_version_number,
    'habitRevision', v_habit.revision
  );

  perform private.store_idempotent_result(
    v_user_id,
    'redesign_habit',
    p_command_id,
    v_request,
    v_result
  );
  return v_result;
end;
$$;

revoke all on function public.redesign_habit(uuid, text, text, uuid, bigint, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, uuid) from public;
grant execute on function public.redesign_habit(uuid, text, text, uuid, bigint, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, uuid) to authenticated;
