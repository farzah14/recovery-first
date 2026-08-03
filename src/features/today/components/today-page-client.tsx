'use client';

import { useEffect, useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { DailyProgressCard } from '@/features/today/components/daily-progress-card';
import { FirstCheckInGuide } from '@/features/today/components/first-check-in-guide';
import { TodayEmptyState } from '@/features/today/components/today-empty-state';
import { TodaySessionCard } from '@/features/today/components/today-session-card';
import { getTodayReadModel } from '@/features/today/application/get-today-read-model';
import type { TodayReadModel } from '@/features/today/today-types';
import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import { DexieProductRepository } from '@/lib/repositories/guest/dexie-product-repository';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

const guestOwner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

export function TodayPageClient({
  initialReadModel,
  nextSession,
  repository: providedRepository,
  owner = guestOwner,
}: {
  initialReadModel?: TodayReadModel;
  nextSession?: { title: string; localDate: string };
  repository?: ProductRepository;
  owner?: ProductOwner;
}): React.JSX.Element {
  const [repository, setRepository] = useState<ProductRepository | null>(providedRepository ?? null);
  const [readModel, setReadModel] = useState<TodayReadModel | null>(initialReadModel ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (providedRepository) return;
    const database = new RecoveryFirstDatabase();
    const nextRepository = new DexieProductRepository(database);
    const timer = window.setTimeout(() => setRepository(nextRepository), 0);
    return () => {
      window.clearTimeout(timer);
      void database.close();
    };
  }, [providedRepository]);

  useEffect(() => {
    if (!repository || initialReadModel) return;
    let cancelled = false;
    const localDate = new Date().toISOString().slice(0, 10);
    const load = async () => {
      try {
        await repository.ensureSessionHorizon(owner, localDate);
        try {
          await repository.resolveExpiredUnrecorded(owner, new Date().toISOString());
        } catch {
          // Expiry reconciliation is unavailable until its write boundary is implemented.
        }
        const next = await getTodayReadModel({ repository, owner, localDate });
        if (!cancelled) setReadModel(next);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Today could not be loaded.');
      }
    };
    const timer = window.setTimeout(() => void load(), 0);
    const refresh = () => void load();
    window.addEventListener('recovery-first:local-change', refresh);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener('recovery-first:local-change', refresh);
    };
  }, [initialReadModel, owner, repository]);

  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!readModel) return <p aria-busy="true">Loading Today…</p>;

  return (
    <section className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-semibold text-[var(--color-primary)]">Today</p>
        <h1 className="mt-1 text-3xl font-bold">A steady next step</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Guest mode · stored in this browser</p>
      </header>
      <DailyProgressCard successfulCount={readModel.successfulCount} minimumCount={readModel.minimumCount} remainingCount={readModel.remainingCount} totalCount={readModel.sessions.length} />
      {readModel.sessions.some((session) => session.status === 'unrecorded') ? <FirstCheckInGuide /> : null}
      {nextSession ? <TodayEmptyState state={readModel.emptyState} nextSession={nextSession} /> : <TodayEmptyState state={readModel.emptyState} />}
      <div className="grid gap-4">
        {readModel.sessions.map((session) => (
          <TodaySessionCard key={session.id} session={session} onAction={() => undefined} isSameDay={session.scheduledLocalDate === readModel.localDate} />
        ))}
      </div>
    </section>
  );
}
