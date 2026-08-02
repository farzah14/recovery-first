alter table public.profiles enable row level security;
alter table public.browser_installations enable row level security;
alter table public.habits enable row level security;
alter table public.habit_versions enable row level security;
alter table public.sessions enable row level security;
alter table public.check_ins enable row level security;
alter table public.check_in_history enable row level security;
alter table public.recommendations enable row level security;
alter table public.recovery_plans enable row level security;
alter table public.review_cycles enable row level security;
alter table public.review_items enable row level security;
alter table public.reminder_configs enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.email_preferences enable row level security;
alter table public.entitlements enable row level security;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.browser_installations to authenticated;
grant select, insert on public.habits to authenticated;
grant select on public.habit_versions to authenticated;
grant select on public.sessions to authenticated;
grant select on public.check_ins to authenticated;
grant select on public.check_in_history to authenticated;
grant select on public.recommendations to authenticated;
grant select on public.recovery_plans to authenticated;
grant select on public.review_cycles to authenticated;
grant select on public.review_items to authenticated;
grant select, insert, update, delete on public.reminder_configs to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert, update, delete on public.email_preferences to authenticated;
grant select on public.entitlements to authenticated;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy browser_installations_select_own
on public.browser_installations
for select
to authenticated
using (user_id = auth.uid());

create policy browser_installations_insert_own
on public.browser_installations
for insert
to authenticated
with check (user_id = auth.uid());

create policy browser_installations_update_own
on public.browser_installations
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy browser_installations_delete_own
on public.browser_installations
for delete
to authenticated
using (user_id = auth.uid());

create policy habits_select_own
on public.habits
for select
to authenticated
using (user_id = auth.uid());

create policy habits_insert_own_draft
on public.habits
for insert
to authenticated
with check (
  user_id = auth.uid()
  and lifecycle_state = 'draft'
  and current_version_id is null
  and deleted_at is null
  and purge_after is null
);

create policy habit_versions_select_own
on public.habit_versions
for select
to authenticated
using (user_id = auth.uid());

create policy sessions_select_own
on public.sessions
for select
to authenticated
using (user_id = auth.uid());

create policy check_ins_select_own
on public.check_ins
for select
to authenticated
using (user_id = auth.uid());

create policy check_in_history_select_own
on public.check_in_history
for select
to authenticated
using (user_id = auth.uid());

create policy recommendations_select_own
on public.recommendations
for select
to authenticated
using (user_id = auth.uid());

create policy recovery_plans_select_own
on public.recovery_plans
for select
to authenticated
using (user_id = auth.uid());

create policy review_cycles_select_own
on public.review_cycles
for select
to authenticated
using (user_id = auth.uid());

create policy review_items_select_own
on public.review_items
for select
to authenticated
using (user_id = auth.uid());

create policy reminder_configs_select_own
on public.reminder_configs
for select
to authenticated
using (user_id = auth.uid());

create policy reminder_configs_insert_own
on public.reminder_configs
for insert
to authenticated
with check (user_id = auth.uid());

create policy reminder_configs_update_own
on public.reminder_configs
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy reminder_configs_delete_own
on public.reminder_configs
for delete
to authenticated
using (user_id = auth.uid());

create policy push_subscriptions_select_own
on public.push_subscriptions
for select
to authenticated
using (user_id = auth.uid());

create policy push_subscriptions_insert_own
on public.push_subscriptions
for insert
to authenticated
with check (user_id = auth.uid());

create policy push_subscriptions_update_own
on public.push_subscriptions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy push_subscriptions_delete_own
on public.push_subscriptions
for delete
to authenticated
using (user_id = auth.uid());

create policy email_preferences_select_own
on public.email_preferences
for select
to authenticated
using (user_id = auth.uid());

create policy email_preferences_insert_own
on public.email_preferences
for insert
to authenticated
with check (user_id = auth.uid());

create policy email_preferences_update_own
on public.email_preferences
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy email_preferences_delete_own
on public.email_preferences
for delete
to authenticated
using (user_id = auth.uid());

create policy entitlements_select_own
on public.entitlements
for select
to authenticated
using (user_id = auth.uid());

create view public.today_session_view
with (security_invoker = true)
as
select
  s.id as session_id,
  s.user_id,
  s.habit_id,
  h.title as habit_title,
  h.lifecycle_state,
  s.habit_version_id,
  s.scheduled_local_date,
  s.scheduled_local_time,
  s.timezone_snapshot,
  s.status,
  s.revision
from public.sessions s
join public.habits h on h.id = s.habit_id
where h.deleted_at is null;

create view public.habit_summary_view
with (security_invoker = true)
as
select
  h.id as habit_id,
  h.user_id,
  h.title,
  h.lifecycle_state,
  h.current_version_id,
  h.revision,
  h.consecutive_manual_skips,
  count(s.id) filter (where s.status in ('full', 'minimum')) as successful_sessions,
  count(s.id) filter (
    where s.status in ('full', 'minimum', 'manual_skipped', 'automatic_skipped')
  ) as resolved_sessions
from public.habits h
left join public.sessions s on s.habit_id = h.id
where h.deleted_at is null
group by h.id;

create view public.weekly_review_summary_view
with (security_invoker = true)
as
select
  rc.id as review_cycle_id,
  rc.user_id,
  rc.window_start,
  rc.window_end,
  rc.status,
  count(ri.id) filter (where ri.status = 'pending') as pending_items,
  count(ri.id) filter (where ri.status = 'resolved') as resolved_items
from public.review_cycles rc
left join public.review_items ri on ri.review_cycle_id = rc.id
group by rc.id;

create view public.insight_consistency_view
with (security_invoker = true)
as
select
  s.user_id,
  s.habit_id,
  count(*) filter (where s.status in ('full', 'minimum')) as successful_sessions,
  count(*) filter (
    where s.status in ('full', 'minimum', 'manual_skipped', 'automatic_skipped')
  ) as resolved_sessions,
  case
    when count(*) filter (
      where s.status in ('full', 'minimum', 'manual_skipped', 'automatic_skipped')
    ) = 0 then null
    else round(
      100.0
      * count(*) filter (where s.status in ('full', 'minimum'))
      / count(*) filter (
          where s.status in ('full', 'minimum', 'manual_skipped', 'automatic_skipped')
        ),
      2
    )
  end as consistency_percentage
from public.sessions s
group by s.user_id, s.habit_id;

create view public.subscription_status_view
with (security_invoker = true)
as
select
  id,
  user_id,
  product_code,
  status,
  valid_from,
  valid_until,
  cancel_at_period_end,
  revision,
  updated_at
from public.entitlements;

grant select on public.today_session_view to authenticated;
grant select on public.habit_summary_view to authenticated;
grant select on public.weekly_review_summary_view to authenticated;
grant select on public.insight_consistency_view to authenticated;
grant select on public.subscription_status_view to authenticated;
