create extension if not exists pg_cron with schema pg_catalog;

create or replace function private.resolve_expired_unrecorded_batch(
  p_user_id uuid,
  p_limit integer default 500
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 500), 5000));
  v_resolved_count integer := 0;
begin
  with candidates as materialized (
    select s.id
    from public.sessions as s
    where s.status = 'unrecorded'
      and s.resolution_due_at < statement_timestamp()
      and (p_user_id is null or s.user_id = p_user_id)
    order by s.resolution_due_at, s.id
    for update skip locked
    limit v_limit
  ),
  resolved as (
    update public.sessions as s
    set status = 'automatic_skipped',
        status_source = 'system',
        revision = s.revision + 1
    from candidates
    where s.id = candidates.id
      and s.status = 'unrecorded'
    returning s.id, s.habit_id, s.user_id
  ),
  audited as (
    insert into private.audit_events (
      user_id,
      event_type,
      entity_type,
      entity_id,
      metadata
    )
    select
      resolved.user_id,
      'session_automatically_skipped',
      'session',
      resolved.id,
      jsonb_build_object(
        'habitId', resolved.habit_id,
        'reason', 'not_recorded_within_three_days',
        'statusSource', 'automatic'
      )
    from resolved
    returning 1
  )
  select count(*)::integer into v_resolved_count
  from audited;

  return v_resolved_count;
end;
$$;

revoke all on function private.resolve_expired_unrecorded_batch(uuid, integer) from public;
revoke all on function private.resolve_expired_unrecorded_batch(uuid, integer) from anon;
revoke all on function private.resolve_expired_unrecorded_batch(uuid, integer) from authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    revoke all on function private.resolve_expired_unrecorded_batch(uuid, integer) from service_role;
  end if;
end;
$$;

create or replace function public.resolve_expired_unrecorded(p_now timestamptz)
returns integer
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if p_now is null then
    raise exception using errcode = '22004', message = 'resolution_time_required';
  end if;

  return private.resolve_expired_unrecorded_batch(v_user_id, 5000);
end;
$$;

revoke all on function public.resolve_expired_unrecorded(timestamptz) from public;
revoke all on function public.resolve_expired_unrecorded(timestamptz) from anon;
revoke all on function public.resolve_expired_unrecorded(timestamptz) from authenticated;
grant execute on function public.resolve_expired_unrecorded(timestamptz) to authenticated;

select cron.schedule(
  'resolve-expired-unrecorded-sessions',
  '*/15 * * * *',
  'select private.resolve_expired_unrecorded_batch(null, 500)'
);
