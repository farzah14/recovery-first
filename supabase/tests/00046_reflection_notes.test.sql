begin;

select plan(6);

insert into auth.users (id, email)
values
  ('16000000-0000-4000-8000-000000000001', 'reflection-owner@example.invalid'),
  ('16000000-0000-4000-8000-000000000002', 'reflection-other@example.invalid');

set local role authenticated;
select set_config('request.jwt.claim.sub', '16000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"16000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$insert into public.reflection_notes (user_id, local_date, timezone, note)
    values (
      '16000000-0000-4000-8000-000000000001',
      '2026-08-06',
      'Asia/Jakarta',
      'A steady day.'
    )$$,
  'owner can insert a reflection note'
);

select results_eq(
  $$select note from public.reflection_notes where local_date = '2026-08-06'$$,
  $$values ('A steady day.'::text)$$,
  'owner can read the reflection note'
);

select lives_ok(
  $$insert into public.reflection_notes (user_id, local_date, timezone, note)
    values (
      '16000000-0000-4000-8000-000000000001',
      '2026-08-06',
      'Asia/Jakarta',
      'An updated reflection.'
    )
    on conflict (user_id, local_date) do update
      set timezone = excluded.timezone, note = excluded.note$$,
  'owner can upsert one note per local date'
);

select results_eq(
  $$select note from public.reflection_notes where local_date = '2026-08-06'$$,
  $$values ('An updated reflection.'::text)$$,
  'upsert replaces the note for that local date'
);

select throws_ok(
  $$insert into public.reflection_notes (user_id, local_date, timezone, note)
    values (
      '16000000-0000-4000-8000-000000000001',
      '2026-08-07',
      'Asia/Jakarta',
      '   '
    )$$,
  '23514',
  null,
  'blank reflection notes are rejected'
);

select set_config('request.jwt.claim.sub', '16000000-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"16000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

select results_eq(
  $$select count(*)::bigint from public.reflection_notes$$,
  $$values (0::bigint)$$,
  'another account cannot read the owner reflection note'
);

select * from finish();
rollback;
