import type { Transaction } from 'dexie';

import type { LegacyLocalDataRecord } from '@/lib/indexed-db/types';
import type { LocalHabitRecord } from '@/lib/indexed-db/types';

export async function migrateVersionOneToTwo(transaction: Transaction): Promise<void> {
  await transaction
    .table<LocalHabitRecord>('habits')
    .toCollection()
    .modify((habit) => {
      habit.synchronizationState ??= 'local_only';
    });
}

const ownerScopedStores = [
  'habits',
  'habitVersions',
  'sessions',
  'checkIns',
  'recommendations',
  'recoveryPlans',
  'reviewItems',
  'reminderConfigs',
  'drafts',
  'pendingOperations',
  'syncMetadata',
  'queryCache',
] as const;

export async function migrateVersionTwoToThree(transaction: Transaction): Promise<void> {
  const legacyOwners = new Map<string, string>();

  for (const storeName of ownerScopedStores) {
    await transaction
      .table(storeName)
      .toCollection()
      .modify((record: Record<string, unknown>) => {
        if (record.ownerType !== 'guest' || typeof record.ownerId !== 'string') {
          return;
        }

        legacyOwners.set(record.ownerId, `guest:${record.ownerId}`);
        record.ownerType = 'legacy';
      });
  }

  await transaction
    .table('localProfiles')
    .toCollection()
    .modify((profile: Record<string, unknown>) => {
      if (profile.identityMode !== 'guest') {
        return;
      }

      const ownerId = typeof profile.id === 'string' ? profile.id : 'unknown';
      legacyOwners.set(ownerId, `guest:${ownerId}`);
      profile.identityMode = 'legacy';
      profile.planTier = null;
    });

  const now = new Date().toISOString();
  const markers: LegacyLocalDataRecord[] = [...legacyOwners.entries()].map(
    ([sourceOwnerId, id]) => ({
      id,
      sourceOwnerType: 'guest',
      sourceOwnerId,
      status: 'pending_recovery',
      manifestVersion: 1,
      createdAt: now,
      updatedAt: now,
      clearedAt: null,
    }),
  );

  if (markers.length > 0) {
    await transaction.table('legacyLocalData').bulkPut(markers);
  }
}
