begin;

select plan(24);

select has_type('public', 'habit_lifecycle_state', 'habit lifecycle enum exists');
select has_type('public', 'session_status', 'session status enum exists');
select has_type('public', 'check_in_outcome', 'check-in outcome enum exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'browser_installations', 'browser installations table exists');
select has_table('public', 'habits', 'habits table exists');
select has_table('public', 'habit_versions', 'habit versions table exists');
select has_table('public', 'sessions', 'sessions table exists');
select has_table('public', 'check_ins', 'check-ins table exists');
select has_table('public', 'check_in_history', 'check-in history table exists');
select has_column('public', 'habits', 'revision', 'habits expose revisions');
select has_column('public', 'habits', 'deleted_at', 'habits expose soft deletion');
select has_column('public', 'habits', 'purge_after', 'habits expose purge schedule');
select has_column('public', 'habits', 'consecutive_manual_skips', 'habits store recovery counter');
select has_column('public', 'habit_versions', 'version_number', 'habit versions are ordered');
select has_column('public', 'habit_versions', 'schedule_rule', 'habit versions store recurrence');
select has_column('public', 'sessions', 'timezone_snapshot', 'sessions snapshot timezone');
select has_column('public', 'sessions', 'resolution_due_at', 'sessions expose resolution deadline');
select has_column('public', 'check_ins', 'friction_code', 'check-ins store controlled friction');
select has_column('public', 'check_ins', 'revision', 'check-ins expose revisions');
select has_index('public', 'habits', 'habits_user_lifecycle_idx', 'habit lifecycle index exists');
select has_index('public', 'sessions', 'sessions_user_date_idx', 'session date index exists');
select has_index('public', 'sessions', 'sessions_resolution_idx', 'unrecorded resolution index exists');
select has_index('public', 'check_ins', 'check_ins_user_recorded_idx', 'check-in history access index exists');

select * from finish();
rollback;
