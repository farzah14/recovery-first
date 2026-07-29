create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table if not exists private.foundation_metadata (
  key text primary key,
  value text not null,
  created_at timestamptz not null default timezone('utc', now())
);

revoke all on table private.foundation_metadata from public;
revoke all on table private.foundation_metadata from anon;
revoke all on table private.foundation_metadata from authenticated;

insert into private.foundation_metadata (key, value)
values ('schema_stage', 'foundation')
on conflict (key) do update set value = excluded.value;
