import 'fake-indexeddb/auto';

import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';

import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import { recoveryFirstStoresV1 } from '@/lib/indexed-db/schema';

const databaseNames: string[] = [];

afterEach(async () => {
  await Promise.all(
    databaseNames.splice(0).map(
      (name) =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(name);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
          request.onblocked = () => resolve();
        }),
    ),
  );
});

describe('IndexedDB migrations', () => {
  it('upgrades version 1 legacy local data without deleting canonical records', async () => {
    const name = `migration-test-${crypto.randomUUID()}`;
    databaseNames.push(name);

    const versionOne = new Dexie(name);
    versionOne.version(1).stores(recoveryFirstStoresV1);
    await versionOne.open();
    await versionOne.table('habits').put({
      id: 'habit-1',
      ownerType: 'guest',
      ownerId: 'guest-1',
      title: 'Preserved Habit',
      lifecycleState: 'draft',
      currentVersionId: null,
      revision: 1,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      deletedAt: null,
    });
    versionOne.close();

    const current = new RecoveryFirstDatabase(name);
    await current.open();

    await expect(current.habits.get('habit-1')).resolves.toMatchObject({
      title: 'Preserved Habit',
      ownerType: 'legacy',
      synchronizationState: 'local_only',
    });
    await expect(current.legacyLocalData.get('guest:guest-1')).resolves.toMatchObject({
      sourceOwnerType: 'guest',
      sourceOwnerId: 'guest-1',
      status: 'pending_recovery',
    });
    expect(await current.syncMetadata.count()).toBe(0);
    expect(await current.queryCache.count()).toBe(0);
    current.close();
  });
});
