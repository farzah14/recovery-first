import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import { DexieProductRepository } from '@/lib/repositories/guest/dexie-product-repository';
import type { CreateHabitCommand } from '@/lib/repositories/product-repository';

const owner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest' as const,
  planTier: 'guest' as const,
  timezone: 'Asia/Jakarta',
};

function command(index: number): CreateHabitCommand {
  return {
    commandId: `00000000-0000-4000-8000-0000000004${index}1`,
    habitId: `00000000-0000-4000-8000-0000000004${index}2`,
    habitVersionId: `00000000-0000-4000-8000-0000000004${index}3`,
    owner,
    title: `Habit ${index}`,
    category: 'movement',
    normalTarget: {
      action: 'Walk 20 minutes',
      quantity: 20,
      unit: 'minutes',
      estimatedMinutes: 20,
    },
    minimumTarget: {
      action: 'Walk 5 minutes',
      quantity: 5,
      unit: 'minutes',
      estimatedMinutes: 5,
    },
    recurrence: { kind: 'daily' },
    cue: { type: 'after_activity', value: 'After lunch' },
    reminderIntent: { enabled: false, localTime: null },
    startLocalDate: '2026-07-29',
    activate: true,
    clientCreatedAt: '2026-07-29T03:00:00.000Z',
  };
}

describe('DexieProductRepository', () => {
  let database: RecoveryFirstDatabase;
  let repository: DexieProductRepository;

  beforeEach(() => {
    database = new RecoveryFirstDatabase(`plan04-${crypto.randomUUID()}`);
    repository = new DexieProductRepository(database);
  });

  afterEach(async () => {
    await database.delete();
  });

  it('creates a habit, immutable version, and deterministic sessions atomically', async () => {
    const result = await repository.createHabit(command(1));
    expect(result.lifecycleState).toBe('starting');
    expect(await database.habits.count()).toBe(1);
    expect(await database.habitVersions.count()).toBe(1);
    expect(await database.sessions.count()).toBeGreaterThan(0);
  });

  it('rejects the fourth active Guest habit without partial records', async () => {
    await repository.createHabit(command(1));
    await repository.createHabit(command(2));
    await repository.createHabit(command(3));
    await expect(repository.createHabit(command(4))).rejects.toMatchObject({
      code: 'active_limit_reached',
    });
    expect(await database.habits.count()).toBe(3);
    expect(await database.habitVersions.count()).toBe(3);
  });

  it('replays the same create command without duplication', async () => {
    const input = command(1);
    const first = await repository.createHabit(input);
    const replay = await repository.createHabit(input);
    expect(replay).toEqual(first);
    expect(await database.habits.count()).toBe(1);
  });
});
