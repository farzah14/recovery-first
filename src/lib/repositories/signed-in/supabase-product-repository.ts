import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Json } from '@/lib/supabase/database.types';
import type {
  CreateHabitCommand,
  CreateHabitResult,
  EditCheckInRepositoryCommand,
  HabitListItem,
  HabitTarget,
  ProductOwner,
  ProductRepository,
  RecordCheckInRepositoryCommand,
  RecordCheckInResult,
  SessionSummary,
  SetHabitLifecycleCommand,
  TodayRepositoryRead,
  UpdateHabitVersionCommand,
  WeeklyOverviewRead,
} from '@/lib/repositories/product-repository';
import { getLocalDateForTimezone, getLocalWeekRange } from '@/lib/dates/local-week';
import { ProductRepositoryError } from '@/lib/repositories/repository-errors';
import {
  decodeHabitVersionPayload,
  encodeHabitVersionPayload,
  type DatabaseSessionStatus,
} from '@/lib/repositories/habit-payload';

type SupabaseDatabaseClient = SupabaseClient<Database>;
type HabitRow = Database['public']['Tables']['habits']['Row'];
type HabitVersionRow = Database['public']['Tables']['habit_versions']['Row'];
type SessionViewRow = Database['public']['Views']['today_session_view']['Row'];

const activeLifecycleStates = [
  'starting',
  'building',
  'active',
  'stable',
  'at_risk',
  'recovery',
  'rebuilding',
  'needs_review',
] as const;

function createId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function asRecord(value: Json | null | undefined): Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {};
}

function decodeTarget(value: Json): HabitTarget {
  const record = asRecord(value);
  const quantity =
    typeof record.quantity === 'number'
      ? record.quantity
      : typeof record.value === 'number'
        ? record.value
        : null;
  const action =
    typeof record.action === 'string'
      ? record.action
      : typeof record.kind === 'string'
        ? record.kind
        : 'habit';
  const unit = typeof record.unit === 'string' ? record.unit : null;
  const label = typeof record.label === 'string' ? record.label : null;

  return {
    action,
    quantity,
    unit,
    estimatedMinutes: typeof record.estimatedMinutes === 'number' ? record.estimatedMinutes : null,
    ...(label ? { label } : {}),
  };
}

function formatTarget(target: HabitTarget): string {
  if (target.label) return target.label;
  if (target.quantity !== null && target.unit) return `${target.quantity} ${target.unit}`;
  if (target.quantity !== null) return String(target.quantity);
  return target.action;
}

function mapLifecycleToUiStatus(state: HabitRow['lifecycle_state']): HabitListItem['status'] {
  if (state === 'paused' || state === 'draft' || state === 'stopped') return 'Paused';
  if (state === 'archived' || state === 'trash' || state === 'completed') return 'Archived';
  return 'Active';
}

function mapError(error: {
  code?: string | null;
  message?: string | null;
}): ProductRepositoryError {
  const code = error.code ?? '';
  if (code === 'P0001' || error.message === 'active_limit_reached') {
    return new ProductRepositoryError(
      'active_limit_reached',
      error.message ?? 'active_limit_reached',
    );
  }
  if (code === '40001' || error.message === 'revision_conflict') {
    return new ProductRepositoryError('stale_revision', error.message ?? 'revision_conflict');
  }
  if (code === 'P0002') {
    return new ProductRepositoryError('habit_not_found', error.message ?? 'habit_not_found');
  }
  if (code === '22000') {
    return new ProductRepositoryError(
      'idempotency_conflict',
      error.message ?? 'idempotency_conflict',
    );
  }
  return new ProductRepositoryError(
    'repository_unavailable',
    error.message ?? 'supabase_request_failed',
  );
}

function parseJsonResult(data: Json | null): Record<string, Json | undefined> {
  return asRecord(data);
}

function jsonString(value: Json | undefined, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function jsonNumber(value: Json | undefined, fallback: number): number {
  return typeof value === 'number' ? value : fallback;
}

function daysBetween(start: string, end: string): string[] {
  const result: string[] = [];
  const current = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (current <= last) {
    result.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return result;
}

function isScheduledOnDate(
  rule: ReturnType<typeof decodeHabitVersionPayload>['recurrence'],
  date: string,
): boolean {
  if (rule.kind === 'daily') return true;
  if (rule.kind === 'finite_dates') return rule.dates.includes(date);

  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay() || 7;
  return rule.kind === 'weekdays'
    ? rule.weekdays.includes(weekday as 1 | 2 | 3 | 4 | 5 | 6 | 7)
    : rule.placement.includes(weekday as 1 | 2 | 3 | 4 | 5 | 6 | 7);
}

function mapHabitRow(
  row: HabitRow,
  version: HabitVersionRow | undefined,
  metrics?: { successful: number; resolved: number },
): HabitListItem {
  const payload = decodeHabitVersionPayload(version?.metadata);
  const normalTarget = decodeTarget(version?.normal_target ?? {});
  const minimumTarget = decodeTarget(version?.minimum_target ?? {});
  const scheduleRecord = asRecord(version?.schedule_rule);
  const schedule =
    payload.timingContext ||
    `${jsonString(scheduleRecord.kind, 'daily')} (${payload.fromTime} - ${payload.untilTime})`;
  const description =
    payload.description ||
    `Target: ${formatTarget(normalTarget)} (Min: ${formatTarget(minimumTarget)})`;

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description,
    normalTarget,
    minimumTarget,
    schedule,
    cue: payload.cue.value ?? schedule,
    status: mapLifecycleToUiStatus(row.lifecycle_state),
    iconName: payload.icon,
    fromTime: payload.fromTime,
    untilTime: payload.untilTime,
    startLocalDate:
      payload.startLocalDate === '1970-01-01'
        ? row.created_at.slice(0, 10)
        : payload.startLocalDate,
    createdDate: row.created_at.slice(0, 10),
    version: version ? `v${version.version_number}` : 'v0',
    streak: metrics?.successful ?? 0,
    consistency:
      metrics && metrics.resolved > 0
        ? Math.round((metrics.successful / metrics.resolved) * 100)
        : 0,
    lifecycleState: row.lifecycle_state,
    currentVersionId: row.current_version_id,
    revision: row.revision,
    updatedAt: row.updated_at,
  };
}

function mapSession(
  row: SessionViewRow,
  version: HabitVersionRow | undefined,
  habit: HabitListItem | undefined,
): SessionSummary {
  const payload = decodeHabitVersionPayload(version?.metadata);
  return {
    id: row.session_id ?? '',
    habitId: row.habit_id ?? '',
    habitVersionId: row.habit_version_id ?? '',
    title: row.habit_title ?? 'Habit',
    category: habit?.category ?? 'Other',
    icon: payload.icon,
    timingContext: payload.timingContext,
    habitRevision: habit?.revision ?? 1,
    currentVersionId: habit?.currentVersionId ?? row.habit_version_id,
    normalTarget: decodeTarget(version?.normal_target ?? {}),
    minimumTarget: decodeTarget(version?.minimum_target ?? {}),
    cue: payload.cue,
    scheduledLocalDate: row.scheduled_local_date ?? '',
    scheduledLocalTime: row.scheduled_local_time,
    timezoneSnapshot: row.timezone_snapshot ?? 'UTC',
    status: (row.status ?? 'unrecorded') as DatabaseSessionStatus,
    revision: row.revision ?? 1,
    synchronizationState: 'synced',
  };
}

export function createSupabaseProductRepository({
  client,
  owner,
}: {
  client: SupabaseDatabaseClient;
  owner: ProductOwner;
}): ProductRepository {
  const assertOwner = (candidate: ProductOwner) => {
    if (candidate.ownerId !== owner.ownerId) {
      throw new ProductRepositoryError('repository_unavailable', 'repository_owner_mismatch');
    }
  };

  const loadVersions = async (habitIds: string[]) => {
    if (habitIds.length === 0) return [] as HabitVersionRow[];
    const { data, error } = await client
      .from('habit_versions')
      .select('*')
      .in('habit_id', habitIds)
      .order('version_number', { ascending: false });
    if (error) throw mapError(error);
    return data ?? [];
  };

  const loadMetrics = async (habitIds: string[]) => {
    if (habitIds.length === 0) return new Map<string, { successful: number; resolved: number }>();
    const { data, error } = await client
      .from('insight_consistency_view')
      .select('habit_id,successful_sessions,resolved_sessions')
      .in('habit_id', habitIds);
    if (error) throw mapError(error);
    return new Map(
      (data ?? []).map((row) => [
        row.habit_id ?? '',
        {
          successful: row.successful_sessions ?? 0,
          resolved: row.resolved_sessions ?? 0,
        },
      ]),
    );
  };

  return {
    async createHabit(command: CreateHabitCommand): Promise<CreateHabitResult> {
      assertOwner(command.owner);
      const { data, error } = await client.rpc('create_habit', {
        p_habit_id: command.habitId,
        p_title: command.title.trim(),
        p_category: command.category,
        p_version_id: command.habitVersionId,
        p_normal_target: command.normalTarget,
        p_minimum_target: command.minimumTarget,
        p_schedule_rule: {
          ...command.recurrence,
          startLocalDate: command.startLocalDate,
          fromTime: command.presentation.fromTime,
          untilTime: command.presentation.untilTime,
        },
        p_cue: command.cue,
        p_metadata: encodeHabitVersionPayload({
          description: command.presentation.description,
          icon: command.presentation.icon,
          fromTime: command.presentation.fromTime,
          untilTime: command.presentation.untilTime,
          timingContext: command.presentation.timingContext,
          startLocalDate: command.presentation.startLocalDate,
          recurrence: command.recurrence,
          cue: command.cue,
        }),
        p_recovery_structure: { durationSessions: 3, successThreshold: 2 },
        p_activate: command.activate,
        p_command_id: command.commandId,
      });
      if (error) throw mapError(error);
      const result = parseJsonResult(data);
      return {
        habitId: jsonString(result.habitId, command.habitId),
        habitVersionId: jsonString(result.habitVersionId, command.habitVersionId),
        lifecycleState: jsonString(
          result.lifecycleState,
          'draft',
        ) as CreateHabitResult['lifecycleState'],
        activeCount: jsonNumber(result.activeCount, 0),
        firstEligibleSessionId: null,
      };
    },

    async updateHabitVersion(command: UpdateHabitVersionCommand): Promise<void> {
      assertOwner(command.owner);
      const { error } = await client.rpc('redesign_habit', {
        p_habit_id: command.habitId,
        p_title: command.title.trim(),
        p_category: command.category,
        p_version_id: command.habitVersionId,
        p_expected_revision: command.expectedRevision,
        p_normal_target: command.normalTarget,
        p_minimum_target: command.minimumTarget,
        p_schedule_rule: {
          ...command.recurrence,
          startLocalDate: command.presentation.startLocalDate,
          fromTime: command.presentation.fromTime,
          untilTime: command.presentation.untilTime,
        },
        p_cue: command.cue,
        p_metadata: encodeHabitVersionPayload({
          description: command.presentation.description,
          icon: command.presentation.icon,
          fromTime: command.presentation.fromTime,
          untilTime: command.presentation.untilTime,
          timingContext: command.presentation.timingContext,
          startLocalDate: command.presentation.startLocalDate,
          recurrence: command.recurrence,
          cue: command.cue,
        }),
        p_recovery_structure: { durationSessions: 3, successThreshold: 2 },
        p_source: command.source,
        p_command_id: command.commandId,
      });
      if (error) throw mapError(error);
    },

    async setHabitLifecycle(command: SetHabitLifecycleCommand): Promise<void> {
      assertOwner(command.owner);
      const { error } = await client.rpc('set_habit_lifecycle', {
        p_habit_id: command.habitId,
        p_expected_revision: command.expectedRevision,
        p_next_state: command.nextState,
        p_command_id: command.commandId,
      });
      if (error) throw mapError(error);
    },

    async listHabits(candidate: ProductOwner): Promise<HabitListItem[]> {
      assertOwner(candidate);
      const { data, error } = await client
        .from('habits')
        .select('*')
        .eq('user_id', owner.ownerId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });
      if (error) throw mapError(error);

      const rows = data ?? [];
      const versions = await loadVersions(rows.map((row) => row.id));
      const metrics = await loadMetrics(rows.map((row) => row.id));
      const currentVersions = new Map(
        versions.map((version) => [`${version.habit_id}:${version.id}`, version]),
      );

      return rows.map((row) =>
        mapHabitRow(
          row,
          currentVersions.get(`${row.id}:${row.current_version_id}`),
          metrics.get(row.id),
        ),
      );
    },

    async getHabitDetail(candidate: ProductOwner, habitId: string) {
      assertOwner(candidate);
      const habits = await this.listHabits(candidate);
      const habit = habits.find((item) => item.id === habitId);
      if (!habit) return null;
      const versions = await loadVersions([habitId]);
      const current =
        versions.find((version) => version.id === habit.currentVersionId) ?? versions[0];
      const currentPayload = decodeHabitVersionPayload(current?.metadata);
      return {
        habit,
        currentVersion: {
          id: current?.id ?? '',
          versionNumber: current?.version_number ?? 0,
          normalTarget: decodeTarget(current?.normal_target ?? {}),
          minimumTarget: decodeTarget(current?.minimum_target ?? {}),
          recurrence: currentPayload.recurrence,
          cue: currentPayload.cue,
          metadata: currentPayload,
          createdAt: current?.created_at ?? habit.updatedAt,
          revision: habit.revision,
        },
        versions: versions.map((version) => ({
          id: version.id,
          versionNumber: version.version_number,
          createdAt: version.created_at,
          source: version.source as 'creation' | 'redesign' | 'recommendation' | 'restore',
        })),
        sessions: [],
      };
    },

    async ensureSessionHorizon(candidate: ProductOwner, throughLocalDate: string): Promise<number> {
      assertOwner(candidate);
      const { data: habits, error: habitsError } = await client
        .from('habits')
        .select('id,current_version_id,lifecycle_state')
        .eq('user_id', owner.ownerId)
        .in('lifecycle_state', [...activeLifecycleStates])
        .is('deleted_at', null);
      if (habitsError) throw mapError(habitsError);
      const activeRows = habits ?? [];
      const versions = await loadVersions(activeRows.map((row) => row.id));
      const versionById = new Map(versions.map((version) => [version.id, version]));
      const today = getLocalDateForTimezone(owner.timezone);
      let ensured = 0;

      for (const habit of activeRows) {
        const version = versionById.get(habit.current_version_id ?? '');
        if (!version) continue;
        const payload = decodeHabitVersionPayload(version.metadata);
        const firstDate = payload.startLocalDate > today ? payload.startLocalDate : today;
        for (const date of daysBetween(firstDate, throughLocalDate)) {
          if (!isScheduledOnDate(payload.recurrence, date)) continue;
          const localTime = payload.fromTime || '08:00';
          const eligibleAt = new Date(`${date}T00:00:00.000Z`);
          const resolutionDueAt = new Date(eligibleAt);
          resolutionDueAt.setUTCDate(resolutionDueAt.getUTCDate() + 3);
          const { error } = await client.rpc('ensure_session', {
            p_session_id: createId(),
            p_habit_id: habit.id,
            p_habit_version_id: version.id,
            p_scheduled_local_date: date,
            p_scheduled_local_time: localTime,
            p_timezone_snapshot: owner.timezone,
            p_eligible_at: eligibleAt.toISOString(),
            p_resolution_due_at: resolutionDueAt.toISOString(),
            p_command_id: createId(),
          });
          if (error) throw mapError(error);
          ensured += 1;
        }
      }
      return ensured;
    },

    async getToday(candidate: ProductOwner, localDate: string): Promise<TodayRepositoryRead> {
      assertOwner(candidate);
      const { data, error } = await client
        .from('today_session_view')
        .select('*')
        .eq('user_id', owner.ownerId)
        .eq('scheduled_local_date', localDate)
        .order('scheduled_local_time', { ascending: true });
      if (error) throw mapError(error);
      const rows = data ?? [];
      const versions = await loadVersions(rows.map((row) => row.habit_id ?? '').filter(Boolean));
      const versionById = new Map(versions.map((version) => [version.id, version]));
      const habits = await this.listHabits(candidate);
      const habitById = new Map(habits.map((habit) => [habit.id, habit]));
      const sessions = rows.map((row) =>
        mapSession(
          row,
          versionById.get(row.habit_version_id ?? ''),
          habitById.get(row.habit_id ?? ''),
        ),
      );
      const activeHabitCount = habits.filter((habit) => habit.status === 'Active').length;
      const activeHabitLimit =
        owner.planTier === 'premium' ? 30 : owner.planTier === 'lite' ? 10 : 5;
      return { localDate, sessions, activeHabitCount, activeHabitLimit };
    },

    async getWeeklyOverview(
      candidate: ProductOwner,
      localDate: string,
    ): Promise<WeeklyOverviewRead> {
      assertOwner(candidate);
      const range = getLocalWeekRange(localDate);
      const { data: activeHabits, error: habitsError } = await client
        .from('habits')
        .select('id')
        .eq('user_id', owner.ownerId)
        .in('lifecycle_state', [...activeLifecycleStates])
        .is('deleted_at', null);
      if (habitsError) throw mapError(habitsError);

      const activeHabitIds = (activeHabits ?? []).map((habit) => habit.id);

      const counts = new Map(
        range.dates.map((date) => [date, { completedCount: 0, totalCount: 0 }]),
      );

      if (activeHabitIds.length > 0) {
        const { data, error } = await client
          .from('sessions')
          .select('habit_id,scheduled_local_date,status')
          .eq('user_id', owner.ownerId)
          .in('habit_id', activeHabitIds)
          .gte('scheduled_local_date', range.startDate)
          .lte('scheduled_local_date', range.endDate);
        if (error) throw mapError(error);

        for (const row of data ?? []) {
          const date = row.scheduled_local_date;
          const count = counts.get(date);
          if (!count) continue;
          count.totalCount += 1;
          if (row.status === 'full' || row.status === 'minimum') {
            count.completedCount += 1;
          }
        }
      }

      return {
        todayDate: range.todayDate,
        startDate: range.startDate,
        endDate: range.endDate,
        days: range.dates.map((date) => ({
          localDate: date,
          completedCount: counts.get(date)?.completedCount ?? 0,
          totalCount: counts.get(date)?.totalCount ?? 0,
        })),
      };
    },

    async recordCheckIn(command: RecordCheckInRepositoryCommand): Promise<RecordCheckInResult> {
      assertOwner(command.owner);
      const { data, error } = await client.rpc('record_check_in', {
        p_check_in_id: createId(),
        p_session_id: command.sessionId,
        p_outcome: command.outcome,
        p_friction_code: command.frictionCode as string,
        p_friction_note: command.frictionNote as string,
        p_recorded_local_at: command.clientRecordedAt,
        p_timezone_snapshot: owner.timezone,
        p_expected_session_revision: command.expectedSessionRevision,
        p_command_id: command.commandId,
      });
      if (error) throw mapError(error);
      const result = parseJsonResult(data);
      return {
        checkInId: jsonString(result.checkInId, ''),
        sessionId: jsonString(result.sessionId, command.sessionId),
        outcome: jsonString(
          result.sessionStatus,
          command.outcome,
        ) as RecordCheckInResult['outcome'],
        sessionRevision: jsonNumber(result.sessionRevision, command.expectedSessionRevision + 1),
        synchronizationState: 'synced',
      };
    },

    async editCheckIn(command: EditCheckInRepositoryCommand): Promise<RecordCheckInResult> {
      return this.recordCheckIn(command);
    },

    async saveHabitDraft(): Promise<void> {
      throw new ProductRepositoryError(
        'repository_unavailable',
        'drafts_are_not_part_of_this_core_loop',
      );
    },

    async getHabitDraft(): Promise<unknown | null> {
      return null;
    },

    async deleteHabitDraft(): Promise<void> {
      return undefined;
    },

    async resolveExpiredUnrecorded(): Promise<number> {
      return 0;
    },
  };
}
