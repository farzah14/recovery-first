'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { getHabitDetail } from '@/features/habits/application/get-habit-detail';
import { HabitDetail } from '@/features/habits/components/habit-detail';
import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import { DexieProductRepository } from '@/lib/repositories/guest/dexie-product-repository';
import type { HabitDetailRead, ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

const owner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

export function HabitDetailClient({
  habitId,
  initialTab = 'Overview',
}: {
  habitId: string;
  initialTab?: 'Overview' | 'History' | 'Insights' | 'Versions';
}): React.JSX.Element {
  const [repository, setRepository] = useState<ProductRepository | null>(null);
  const [detail, setDetail] = useState<HabitDetailRead | null>(null);
  const [loaded, setLoaded] = useState(false);

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
      void getHabitDetail({ repository, owner, habitId }).then((result) => {
        if (cancelled) return;
        setDetail(result);
        setLoaded(true);
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [habitId, repository]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {!repository || !loaded ? <p aria-busy="true">Loading habit…</p> : detail ? <HabitDetail detail={detail} initialTab={initialTab} /> : <Card><CardContent className="grid gap-3 p-6"><h1 className="text-xl font-semibold">Habit not found</h1><p className="text-sm text-[var(--color-text-secondary)]">This habit is not available for the current Guest browser.</p><Link href="/app/habits" className="text-sm font-semibold text-[var(--color-primary)]">Back to Habits</Link></CardContent></Card>}
      </div>
    </AppShell>
  );
}
