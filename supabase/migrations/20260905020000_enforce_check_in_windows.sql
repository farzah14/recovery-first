create or replace function private.enforce_check_in_window()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_session public.sessions%rowtype;
begin
  select * into v_session
  from public.sessions
  where id = new.session_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'session_not_found';
  end if;

  if v_now < v_session.eligible_at then
    raise exception using errcode = '55000', message = 'session_not_yet_eligible';
  end if;

  if v_session.status = 'automatic_skipped' then
    raise exception using errcode = '55000', message = 'session_permanently_locked';
  end if;

  if tg_op = 'UPDATE' then
    if (v_now at time zone v_session.timezone_snapshot)::date <>
       v_session.scheduled_local_date then
      raise exception using errcode = '55000', message = 'check_in_edit_window_closed';
    end if;
  else
    if v_session.status <> 'unrecorded' then
      raise exception using errcode = '55000', message = 'session_already_resolved';
    end if;

    if v_now > v_session.resolution_due_at then
      raise exception using errcode = '55000', message = 'session_resolution_window_closed';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_check_in_window() from public;
revoke all on function private.enforce_check_in_window() from anon;
revoke all on function private.enforce_check_in_window() from authenticated;

create trigger check_ins_enforce_write_window
before insert or update on public.check_ins
for each row execute function private.enforce_check_in_window();
