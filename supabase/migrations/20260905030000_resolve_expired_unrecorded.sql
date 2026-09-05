create or replace function public.resolve_expired_unrecorded(p_now timestamptz)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_effective_now timestamptz := statement_timestamp();
  v_resolved_count integer := 0;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if p_now is null then
    raise exception using errcode = '22004', message = 'resolution_time_required';
  end if;

  with expired_sessions as (
    update public.sessions
    set status = 'automatic_skipped',
        status_source = 'system',
        revision = revision + 1
    where user_id = v_user_id
      and status = 'unrecorded'
      and resolution_due_at < v_effective_now
    returning id, habit_id
  )
  insert into private.audit_events (user_id, event_type, entity_type, entity_id, metadata)
  select
    v_user_id,
    'session_automatically_skipped',
    'session',
    expired_sessions.id,
    jsonb_build_object(
      'habitId', expired_sessions.habit_id,
      'reason', 'not_recorded_within_three_days',
      'statusSource', 'automatic'
    )
  from expired_sessions;

  get diagnostics v_resolved_count = row_count;
  return v_resolved_count;
end;
$$;

revoke all on function public.resolve_expired_unrecorded(timestamptz) from public;
revoke all on function public.resolve_expired_unrecorded(timestamptz) from anon;
revoke all on function public.resolve_expired_unrecorded(timestamptz) from authenticated;
grant execute on function public.resolve_expired_unrecorded(timestamptz) to authenticated;
