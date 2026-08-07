import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import { LegacyLocalDataService } from '@/features/legacy-local-data/legacy-local-data';
import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import type { LegacyLocalDataRecord, LocalHabitRecord } from '@/lib/indexed-db/types';

const databases: RecoveryFirstDatabase[] = [];

function createDatabase(): RecoveryFirstDatabase {
  const database = new RecoveryFirstDatabase(`legacy-data-test-${crypto.randomUUID()}`);
  databases.push(database);
  return database;
}

function marker(): LegacyLocalDataRecord {
  return {
    id: 'guest:guest-1',
    sourceOwnerType: 'guest',
    sourceOwnerId: 'guest-1',
    status: 'pending_recovery',
    manifestVersion: 1,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    clearedAt: null,
  };
}

function legacyHabit(): LocalHabitRecord {
  return {
    id: 'legacy-habit-1',
    ownerType: 'legacy',
    ownerId: 'guest-1',
    title: 'Legacy habit',
    lifecycleState: 'draft',
    currentVersionId: null,
    revision: 1,
    synchronizationState: 'local_only',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    deletedAt: null,
  };
}

afterEach(async () => {
  await Promise.all(
    databases.splice(0).map(async (database) => {
      database.close();
      await database.delete();
    }),
  );
});

describe('legacy local data service', () => {
  it('requires an explicit export or transfer acknowledgement before clearing', async () => {
    const database = createDatabase();
    await database.legacyLocalData.put(marker());
    await database.habits.put(legacyHabit());
    const service = new LegacyLocalDataService(database);

    await expect(service.clearAfterAcknowledgement('guest:guest-1')).rejects.toThrow(
      'legacy_data_acknowledgement_required',
    );

    await expect(service.markTransferred('guest:guest-1')).resolves.toMatchObject({
      status: 'transferred',
    });
    await expect(service.markTransferred('guest:guest-1')).resolves.toMatchObject({
      status: 'transferred',
    });
    await service.clearAfterAcknowledgement('guest:guest-1');

    await expect(database.habits.get('legacy-habit-1')).resolves.toBeUndefined();
    await expect(database.legacyLocalData.get('guest:guest-1')).resolves.toMatchObject({
      status: 'cleared',
    });
  });

  it('clears legacy records after an export acknowledgement', async () => {
    const database = createDatabase();
    await database.legacyLocalData.put(marker());
    await database.habits.put(legacyHabit());
    const service = new LegacyLocalDataService(database);

    await expect(service.markExported('guest:guest-1')).resolves.toMatchObject({
      status: 'exported',
    });
    await service.clearAfterAcknowledgement('guest:guest-1');

    await expect(database.habits.get('legacy-habit-1')).resolves.toBeUndefined();
  });
});
