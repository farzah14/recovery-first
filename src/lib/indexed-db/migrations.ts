import type { Transaction } from 'dexie';

import type { LocalHabitRecord } from '@/lib/indexed-db/types';

export async function migrateVersionOneToTwo(transaction: Transaction): Promise<void> {
  await transaction
    .table<LocalHabitRecord>('habits')
    .toCollection()
    .modify((habit) => {
      habit.synchronizationState ??= 'local_only';
    });
}
