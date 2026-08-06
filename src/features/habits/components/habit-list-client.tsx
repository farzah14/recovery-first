'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAccountState } from '@/components/account/account-state';
import { AppShell } from '@/components/layout/app-shell';
import { HabitList } from '@/features/habits/components/habit-list';
import { listHabits } from '@/features/habits/application/list-habits';
import { activeHabitLimitFor } from '@/domain/habits/active-slot-policy';
import { isSlotConsumingHabitState } from '@/domain/habits/habit-lifecycle';
import { createClientProductRepository } from '@/lib/repositories/client-product-repository';
import type {
  HabitListItem,
  ProductOwner,
  ProductRepository,
} from '@/lib/repositories/product-repository';

const guestOwner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

export function HabitListClient({ owner }: { owner?: ProductOwner } = {}): React.JSX.Element {
  const account = useAccountState();
  const effectiveOwner = useMemo(
    () =>
      owner ??
      (account.id
        ? {
            ownerId: account.id,
            identityMode: 'account' as const,
            planTier: account.planTier,
            timezone: account.timezone ?? 'UTC',
          }
        : guestOwner),
    [account.id, account.planTier, account.timezone, owner],
  );
  const [repository, setRepository] = useState<ProductRepository | null>(null);
  const [habits, setHabits] = useState<HabitListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = createClientProductRepository(effectiveOwner);
    const timer = window.setTimeout(() => setRepository(handle.repository), 0);
    return () => {
      window.clearTimeout(timer);
      handle.dispose();
    };
  }, [effectiveOwner]);

  useEffect(() => {
    if (!repository) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void listHabits({ repository, owner: effectiveOwner })
        .then((result) => {
          if (!cancelled) setHabits(result);
        })
        .catch((reason: unknown) => {
          if (!cancelled)
            setError(reason instanceof Error ? reason.message : 'Habits could not be loaded.');
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [effectiveOwner, repository]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <p role="alert" className="rounded-lg border border-[var(--color-danger)] p-4 text-sm">
            {error}
          </p>
        ) : null}
        {!repository || habits === null ? (
          <p aria-busy="true">Loading habits…</p>
        ) : (
          <HabitList
            habits={habits}
            activeHabitCount={
              habits.filter((habit) => isSlotConsumingHabitState(habit.lifecycleState)).length
            }
            activeHabitLimit={activeHabitLimitFor(effectiveOwner.planTier)}
          />
        )}
      </div>
    </AppShell>
  );
}
