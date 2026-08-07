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

export async function migrateVersionTwoToThree(transaction: Transaction): Promise<void> {
  await transaction
    .table('checkIns')
    .toCollection()
    .modify((checkIn) => {
      checkIn.replacedAt ??= null;
      checkIn.replacedById ??= null;
    });
}
