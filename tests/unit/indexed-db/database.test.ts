import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import { GuestActiveLimitError, RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import type { LocalHabitRecord } from '@/lib/indexed-db/types';

const openedDatabases: RecoveryFirstDatabase[] = [];

function createDatabase(): RecoveryFirstDatabase {
  const database = new RecoveryFirstDatabase(`database-test-${crypto.randomUUID()}`);
  openedDatabases.push(database);
  return database;
}

function habit(id: string, lifecycleState: LocalHabitRecord['lifecycleState']): LocalHabitRecord {
  return {
    id,
    ownerType: 'guest',
    ownerId: 'guest-1',
    title: `Habit ${id}`,
    lifecycleState,
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
    openedDatabases.splice(0).map(async (database) => {
      database.close();
      await database.delete();
    }),
  );
});

describe('RecoveryFirstDatabase', () => {
  it('persists Guest canonical records after reopen', async () => {
    const database = createDatabase();
    await database.habits.put(habit('habit-1', 'draft'));
    database.close();
    await database.open();

    await expect(database.habits.get('habit-1')).resolves.toMatchObject({
      ownerType: 'guest',
      synchronizationState: 'local_only',
    });
  });

  it('activates a Guest habit transactionally while capacity remains', async () => {
    const database = createDatabase();
    await database.habits.bulkPut([
      habit('habit-1', 'starting'),
      habit('habit-2', 'active'),
      habit('habit-3', 'draft'),
    ]);

    await expect(database.activateGuestHabit('guest-1', 'habit-3')).resolves.toBe(3);
    await expect(database.habits.get('habit-3')).resolves.toMatchObject({
      lifecycleState: 'starting',
      revision: 2,
    });
  });

  it('rejects a fourth active Guest habit without partial writes', async () => {
    const database = createDatabase();
    await database.habits.bulkPut([
      habit('habit-1', 'starting'),
      habit('habit-2', 'active'),
      habit('habit-3', 'recovery'),
      habit('habit-4', 'draft'),
    ]);

    await expect(database.activateGuestHabit('guest-1', 'habit-4')).rejects.toBeInstanceOf(
      GuestActiveLimitError,
    );
    await expect(database.habits.get('habit-4')).resolves.toMatchObject({
      lifecycleState: 'draft',
      revision: 1,
    });
  });
});
