'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { HabitList } from '@/features/habits/components/habit-list';
import { listHabits } from '@/features/habits/application/list-habits';
import { isSlotConsumingHabitState } from '@/domain/habits/habit-lifecycle';
import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import { DexieProductRepository } from '@/lib/repositories/guest/dexie-product-repository';
import type { HabitListItem, ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

const owner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

export function HabitListClient(): React.JSX.Element {
  const [repository, setRepository] = useState<ProductRepository | null>(null);
  const [habits, setHabits] = useState<HabitListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const database = new RecoveryFirstDatabase();
    const nextRepository = new DexieProductRepository(database);
    const timer = window.setTimeout(() => setRepository(nextRepository), 0);
    return () => {
      window.clearTimeout(timer);
      void database.close();
    };
  }, []);

  useEffect(() => {
    if (!repository) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void listHabits({ repository, owner })
        .then((result) => {
          if (!cancelled) setHabits(result);
        })
        .catch((reason: unknown) => {
          if (!cancelled) setError(reason instanceof Error ? reason.message : 'Habits could not be loaded.');
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [repository]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {error ? <p role="alert" className="rounded-lg border border-[var(--color-danger)] p-4 text-sm">{error}</p> : null}
        {!repository || habits === null ? <p aria-busy="true">Loading habits…</p> : <HabitList habits={habits} activeHabitCount={habits.filter((habit) => isSlotConsumingHabitState(habit.lifecycleState)).length} activeHabitLimit={3} />}
      </div>
    </AppShell>
  );
}
