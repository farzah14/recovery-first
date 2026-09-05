create table public.reflection_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  timezone text not null check (char_length(timezone) between 1 and 100),
  note text not null check (char_length(btrim(note)) between 1 and 2000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, local_date)
);

create trigger reflection_notes_set_updated_at
before update on public.reflection_notes
for each row execute function private.set_updated_at();

alter table public.reflection_notes enable row level security;

revoke all on public.reflection_notes from anon;
revoke all on public.reflection_notes from authenticated;
grant select, insert, update, delete on public.reflection_notes to authenticated;

create policy reflection_notes_select_own
on public.reflection_notes for select to authenticated
using (user_id = auth.uid());

create policy reflection_notes_insert_own
on public.reflection_notes for insert to authenticated
with check (user_id = auth.uid());

create policy reflection_notes_update_own
on public.reflection_notes for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy reflection_notes_delete_own
on public.reflection_notes for delete to authenticated
using (user_id = auth.uid());
