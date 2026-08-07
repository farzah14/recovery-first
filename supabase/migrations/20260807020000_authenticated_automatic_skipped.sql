create or replace function public.resolve_unrecorded_sessions(
  p_now timestamptz
)
returns integer
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_resolved integer := 0;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if p_now is null then
    raise exception using errcode = '22004', message = 'resolution_clock_required';
  end if;

  -- The server supplies the clock. Lock eligible rows in a stable order so a
  -- retry is short, deterministic, and cannot classify a row twice.
  for v_session in
    select *
    from public.sessions
    where user_id = v_user_id
      and status = 'unrecorded'
      and resolution_due_at <= p_now
    order by id
    for update
  loop
    update public.sessions
    set status = 'automatic_skipped',
        status_source = 'system',
        revision = revision + 1
    where id = v_session.id
      and user_id = v_user_id
      and status = 'unrecorded';

    if found then
      v_resolved := v_resolved + 1;
      insert into private.audit_events (user_id, event_type, entity_type, entity_id, metadata)
      values (
        v_user_id,
        'session_automatically_skipped',
        'session',
        v_session.id,
        jsonb_build_object('resolutionDueAt', v_session.resolution_due_at)
      );
    end if;
  end loop;

  return v_resolved;
end;
$$;

revoke all on function public.resolve_unrecorded_sessions(timestamptz) from public;
grant execute on function public.resolve_unrecorded_sessions(timestamptz) to authenticated;
