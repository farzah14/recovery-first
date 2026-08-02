import Dexie, { type Table } from 'dexie';

import { activeHabitLimitFor } from '@/domain/habits/active-slot-policy';
import { isSlotConsumingHabitState } from '@/domain/habits/habit-lifecycle';
import { migrateVersionOneToTwo } from '@/lib/indexed-db/migrations';
import { recoveryFirstStoresV1, recoveryFirstStoresV2 } from '@/lib/indexed-db/schema';
import type {
  BrowserInstallationRecord,
  DraftRecord,
  LocalCheckInRecord,
  LocalHabitRecord,
  LocalHabitVersionRecord,
  LocalProfileRecord,
  LocalRecommendationRecord,
  LocalRecoveryPlanRecord,
  LocalReminderConfigRecord,
  LocalReviewItemRecord,
  LocalSessionRecord,
  PendingOperationRecord,
  QueryCacheRecord,
  SettingRecord,
  SyncMetadataRecord,
} from '@/lib/indexed-db/types';

export class GuestActiveLimitError extends Error {
  constructor() {
    super('guest_active_limit_reached');
    this.name = 'GuestActiveLimitError';
  }
}

export class RecoveryFirstDatabase extends Dexie {
  localProfiles!: Table<LocalProfileRecord, string>;
  browserInstallations!: Table<BrowserInstallationRecord, string>;
  habits!: Table<LocalHabitRecord, string>;
  habitVersions!: Table<LocalHabitVersionRecord, string>;
  sessions!: Table<LocalSessionRecord, string>;
  checkIns!: Table<LocalCheckInRecord, string>;
  recommendations!: Table<LocalRecommendationRecord, string>;
  recoveryPlans!: Table<LocalRecoveryPlanRecord, string>;
  reviewItems!: Table<LocalReviewItemRecord, string>;
  reminderConfigs!: Table<LocalReminderConfigRecord, string>;
  drafts!: Table<DraftRecord, string>;
  pendingOperations!: Table<PendingOperationRecord, string>;
  syncMetadata!: Table<SyncMetadataRecord, string>;
  queryCache!: Table<QueryCacheRecord, string>;
  settings!: Table<SettingRecord, string>;

  constructor(name = 'recovery_first_web') {
    super(name);

    this.version(1).stores(recoveryFirstStoresV1);
    this.version(2).stores(recoveryFirstStoresV2).upgrade(migrateVersionOneToTwo);
  }

  async activateGuestHabit(ownerId: string, habitId: string): Promise<number> {
    return this.transaction('rw', this.habits, async () => {
      const habit = await this.habits.get(habitId);
      if (!habit || habit.ownerType !== 'guest' || habit.ownerId !== ownerId) {
        throw new Error('guest_habit_not_found');
      }

      if (isSlotConsumingHabitState(habit.lifecycleState)) {
        return this.countGuestActiveHabits(ownerId);
      }

      const activeCount = await this.countGuestActiveHabits(ownerId);
      if (activeCount >= activeHabitLimitFor('guest')) {
        throw new GuestActiveLimitError();
      }

      await this.habits.update(habitId, {
        lifecycleState: 'starting',
        revision: habit.revision + 1,
        updatedAt: new Date().toISOString(),
      });

      return activeCount + 1;
    });
  }

  private async countGuestActiveHabits(ownerId: string): Promise<number> {
    const habits = await this.habits
      .where('[ownerType+ownerId]')
      .equals(['guest', ownerId])
      .toArray();

    return habits.filter(
      (habit) => habit.deletedAt === null && isSlotConsumingHabitState(habit.lifecycleState),
    ).length;
  }
}
