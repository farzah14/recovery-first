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

  async listHabits(_owner: ProductOwner): Promise<HabitListItem[]> {
    throw new ProductRepositoryError('repository_unavailable');
  }

  async getHabitDetail(_owner: ProductOwner, _habitId: string): Promise<HabitDetailRead | null> {
    throw new ProductRepositoryError('repository_unavailable');
  }

  async ensureSessionHorizon(_owner: ProductOwner, _throughLocalDate: string): Promise<number> {
    throw new ProductRepositoryError('repository_unavailable');
  }

  async resolveExpiredUnrecorded(_owner: ProductOwner, _now: string): Promise<number> {
    throw new ProductRepositoryError('repository_unavailable');
  }

  async getToday(_owner: ProductOwner, _localDate: string): Promise<TodayRepositoryRead> {
    throw new ProductRepositoryError('repository_unavailable');
  }

  async recordCheckIn(
    _command: RecordCheckInRepositoryCommand,
  ): Promise<RecordCheckInResult> {
    throw new ProductRepositoryError('repository_unavailable');
  }

  async editCheckIn(_command: EditCheckInRepositoryCommand): Promise<RecordCheckInResult> {
    throw new ProductRepositoryError('repository_unavailable');
  }
}
