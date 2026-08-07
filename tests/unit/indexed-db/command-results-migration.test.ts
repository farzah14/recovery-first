import 'fake-indexeddb/auto';

import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';

import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import { currentIndexedDbVersion, recoveryFirstStoresV2 } from '@/lib/indexed-db/schema';

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

describe('IndexedDB command result migration', () => {
  it('preserves populated version 2 records while adding version 3 command results', async () => {
    const name = `migration-v3-${crypto.randomUUID()}`;
    databaseNames.push(name);

    const versionTwo = new Dexie(name);
    versionTwo.version(2).stores(recoveryFirstStoresV2);
    await versionTwo.open();

    await versionTwo.table('localProfiles').put({
      id: 'profile-1',
      identityMode: 'guest',
      planTier: 'guest',
      locale: 'en-US',
      timezone: 'Asia/Jakarta',
      weekStart: 1,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    });
    await versionTwo.table('habits').put({
      id: 'habit-1',
      ownerType: 'guest',
      ownerId: 'guest-1',
      title: 'Preserved Habit',
      lifecycleState: 'active',
      currentVersionId: 'version-1',
      revision: 1,
      synchronizationState: 'local_only',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      deletedAt: null,
    });
    await versionTwo.table('habitVersions').put({
      id: 'version-1',
      habitId: 'habit-1',
      ownerType: 'guest',
      ownerId: 'guest-1',
      versionNumber: 1,
      normalTarget: { action: 'Walk' },
      minimumTarget: { action: 'Walk outside' },
      scheduleRule: { kind: 'daily' },
      cue: { type: 'none', value: null },
      recoveryStructure: {},
      source: 'creation',
      parentVersionId: null,
      createdAt: '2026-08-01T00:00:00.000Z',
    });
    await versionTwo.table('sessions').put({
      id: 'session-1',
      ownerType: 'guest',
      ownerId: 'guest-1',
      habitId: 'habit-1',
      habitVersionId: 'version-1',
      scheduledLocalDate: '2026-08-01',
      scheduledLocalTime: null,
      timezoneSnapshot: 'Asia/Jakarta',
      eligibleAt: '2026-08-01T00:00:00.000Z',
      resolutionDueAt: '2026-08-04T00:00:00.000Z',
      status: 'full',
      revision: 1,
      synchronizationState: 'local_only',
    });
    await versionTwo.table('checkIns').put({
      id: 'check-in-1',
      ownerType: 'guest',
      ownerId: 'guest-1',
      sessionId: 'session-1',
      outcome: 'full',
      frictionCode: null,
      frictionNote: null,
      recordedLocalAt: '2026-08-01T08:00:00.000+07:00',
      timezoneSnapshot: 'Asia/Jakarta',
      revision: 1,
      synchronizationState: 'local_only',
    });
    await versionTwo.table('drafts').put({
      id: 'draft-1',
      ownerType: 'guest',
      ownerId: 'guest-1',
      draftType: 'habit_wizard',
      payload: { title: 'Draft Habit' },
      updatedAt: '2026-08-01T00:00:00.000Z',
    });
    versionTwo.close();

    const current = new RecoveryFirstDatabase(name);
    await current.open();

    expect(currentIndexedDbVersion).toBe(3);
    await expect(current.localProfiles.get('profile-1')).resolves.toMatchObject({
      id: 'profile-1',
    });
    await expect(current.habits.get('habit-1')).resolves.toMatchObject({
      title: 'Preserved Habit',
    });
    await expect(current.habitVersions.get('version-1')).resolves.toMatchObject({
      habitId: 'habit-1',
    });
    await expect(current.sessions.get('session-1')).resolves.toMatchObject({
      status: 'full',
    });
    await expect(current.checkIns.get('check-in-1')).resolves.toMatchObject({
      outcome: 'full',
      replacedAt: null,
      replacedById: null,
    });
    await expect(current.drafts.get('draft-1')).resolves.toMatchObject({
      payload: { title: 'Draft Habit' },
    });
    await expect(current.commandResults.count()).resolves.toBe(0);

    current.close();
  });
});
