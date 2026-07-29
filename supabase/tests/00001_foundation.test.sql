begin;

select plan(4);

select has_schema('private', 'private schema exists');

select has_table(
  'private',
  'foundation_metadata',
  'foundation metadata table exists'
);

select results_eq(
  $$select value from private.foundation_metadata where key = 'schema_stage'$$,
  $$values ('foundation'::text)$$,
  'foundation migration marker exists'
);

select is_empty(
  $$
    select privilege_type
    from information_schema.role_table_grants
    where table_schema = 'private'
      and table_name = 'foundation_metadata'
      and grantee in ('anon', 'authenticated')
  $$,
  'browser roles have no direct table privileges'
);

select * from finish();
rollback;
