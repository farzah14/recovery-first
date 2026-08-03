import type { SupabaseClient } from '@supabase/supabase-js';

import { activeHabitLimitFor } from '@/domain/habits/active-slot-policy';
import { isSlotConsumingHabitState } from '@/domain/habits/habit-lifecycle';
import type { HabitLifecycleState } from '@/domain/habits/habit-lifecycle';
import type { RecurrenceRule } from '@/domain/habits/recurrence';
import { generateSessionsForCommand } from '@/features/sessions/application/ensure-session-horizon';
import type { Database, Json } from '@/lib/supabase/database.types';
import { ProductRepositoryError } from '@/lib/repositories/repository-errors';
import type {
  CreateHabitCommand,
  CreateHabitResult,
  EditCheckInRepositoryCommand,
  HabitDetailRead,
  HabitListItem,
  HabitTarget,
  ProductOwner,
  ProductRepository,
  RecordCheckInRepositoryCommand,
  RecordCheckInResult,
  SessionSummary,
  TodayRepositoryRead,
} from '@/lib/repositories/product-repository';

export type SupabaseProductRepositoryClient = Pick<SupabaseClient<Database>, 'from' | 'rpc'>;

type ProviderError = { code?: string; message?: string; details?: string };
type SummaryRow = Database['public']['Views']['habit_summary_view']['Row'];
type TodayRow = Database['public']['Views']['today_session_view']['Row'];
type HabitRow = Database['public']['Tables']['habits']['Row'];
type VersionRow = Database['public']['Tables']['habit_versions']['Row'];
type SessionRow = Database['public']['Tables']['sessions']['Row'];
type CheckInRow = Database['public']['Tables']['check_ins']['Row'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function targetFromJson(value: Json | null | undefined): HabitTarget {
  const record = isRecord(value) ? value : {};
  return {
    action: stringValue(record.action, ''),
    quantity: typeof record.quantity === 'number' ? record.quantity : null,
    unit: typeof record.unit === 'string' ? record.unit : null,
    estimatedMinutes: typeof record.estimatedMinutes === 'number' ? record.estimatedMinutes : null,
  };
}

function cueFromJson(value: Json | null | undefined): CreateHabitCommand['cue'] {
  const record = isRecord(value) ? value : null;
  const type = record?.type;
  if (type !== 'time' && type !== 'after_activity' && type !== 'location' && type !== 'none') {
    return { type: 'none', value: null };
  }
  return { type, value: typeof record?.value === 'string' ? record.value : null };
}

function recurrenceFromJson(value: Json): RecurrenceRule {
  const record = isRecord(value) ? value : {};
  if (record.kind === 'daily') return { kind: 'daily' };
  if (
    record.kind === 'weekdays' &&
    Array.isArray(record.weekdays) &&
    record.weekdays.every((day): day is 1 | 2 | 3 | 4 | 5 | 6 | 7 =>
      typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= 7,
    )
  ) {
    return { kind: 'weekdays', weekdays: record.weekdays };
  }
  if (
    record.kind === 'times_per_week' &&
    typeof record.count === 'number' &&
    Array.isArray(record.placement) &&
    record.placement.every((day): day is 1 | 2 | 3 | 4 | 5 | 6 | 7 =>
      typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= 7,
    )
  ) {
    return { kind: 'times_per_week', count: record.count, placement: record.placement };
  }
  if (
    record.kind === 'finite_dates' &&
    Array.isArray(record.dates) &&
    record.dates.every((date): date is string => typeof date === 'string')
  ) {
    return { kind: 'finite_dates', dates: record.dates };
  }
  return { kind: 'daily' };
}

function lifecycleFromValue(value: unknown): HabitLifecycleState {
  if (
    value === 'draft' || value === 'starting' || value === 'building' || value === 'active' ||
    value === 'stable' || value === 'at_risk' || value === 'recovery' || value === 'rebuilding' ||
    value === 'needs_review' || value === 'paused' || value === 'stopped' || value === 'completed' ||
    value === 'archived' || value === 'trash' || value === 'decision_required'
  ) return value;
  return 'draft';
}

function sessionStatusFromValue(value: unknown): SessionSummary['status'] {
  if (
    value === 'full' || value === 'minimum' || value === 'manual_skipped' ||
    value === 'automatic_skipped' || value === 'excused' || value === 'unrecorded'
  ) return value;
  return 'unrecorded';
}

function versionSourceFromValue(value: unknown): HabitDetailRead['versions'][number]['source'] {
  return value === 'redesign' || value === 'recommendation' || value === 'restore' ? value : 'creation';
}

function errorDetails(error: unknown): ProviderError {
  if (isRecord(error)) {
    const result: ProviderError = {};
    if (typeof error.code === 'string') result.code = error.code;
    if (typeof error.message === 'string') result.message = error.message;
    if (typeof error.details === 'string') result.details = error.details;
    return result;
  }
  return {};
}

function mapProviderError(error: unknown, operation: 'habit' | 'session' | 'check_in' | 'read'): ProductRepositoryError {
  if (error instanceof ProductRepositoryError) return error;
  const details = errorDetails(error);
  const message = `${details.message ?? ''} ${details.details ?? ''}`.toLowerCase();
  if (message.includes('active_limit_reached') || message.includes('active_habit_limit_reached')) {
    return new ProductRepositoryError('active_limit_reached');
  }
  if (message.includes('same_day_edit_closed')) return new ProductRepositoryError('same_day_edit_closed');
  if (message.includes('idempotency_payload_conflict')) return new ProductRepositoryError('idempotency_conflict');
  if (message.includes('revision_conflict') || details.code === '40001' || message.includes('stale_revision')) {
    return new ProductRepositoryError('stale_revision');
  }
  if (message.includes('session_not_found') || message.includes('habit_version_not_found')) {
    return new ProductRepositoryError('session_not_found');
  }
  if (message.includes('habit_not_found') || message.includes('row_not_found')) {
    return new ProductRepositoryError(operation === 'session' || operation === 'check_in' ? 'session_not_found' : 'habit_not_found');
  }
  if (details.code === '42501' || message.includes('rls') || message.includes('permission')) {
    return new ProductRepositoryError(operation === 'session' || operation === 'check_in' ? 'session_not_found' : 'habit_not_found');
  }
  return new ProductRepositoryError('repository_unavailable', 'Supabase repository unavailable', {
    providerCode: details.code ?? null,
  });
}

function asRecordResult(value: Json | null): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

export class SupabaseProductRepository implements ProductRepository {
  constructor(
    private readonly client: SupabaseProductRepositoryClient,
    private readonly userId: string,
  ) {
    if (!userId.trim()) throw new Error('authenticated user ID is required');
  }

  private assertOwner(owner: ProductOwner): void {
    if (owner.identityMode !== 'account' || owner.ownerId !== this.userId) {
      throw new ProductRepositoryError('repository_unavailable', 'Signed-in repository owner mismatch');
    }
  }

  private async ensureSession(command: {
    sessionId: string;
    habitId: string;
    habitVersionId: string;
    scheduledLocalDate: string;
    scheduledLocalTime: string | null;
    timezoneSnapshot: string;
    eligibleAt: string;
    resolutionDueAt: string;
    commandId: string;
  }): Promise<Json | null> {
    const params = {
      p_session_id: command.sessionId,
      p_habit_id: command.habitId,
      p_habit_version_id: command.habitVersionId,
      p_scheduled_local_date: command.scheduledLocalDate,
      p_scheduled_local_time: command.scheduledLocalTime,
      p_timezone_snapshot: command.timezoneSnapshot,
      p_eligible_at: command.eligibleAt,
      p_resolution_due_at: command.resolutionDueAt,
      p_command_id: command.commandId,
    } as unknown as Database['public']['Functions']['ensure_session']['Args'];
    const { data, error } = await this.client.rpc('ensure_session', params);
    if (error) throw mapProviderError(error, 'session');
    return data;
  }

  async createHabit(command: CreateHabitCommand): Promise<CreateHabitResult> {
    this.assertOwner(command.owner);
    try {
      const { error: insertError } = await this.client.from('habits').insert({
        id: command.habitId,
        user_id: this.userId,
        title: command.title,
        category: command.category,
        lifecycle_state: 'draft',
        current_version_id: null,
        deleted_at: null,
        purge_after: null,
      });
      if (insertError) throw insertError;

      const { data: versionData, error: versionError } = await this.client.rpc('create_habit_version', {
        p_habit_id: command.habitId,
        p_version_id: command.habitVersionId,
        p_expected_revision: 1,
        p_normal_target: command.normalTarget,
        p_minimum_target: command.minimumTarget,
        p_schedule_rule: command.recurrence,
        p_cue: command.cue,
        p_recovery_structure: {},
        p_source: 'creation',
        p_command_id: command.commandId,
      });
      if (versionError) throw versionError;

      const sessions = command.activate ? generateSessionsForCommand(command) : [];
      if (command.activate) {
        const { data: activationData, error: activationError } = await this.client.rpc('activate_habit', {
          p_habit_id: command.habitId,
          p_expected_revision: 2,
          p_command_id: `${command.commandId}-activate`,
        });
        if (activationError) throw activationError;
        for (const session of sessions) {
          await this.ensureSession({
            sessionId: session.id,
            habitId: session.habitId,
            habitVersionId: session.habitVersionId,
            scheduledLocalDate: session.scheduledLocalDate,
            scheduledLocalTime: session.scheduledLocalTime,
            timezoneSnapshot: session.timezoneSnapshot,
            eligibleAt: session.eligibleAt,
            resolutionDueAt: session.resolutionDueAt,
            commandId: `${command.commandId}-session-${session.id}`,
          });
        }
        const activation = asRecordResult(activationData);
        return {
          habitId: command.habitId,
          habitVersionId: command.habitVersionId,
          lifecycleState: lifecycleFromValue(activation.lifecycleState),
          activeCount: numberValue(activation.activeCount, 1),
          firstEligibleSessionId: sessions[0]?.id ?? null,
        };
      }
      void versionData;
      return {
        habitId: command.habitId,
        habitVersionId: command.habitVersionId,
        lifecycleState: 'draft',
        activeCount: 0,
        firstEligibleSessionId: null,
      };
    } catch (error) {
      throw mapProviderError(error, 'habit');
    }
  }

  async saveHabitDraft(): Promise<void> {
    throw new ProductRepositoryError('repository_unavailable', 'Signed-in drafts require an approved server draft boundary');
  }

  async getHabitDraft(owner: ProductOwner): Promise<unknown | null> {
    this.assertOwner(owner);
    return null;
  }

  async deleteHabitDraft(): Promise<void> {
    throw new ProductRepositoryError('repository_unavailable', 'Signed-in drafts require an approved server draft boundary');
  }

  async listHabits(owner: ProductOwner): Promise<HabitListItem[]> {
    this.assertOwner(owner);
    try {
      const { data, error } = await this.client.from('habit_summary_view')
        .select('*')
        .eq('user_id', this.userId);
      if (error) throw error;
      return (data ?? []).flatMap((row: SummaryRow) => {
        if (!row.habit_id || !row.title || !row.lifecycle_state) return [];
        return [{
          id: row.habit_id,
          title: row.title,
          lifecycleState: row.lifecycle_state,
          currentVersionId: row.current_version_id,
          updatedAt: new Date().toISOString(),
        }];
      });
    } catch (error) {
      throw mapProviderError(error, 'read');
    }
  }

  async getHabitDetail(owner: ProductOwner, habitId: string): Promise<HabitDetailRead | null> {
    this.assertOwner(owner);
    try {
      const [{ data: summary, error: summaryError }, { data: habit, error: habitError }, { data: versions, error: versionsError }, { data: sessions, error: sessionsError }, { data: checkIns, error: checkInsError }] = await Promise.all([
        this.client.from('habit_summary_view').select('*').eq('user_id', this.userId).eq('habit_id', habitId).maybeSingle(),
        this.client.from('habits').select('*').eq('user_id', this.userId).eq('id', habitId).maybeSingle(),
        this.client.from('habit_versions').select('*').eq('user_id', this.userId).eq('habit_id', habitId).order('version_number', { ascending: false }),
        this.client.from('sessions').select('*').eq('user_id', this.userId).eq('habit_id', habitId).order('scheduled_local_date', { ascending: false }),
        this.client.from('check_ins').select('*').eq('user_id', this.userId),
      ]);
      if (summaryError) throw summaryError;
      if (habitError) throw habitError;
      if (versionsError) throw versionsError;
      if (sessionsError) throw sessionsError;
      if (checkInsError) throw checkInsError;
      if (!summary || !habit || !summary.current_version_id) return null;

      const versionRows = (versions ?? []) as VersionRow[];
      const currentVersion = versionRows.find((version) => version.id === summary.current_version_id);
      if (!currentVersion) return null;
      const checkInBySession = new Map(((checkIns ?? []) as CheckInRow[]).map((checkIn) => [checkIn.session_id, checkIn]));
      const sessionRows = (sessions ?? []) as SessionRow[];
      return {
        habit: {
          id: habit.id,
          title: habit.title,
          lifecycleState: habit.lifecycle_state,
          currentVersionId: habit.current_version_id,
          updatedAt: habit.updated_at,
        },
        currentVersion: {
          id: currentVersion.id,
          versionNumber: currentVersion.version_number,
          normalTarget: targetFromJson(currentVersion.normal_target),
          minimumTarget: targetFromJson(currentVersion.minimum_target),
          recurrence: recurrenceFromJson(currentVersion.schedule_rule),
          cue: cueFromJson(currentVersion.cue),
          createdAt: currentVersion.created_at,
        },
        versions: versionRows.map((version) => ({
          id: version.id,
          versionNumber: version.version_number,
          createdAt: version.created_at,
          source: versionSourceFromValue(version.source),
        })),
        sessions: sessionRows.map((session) => {
          const version = versionRows.find((candidate) => candidate.id === session.habit_version_id) ?? currentVersion;
          const checkIn = checkInBySession.get(session.id);
          return {
            id: session.id,
            habitId: session.habit_id,
            habitVersionId: session.habit_version_id,
            title: habit.title,
            normalTarget: targetFromJson(version.normal_target),
            minimumTarget: targetFromJson(version.minimum_target),
            cue: cueFromJson(version.cue),
            scheduledLocalDate: session.scheduled_local_date,
            scheduledLocalTime: session.scheduled_local_time,
            timezoneSnapshot: session.timezone_snapshot,
            status: checkIn?.outcome ?? session.status,
            revision: session.revision,
            synchronizationState: 'synced',
          } satisfies SessionSummary;
        }),
      };
    } catch (error) {
      throw mapProviderError(error, 'habit');
    }
  }

  async ensureSessionHorizon(owner: ProductOwner, throughLocalDate: string): Promise<number> {
    this.assertOwner(owner);
    try {
      const { data: habits, error: habitsError } = await this.client.from('habits').select('*')
        .eq('user_id', this.userId).is('deleted_at', null)
        .in('lifecycle_state', ['starting', 'building', 'active', 'stable', 'at_risk', 'recovery', 'rebuilding', 'needs_review']);
      if (habitsError) throw habitsError;
      const habitRows = (habits ?? []) as HabitRow[];
      if (habitRows.length === 0) return 0;
      const { data: versions, error: versionsError } = await this.client.from('habit_versions').select('*')
        .eq('user_id', this.userId).in('habit_id', habitRows.map((habit) => habit.id));
      if (versionsError) throw versionsError;
      const versionRows = (versions ?? []) as VersionRow[];
      let ensured = 0;
      for (const habit of habitRows) {
        const version = versionRows.find((candidate) => candidate.id === habit.current_version_id);
        if (!version) continue;
        const command = {
          commandId: `horizon:${habit.id}:${version.id}:${throughLocalDate}`,
          habitId: habit.id,
          habitVersionId: version.id,
          owner,
          title: habit.title,
          category: 'other',
          normalTarget: targetFromJson(version.normal_target),
          minimumTarget: targetFromJson(version.minimum_target),
          recurrence: recurrenceFromJson(version.schedule_rule),
          cue: cueFromJson(version.cue),
          reminderIntent: { enabled: false, localTime: null },
          startLocalDate: habit.created_at.slice(0, 10),
          activate: true,
          clientCreatedAt: habit.created_at,
        } satisfies CreateHabitCommand;
        for (const session of generateSessionsForCommand(command, throughLocalDate)) {
          await this.ensureSession({
            sessionId: session.id,
            habitId: session.habitId,
            habitVersionId: session.habitVersionId,
            scheduledLocalDate: session.scheduledLocalDate,
            scheduledLocalTime: session.scheduledLocalTime,
            timezoneSnapshot: session.timezoneSnapshot,
            eligibleAt: session.eligibleAt,
            resolutionDueAt: session.resolutionDueAt,
            commandId: `${command.commandId}:${session.id}`,
          });
          ensured += 1;
        }
      }
      return ensured;
    } catch (error) {
      throw mapProviderError(error, 'session');
    }
  }

  async resolveExpiredUnrecorded(owner: ProductOwner): Promise<number> {
    this.assertOwner(owner);
    throw new ProductRepositoryError('repository_unavailable', 'Signed-in expiry reconciliation requires an approved server function');
  }

  async getToday(owner: ProductOwner, localDate: string): Promise<TodayRepositoryRead> {
    this.assertOwner(owner);
    try {
      const [{ data: todayRows, error: todayError }, { data: versions, error: versionsError }, { data: summaries, error: summariesError }] = await Promise.all([
        this.client.from('today_session_view').select('*').eq('user_id', this.userId).eq('scheduled_local_date', localDate).order('scheduled_local_time', { ascending: true, nullsFirst: true }),
        this.client.from('habit_versions').select('*').eq('user_id', this.userId),
        this.client.from('habit_summary_view').select('habit_id,lifecycle_state').eq('user_id', this.userId),
      ]);
      if (todayError) throw todayError;
      if (versionsError) throw versionsError;
      if (summariesError) throw summariesError;
      const versionById = new Map(((versions ?? []) as VersionRow[]).map((version) => [version.id, version]));
      const sessions = ((todayRows ?? []) as TodayRow[]).flatMap((row) => {
        if (!row.session_id || !row.habit_id || !row.habit_version_id || !row.habit_title || !row.scheduled_local_date) return [];
        const version = versionById.get(row.habit_version_id);
        if (!version) return [];
        return [{
          id: row.session_id,
          habitId: row.habit_id,
          habitVersionId: row.habit_version_id,
          title: row.habit_title,
          normalTarget: targetFromJson(version.normal_target),
          minimumTarget: targetFromJson(version.minimum_target),
          cue: cueFromJson(version.cue),
          scheduledLocalDate: row.scheduled_local_date,
          scheduledLocalTime: row.scheduled_local_time,
          timezoneSnapshot: row.timezone_snapshot ?? owner.timezone,
          status: sessionStatusFromValue(row.status),
          revision: row.revision ?? 1,
          synchronizationState: 'synced',
        } satisfies SessionSummary];
      });
      const activeHabitCount = ((summaries ?? []) as SummaryRow[]).filter((summary) =>
        summary.lifecycle_state && isSlotConsumingHabitState(summary.lifecycle_state),
      ).length;
      return {
        localDate,
        sessions,
        activeHabitCount,
        activeHabitLimit: activeHabitLimitFor(owner.planTier),
      };
    } catch (error) {
      throw mapProviderError(error, 'read');
    }
  }

  async recordCheckIn(command: RecordCheckInRepositoryCommand): Promise<RecordCheckInResult> {
    this.assertOwner(command.owner);
    try {
      const checkInId = crypto.randomUUID();
      const params = {
        p_check_in_id: checkInId,
        p_session_id: command.sessionId,
        p_outcome: command.outcome,
        p_friction_code: command.frictionCode,
        p_friction_note: command.frictionNote,
        p_recorded_local_at: command.clientRecordedAt,
        p_timezone_snapshot: command.owner.timezone,
        p_expected_session_revision: command.expectedSessionRevision,
        p_command_id: command.commandId,
      } as unknown as Database['public']['Functions']['record_check_in']['Args'];
      const { data, error } = await this.client.rpc('record_check_in', params);
      if (error) throw error;
      const result = asRecordResult(data);
      return {
        checkInId: stringValue(result.checkInId, checkInId),
        sessionId: stringValue(result.sessionId, command.sessionId),
        outcome: command.outcome,
        sessionRevision: numberValue(result.sessionRevision, command.expectedSessionRevision + 1),
        synchronizationState: 'synced',
      };
    } catch (error) {
      throw mapProviderError(error, 'check_in');
    }
  }

  async editCheckIn(command: EditCheckInRepositoryCommand): Promise<RecordCheckInResult> {
    this.assertOwner(command.owner);
    return this.recordCheckIn({
      commandId: command.commandId,
      owner: command.owner,
      sessionId: command.sessionId,
      outcome: command.outcome,
      frictionCode: command.frictionCode,
      frictionNote: command.frictionNote,
      expectedSessionRevision: command.expectedSessionRevision,
      clientRecordedAt: command.clientRecordedAt,
    });
  }
}
