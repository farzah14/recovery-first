import type { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import type { LocalCommandResultRecord, LocalSessionRecord } from '@/lib/indexed-db/types';
import { ProductRepositoryError } from '@/lib/repositories/repository-errors';
import type {
  CreateHabitCommand,
  CreateHabitResult,
  EditCheckInRepositoryCommand,
  HabitDetailRead,
  HabitListItem,
  ProductOwner,
  ProductRepository,
  RecordCheckInRepositoryCommand,
  RecordCheckInResult,
  SessionSummary,
  TodayRepositoryRead,
} from '@/lib/repositories/product-repository';
import type { RecurrenceRule } from '@/domain/habits/recurrence';
import { activeHabitLimitFor } from '@/domain/habits/active-slot-policy';
import { isSlotConsumingHabitState } from '@/domain/habits/habit-lifecycle';
import { generateSessionsForCommand } from '@/features/sessions/application/ensure-session-horizon';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toHabitTarget(value: unknown): CreateHabitCommand['normalTarget'] {
  const record = isRecord(value) ? value : {};
  return {
    action: typeof record.action === 'string' ? record.action : '',
    quantity: typeof record.quantity === 'number' ? record.quantity : null,
    unit: typeof record.unit === 'string' ? record.unit : null,
    estimatedMinutes:
      typeof record.estimatedMinutes === 'number' ? record.estimatedMinutes : null,
  };
}

function toHabitCue(value: unknown): CreateHabitCommand['cue'] {
  const record = isRecord(value) ? value : null;
  const type = record?.type;
  if (type !== 'time' && type !== 'after_activity' && type !== 'location' && type !== 'none') {
    return { type: 'none', value: null };
  }
  return {
    type,
    value: typeof record?.value === 'string' ? record.value : null,
  };
}

function toRecurrence(value: unknown): RecurrenceRule {
  if (!isRecord(value)) return { kind: 'daily' };
  if (value.kind === 'daily') return { kind: 'daily' };
  if (
    value.kind === 'weekdays' &&
    Array.isArray(value.weekdays) &&
    value.weekdays.every((day): day is 1 | 2 | 3 | 4 | 5 | 6 | 7 =>
      typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= 7,
    )
  ) {
    return { kind: 'weekdays', weekdays: value.weekdays };
  }
  if (
    value.kind === 'times_per_week' &&
    typeof value.count === 'number' &&
    Number.isInteger(value.count) &&
    value.count >= 1 &&
    value.count <= 7 &&
    Array.isArray(value.placement) &&
    value.placement.every((day): day is 1 | 2 | 3 | 4 | 5 | 6 | 7 =>
      typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= 7,
    )
  ) {
    return { kind: 'times_per_week', count: value.count, placement: value.placement };
  }
  return { kind: 'daily' };
}

function toVersionSource(value: unknown): HabitDetailRead['versions'][number]['source'] {
  return value === 'redesign' || value === 'recommendation' || value === 'restore'
    ? value
    : 'creation';
}

function toSessionSyncState(value: LocalSessionRecord['synchronizationState']): SessionSummary['synchronizationState'] {
  if (value === 'synchronized') return 'synced';
  if (value === 'blocked') return 'conflict';
  return value;
}

function localDateForTime(isoTime: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(isoTime));
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get('year')}-${values.get('month')}-${values.get('day')}`;
}

export class DexieProductRepository implements ProductRepository {
  constructor(private readonly database: RecoveryFirstDatabase) {}

  async createHabit(command: CreateHabitCommand): Promise<CreateHabitResult> {
    return this.database.transaction(
      'rw',
      this.database.habits,
      this.database.habitVersions,
      this.database.sessions,
      this.database.commandResults,
      async () => {
        const requestHash = JSON.stringify(command);
        const replay = await this.database.commandResults.get(command.commandId);
        if (replay) {
          if (replay.requestHash !== requestHash) {
            throw new ProductRepositoryError('idempotency_conflict');
          }
          return replay.result as CreateHabitResult;
        }

        const activeHabits = await this.database.habits
          .where('[ownerType+ownerId]')
          .equals(['guest', command.owner.ownerId])
          .filter((habit) =>
            habit.deletedAt === null &&
            [
              'starting',
              'building',
              'active',
              'stable',
              'at_risk',
              'recovery',
              'rebuilding',
              'needs_review',
            ].includes(habit.lifecycleState),
          )
          .count();

        if (command.activate && activeHabits >= 3) {
          throw new ProductRepositoryError(
            'active_limit_reached',
            'Guest active habit limit reached',
            { limit: 3 },
          );
        }

        await this.database.habits.add({
          id: command.habitId,
          ownerType: 'guest',
          ownerId: command.owner.ownerId,
          title: command.title,
          lifecycleState: command.activate ? 'starting' : 'draft',
          currentVersionId: command.habitVersionId,
          revision: 1,
          synchronizationState: 'local_only',
          createdAt: command.clientCreatedAt,
          updatedAt: command.clientCreatedAt,
          deletedAt: null,
        });

        await this.database.habitVersions.add({
          id: command.habitVersionId,
          habitId: command.habitId,
          ownerType: 'guest',
          ownerId: command.owner.ownerId,
          versionNumber: 1,
          normalTarget: command.normalTarget,
          minimumTarget: command.minimumTarget,
          scheduleRule: command.recurrence,
          cue: command.cue,
          recoveryStructure: {},
          source: 'creation',
          parentVersionId: null,
          createdAt: command.clientCreatedAt,
        });

        const sessions = command.activate ? generateSessionsForCommand(command) : [];
        if (sessions.length > 0) await this.database.sessions.bulkAdd(sessions);

        const result: CreateHabitResult = {
          habitId: command.habitId,
          habitVersionId: command.habitVersionId,
          lifecycleState: command.activate ? 'starting' : 'draft',
          activeCount: activeHabits + (command.activate ? 1 : 0),
          firstEligibleSessionId: sessions[0]?.id ?? null,
        };

        const expiresAt = new Date(
          Date.parse(command.clientCreatedAt) + 90 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const replayRecord: LocalCommandResultRecord = {
          id: command.commandId,
          ownerType: 'guest',
          ownerId: command.owner.ownerId,
          operationType: 'create_habit',
          requestHash,
          result,
          createdAt: command.clientCreatedAt,
          expiresAt,
        };
        await this.database.commandResults.put(replayRecord);
        return result;
      },
    );
  }

  async saveHabitDraft(
    owner: ProductOwner,
    draftId: string,
    payload: unknown,
    updatedAt: string,
  ): Promise<void> {
    await this.database.drafts.put({
      id: draftId,
      ownerType: owner.identityMode,
      ownerId: owner.ownerId,
      draftType: 'habit_wizard',
      payload: payload as Record<string, unknown>,
      updatedAt,
    });
  }

  async getHabitDraft(owner: ProductOwner, draftId: string): Promise<unknown | null> {
    const draft = await this.database.drafts.get(draftId);
    return draft?.ownerId === owner.ownerId ? draft.payload : null;
  }

  async deleteHabitDraft(owner: ProductOwner, draftId: string): Promise<void> {
    const draft = await this.database.drafts.get(draftId);
    if (draft?.ownerId === owner.ownerId) await this.database.drafts.delete(draftId);
  }

  async ensureSessionHorizon(
    owner: ProductOwner,
    throughLocalDate: string,
  ): Promise<number> {
    return this.database.transaction('rw', this.database.habits, this.database.habitVersions, this.database.sessions, async () => {
      const activeHabits = await this.database.habits
        .where('[ownerType+ownerId]')
        .equals([owner.identityMode, owner.ownerId])
        .filter(
          (habit) =>
            habit.deletedAt === null &&
            [
              'starting',
              'building',
              'active',
              'stable',
              'at_risk',
              'recovery',
              'rebuilding',
              'needs_review',
            ].includes(habit.lifecycleState),
        )
        .toArray();

      const generated = (
        await Promise.all(
          activeHabits.map(async (habit) => {
            if (!habit.currentVersionId) return [];
            const version = await this.database.habitVersions.get(habit.currentVersionId);
            if (!version) return [];

            return generateSessionsForCommand(
              {
                commandId: `horizon:${habit.id}:${version.id}:${throughLocalDate}`,
                habitId: habit.id,
                habitVersionId: version.id,
                owner,
                title: habit.title,
                category: 'other',
                normalTarget: toHabitTarget(version.normalTarget),
                minimumTarget: toHabitTarget(version.minimumTarget),
                recurrence: version.scheduleRule,
                cue: toHabitCue(version.cue),
                reminderIntent: { enabled: false, localTime: null },
                startLocalDate: habit.createdAt.slice(0, 10),
                activate: true,
                clientCreatedAt: habit.createdAt,
              },
              throughLocalDate,
            );
          }),
        )
      ).flat();

      const existing = await this.database.sessions.bulkGet(generated.map((session) => session.id));
      const missing = generated.filter((_, index) => !existing[index]);
      if (missing.length > 0) await this.database.sessions.bulkAdd(missing);
      return missing.length;
    });
  }

  async listHabits(owner: ProductOwner): Promise<HabitListItem[]> {
    const habits = await this.database.habits
      .where('[ownerType+ownerId]')
      .equals([owner.identityMode, owner.ownerId])
      .filter((habit) => habit.deletedAt === null)
      .toArray();

    return habits
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((habit) => ({
        id: habit.id,
        title: habit.title,
        lifecycleState: habit.lifecycleState,
        currentVersionId: habit.currentVersionId,
        updatedAt: habit.updatedAt,
      }));
  }

  async getHabitDetail(owner: ProductOwner, habitId: string): Promise<HabitDetailRead | null> {
    return this.database.transaction(
      'r',
      this.database.habits,
      this.database.habitVersions,
      this.database.sessions,
      this.database.checkIns,
      async () => {
        const habit = await this.database.habits.get(habitId);
        if (
          !habit ||
          habit.ownerType !== owner.identityMode ||
          habit.ownerId !== owner.ownerId ||
          habit.deletedAt !== null ||
          !habit.currentVersionId
        ) {
          return null;
        }

        const versions = await this.database.habitVersions
          .where('habitId')
          .equals(habitId)
          .filter(
            (version) =>
              version.ownerType === owner.identityMode && version.ownerId === owner.ownerId,
          )
          .toArray();
        const currentVersion = versions.find((version) => version.id === habit.currentVersionId);
        if (!currentVersion) return null;

        const sessions = await this.database.sessions
          .where('habitId')
          .equals(habitId)
          .filter(
            (session) =>
              session.ownerType === owner.identityMode && session.ownerId === owner.ownerId,
          )
          .toArray();
        const checkIns = await this.database.checkIns
          .where('[ownerType+ownerId]')
          .equals([owner.identityMode, owner.ownerId])
          .filter((checkIn) => checkIn.replacedAt === null)
          .toArray();
        const versionById = new Map(versions.map((version) => [version.id, version]));

        return {
          habit: {
            id: habit.id,
            title: habit.title,
            lifecycleState: habit.lifecycleState,
            currentVersionId: habit.currentVersionId,
            updatedAt: habit.updatedAt,
          },
          currentVersion: {
            id: currentVersion.id,
            versionNumber: currentVersion.versionNumber,
            normalTarget: toHabitTarget(currentVersion.normalTarget),
            minimumTarget: toHabitTarget(currentVersion.minimumTarget),
            recurrence: toRecurrence(currentVersion.scheduleRule),
            cue: toHabitCue(currentVersion.cue),
            createdAt: currentVersion.createdAt,
          },
          versions: versions
            .sort((left, right) => right.versionNumber - left.versionNumber)
            .map((version) => ({
              id: version.id,
              versionNumber: version.versionNumber,
              createdAt: version.createdAt,
              source: toVersionSource(version.source),
            })),
          sessions: sessions
            .sort((left, right) =>
              `${right.scheduledLocalDate}T${right.scheduledLocalTime ?? ''}`.localeCompare(
                `${left.scheduledLocalDate}T${left.scheduledLocalTime ?? ''}`,
              ),
            )
            .map((session) => {
              const version = versionById.get(session.habitVersionId) ?? currentVersion;
              const checkIn = checkIns.find((item) => item.sessionId === session.id);
              return {
                id: session.id,
                habitId: session.habitId,
                habitVersionId: session.habitVersionId,
                title: habit.title,
                normalTarget: toHabitTarget(version.normalTarget),
                minimumTarget: toHabitTarget(version.minimumTarget),
                cue: toHabitCue(version.cue),
                scheduledLocalDate: session.scheduledLocalDate,
                scheduledLocalTime: session.scheduledLocalTime,
                timezoneSnapshot: session.timezoneSnapshot,
                status: checkIn?.outcome ?? session.status,
                revision: session.revision,
                synchronizationState: toSessionSyncState(session.synchronizationState),
              };
            }),
        };
      },
    );
  }

  async resolveExpiredUnrecorded(owner: ProductOwner, now: string): Promise<number> {
    return this.database.transaction('rw', this.database.sessions, async () => {
      const nowMs = Date.parse(now);
      const expired = await this.database.sessions
        .where('[ownerType+ownerId]')
        .equals([owner.identityMode, owner.ownerId])
        .filter(
          (session) =>
            session.status === 'unrecorded' && Date.parse(session.resolutionDueAt) < nowMs,
        )
        .toArray();

      for (const session of expired) {
        await this.database.sessions.update(session.id, {
          status: 'automatic_skipped',
          revision: session.revision + 1,
        });
      }
      return expired.length;
    });
  }

  async getToday(owner: ProductOwner, localDate: string): Promise<TodayRepositoryRead> {
    return this.database.transaction(
      'r',
      this.database.habits,
      this.database.habitVersions,
      this.database.sessions,
      this.database.checkIns,
      async () => {
        const habits = await this.database.habits
          .where('[ownerType+ownerId]')
          .equals([owner.identityMode, owner.ownerId])
          .filter((habit) => habit.deletedAt === null)
          .toArray();
        const activeHabits = habits.filter((habit) => isSlotConsumingHabitState(habit.lifecycleState));
        const habitById = new Map(habits.map((habit) => [habit.id, habit]));
        const versions = await this.database.habitVersions
          .where('[ownerType+ownerId]')
          .equals([owner.identityMode, owner.ownerId])
          .toArray();
        const versionById = new Map(versions.map((version) => [version.id, version]));
        const checkIns = await this.database.checkIns
          .where('[ownerType+ownerId]')
          .equals([owner.identityMode, owner.ownerId])
          .filter((checkIn) => checkIn.replacedAt === null)
          .toArray();
        const sessions = await this.database.sessions
          .where('[ownerType+ownerId]')
          .equals([owner.identityMode, owner.ownerId])
          .filter((session) => session.scheduledLocalDate === localDate)
          .toArray();

        return {
          localDate,
          sessions: sessions.flatMap((session) => {
            const habit = habitById.get(session.habitId);
            const version = versionById.get(session.habitVersionId);
            if (!habit || !version) return [];
            const checkIn = checkIns.find((item) => item.sessionId === session.id);
            return [{
              id: session.id,
              habitId: session.habitId,
              habitVersionId: session.habitVersionId,
              title: habit.title,
              normalTarget: toHabitTarget(version.normalTarget),
              minimumTarget: toHabitTarget(version.minimumTarget),
              cue: toHabitCue(version.cue),
              scheduledLocalDate: session.scheduledLocalDate,
              scheduledLocalTime: session.scheduledLocalTime,
              timezoneSnapshot: session.timezoneSnapshot,
              status: checkIn?.outcome ?? session.status,
              revision: session.revision,
              synchronizationState: toSessionSyncState(session.synchronizationState),
            }];
          }),
          activeHabitCount: activeHabits.length,
          activeHabitLimit: activeHabitLimitFor(owner.planTier),
        };
      },
    );
  }

  async recordCheckIn(
    command: RecordCheckInRepositoryCommand,
  ): Promise<RecordCheckInResult> {
    return this.database.transaction(
      'rw',
      this.database.sessions,
      this.database.checkIns,
      this.database.commandResults,
      async () => {
        const requestHash = JSON.stringify(command);
        const replay = await this.database.commandResults.get(command.commandId);
        if (replay) {
          if (replay.requestHash !== requestHash) {
            throw new ProductRepositoryError('idempotency_conflict');
          }
          return replay.result as RecordCheckInResult;
        }

        const session = await this.database.sessions.get(command.sessionId);
        if (
          !session ||
          session.ownerType !== command.owner.identityMode ||
          session.ownerId !== command.owner.ownerId
        ) {
          throw new ProductRepositoryError('session_not_found');
        }
        if (session.revision !== command.expectedSessionRevision) {
          throw new ProductRepositoryError('stale_revision');
        }
        if (!['full', 'minimum', 'manual_skipped', 'excused'].includes(command.outcome)) {
          throw new ProductRepositoryError('invalid_outcome');
        }

        const currentCheckIns = await this.database.checkIns
          .where('[ownerType+ownerId]')
          .equals([command.owner.identityMode, command.owner.ownerId])
          .filter((checkIn) => checkIn.sessionId === command.sessionId && checkIn.replacedAt === null)
          .toArray();
        if (currentCheckIns.length > 0) {
          throw new ProductRepositoryError('check_in_already_recorded');
        }

        const checkInId = crypto.randomUUID();
        await this.database.checkIns.add({
          id: checkInId,
          ownerType: command.owner.identityMode,
          ownerId: command.owner.ownerId,
          sessionId: command.sessionId,
          outcome: command.outcome,
          frictionCode: command.frictionCode,
          frictionNote: command.frictionNote,
          recordedLocalAt: command.clientRecordedAt,
          timezoneSnapshot: command.owner.timezone,
          revision: 1,
          synchronizationState: 'local_only',
          replacedAt: null,
          replacedById: null,
        });

        const sessionRevision = session.revision + 1;
        await this.database.sessions.update(command.sessionId, {
          status: command.outcome,
          revision: sessionRevision,
          synchronizationState: 'local_only',
        });

        const result: RecordCheckInResult = {
          checkInId,
          sessionId: command.sessionId,
          outcome: command.outcome,
          sessionRevision,
          synchronizationState: 'local_only',
        };
        await this.database.commandResults.put({
          id: command.commandId,
          ownerType: command.owner.identityMode,
          ownerId: command.owner.ownerId,
          operationType: 'record_check_in',
          requestHash,
          result,
          createdAt: command.clientRecordedAt,
          expiresAt: new Date(Date.parse(command.clientRecordedAt) + 90 * 24 * 60 * 60 * 1000).toISOString(),
        });
        return result;
      },
    );
  }

  async editCheckIn(command: EditCheckInRepositoryCommand): Promise<RecordCheckInResult> {
    return this.database.transaction(
      'rw',
      this.database.sessions,
      this.database.checkIns,
      this.database.commandResults,
      async () => {
        const requestHash = JSON.stringify(command);
        const replay = await this.database.commandResults.get(command.commandId);
        if (replay) {
          if (replay.requestHash !== requestHash) {
            throw new ProductRepositoryError('idempotency_conflict');
          }
          return replay.result as RecordCheckInResult;
        }

        const session = await this.database.sessions.get(command.sessionId);
        if (
          !session ||
          session.ownerType !== command.owner.identityMode ||
          session.ownerId !== command.owner.ownerId
        ) {
          throw new ProductRepositoryError('session_not_found');
        }

        if (localDateForTime(command.clientRecordedAt, session.timezoneSnapshot) !== session.scheduledLocalDate) {
          throw new ProductRepositoryError('same_day_edit_closed');
        }
        if (session.revision !== command.expectedSessionRevision) {
          throw new ProductRepositoryError('stale_revision');
        }
        if (!['full', 'minimum', 'manual_skipped', 'excused'].includes(command.outcome)) {
          throw new ProductRepositoryError('invalid_outcome');
        }

        const currentCheckIn = await this.database.checkIns.get(command.currentCheckInId);
        if (
          !currentCheckIn ||
          currentCheckIn.ownerType !== command.owner.identityMode ||
          currentCheckIn.ownerId !== command.owner.ownerId ||
          currentCheckIn.sessionId !== command.sessionId ||
          currentCheckIn.replacedAt !== null
        ) {
          throw new ProductRepositoryError('stale_revision');
        }
        if (currentCheckIn.revision !== command.expectedCheckInRevision) {
          throw new ProductRepositoryError('stale_revision');
        }

        const newCheckInId = crypto.randomUUID();
        await this.database.checkIns.update(currentCheckIn.id, {
          replacedAt: command.clientRecordedAt,
          replacedById: newCheckInId,
        });
        await this.database.checkIns.add({
          id: newCheckInId,
          ownerType: command.owner.identityMode,
          ownerId: command.owner.ownerId,
          sessionId: command.sessionId,
          outcome: command.outcome,
          frictionCode: command.frictionCode,
          frictionNote: command.frictionNote,
          recordedLocalAt: command.clientRecordedAt,
          timezoneSnapshot: session.timezoneSnapshot,
          revision: currentCheckIn.revision + 1,
          synchronizationState: 'local_only',
          replacedAt: null,
          replacedById: null,
        });

        const sessionRevision = session.revision + 1;
        await this.database.sessions.update(command.sessionId, {
          status: command.outcome,
          revision: sessionRevision,
          synchronizationState: 'local_only',
        });

        const result: RecordCheckInResult = {
          checkInId: newCheckInId,
          sessionId: command.sessionId,
          outcome: command.outcome,
          sessionRevision,
          synchronizationState: 'local_only',
        };
        await this.database.commandResults.put({
          id: command.commandId,
          ownerType: command.owner.identityMode,
          ownerId: command.owner.ownerId,
          operationType: 'edit_check_in',
          requestHash,
          result,
          createdAt: command.clientRecordedAt,
          expiresAt: new Date(Date.parse(command.clientRecordedAt) + 90 * 24 * 60 * 60 * 1000).toISOString(),
        });
        return result;
      },
    );
  }
}
