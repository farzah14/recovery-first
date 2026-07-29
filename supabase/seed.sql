insert into private.foundation_metadata (key, value)
values ('seed_stage', 'foundation')
on conflict (key) do update set value = excluded.value;
