import type { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import type { LocalCommandResultRecord } from '@/lib/indexed-db/types';
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
  TodayRepositoryRead,
} from '@/lib/repositories/product-repository';
import { generateSessionsForCommand } from '@/features/sessions/application/ensure-session-horizon';

function toHabitTarget(value: Record<string, unknown>): CreateHabitCommand['normalTarget'] {
  return {
    action: typeof value.action === 'string' ? value.action : '',
    quantity: typeof value.quantity === 'number' ? value.quantity : null,
    unit: typeof value.unit === 'string' ? value.unit : null,
    estimatedMinutes:
      typeof value.estimatedMinutes === 'number' ? value.estimatedMinutes : null,
  };
}

function toHabitCue(value: Record<string, unknown> | null): CreateHabitCommand['cue'] {
  const type = value?.type;
  if (type !== 'time' && type !== 'after_activity' && type !== 'location' && type !== 'none') {
    return { type: 'none', value: null };
  }
  return {
    type,
    value: typeof value?.value === 'string' ? value.value : null,
  };
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
    void owner;
    throw new ProductRepositoryError('repository_unavailable');
  }

  async getHabitDetail(owner: ProductOwner, habitId: string): Promise<HabitDetailRead | null> {
    void owner;
    void habitId;
    throw new ProductRepositoryError('repository_unavailable');
  }

  async resolveExpiredUnrecorded(owner: ProductOwner, now: string): Promise<number> {
    void owner;
    void now;
    throw new ProductRepositoryError('repository_unavailable');
  }

  async getToday(owner: ProductOwner, localDate: string): Promise<TodayRepositoryRead> {
    void owner;
    void localDate;
    throw new ProductRepositoryError('repository_unavailable');
  }

  async recordCheckIn(
    command: RecordCheckInRepositoryCommand,
  ): Promise<RecordCheckInResult> {
    void command;
    throw new ProductRepositoryError('repository_unavailable');
  }

  async editCheckIn(command: EditCheckInRepositoryCommand): Promise<RecordCheckInResult> {
    void command;
    throw new ProductRepositoryError('repository_unavailable');
  }
}
