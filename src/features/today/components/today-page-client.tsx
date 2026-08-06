'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAccountState } from '@/components/account/account-state';
import { Alert } from '@/components/ui/alert';
import { editCheckIn } from '@/features/check-ins/application/edit-check-in';
import { recordCheckIn } from '@/features/check-ins/application/record-check-in';
import { CheckInConfirmation } from '@/features/check-ins/components/check-in-confirmation';
import { DailyProgressCard } from '@/features/today/components/daily-progress-card';
import { FirstCheckInGuide } from '@/features/today/components/first-check-in-guide';
import { TodayEmptyState } from '@/features/today/components/today-empty-state';
import { TodaySessionCard } from '@/features/today/components/today-session-card';
import { getTodayReadModel } from '@/features/today/application/get-today-read-model';
import type { TodayReadModel } from '@/features/today/today-types';
import { createClientProductRepository } from '@/lib/repositories/client-product-repository';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';
import type { FrictionReason, UserRecordableCheckInOutcome } from '@/domain/check-ins/check-in';

const guestOwner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

function localDateForTime(isoTime: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(isoTime));
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get('year')}-${values.get('month')}-${values.get('day')}`;
}

export function TodayPageClient({
  initialReadModel,
  nextSession,
  repository: providedRepository,
  owner,
}: {
  initialReadModel?: TodayReadModel;
  nextSession?: { title: string; localDate: string };
  repository?: ProductRepository;
  owner?: ProductOwner;
}): React.JSX.Element {
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
  const [repository, setRepository] = useState<ProductRepository | null>(
    providedRepository ?? null,
  );
  const [readModel, setReadModel] = useState<TodayReadModel | null>(initialReadModel ?? null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    if (providedRepository) return;
    const handle = createClientProductRepository(effectiveOwner);
    const timer = window.setTimeout(() => setRepository(handle.repository), 0);
    return () => {
      window.clearTimeout(timer);
      handle.dispose();
    };
  }, [effectiveOwner, providedRepository]);

  useEffect(() => {
    if (!repository || initialReadModel) return;
    let cancelled = false;
    const localDate = localDateForTime(new Date().toISOString(), effectiveOwner.timezone);
    const load = async () => {
      try {
        await repository.ensureSessionHorizon(effectiveOwner, localDate);
        await repository.resolveExpiredUnrecorded(effectiveOwner, new Date().toISOString());
        const next = await getTodayReadModel({ repository, owner: effectiveOwner, localDate });
        if (!cancelled) setReadModel(next);
      } catch (reason) {
        if (!cancelled)
          setError(reason instanceof Error ? reason.message : 'Today could not be loaded.');
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
  }, [effectiveOwner, initialReadModel, repository]);

  const refreshToday = async () => {
    if (!repository) return;
    const localDate = localDateForTime(new Date().toISOString(), effectiveOwner.timezone);
    await repository.ensureSessionHorizon(effectiveOwner, localDate);
    await repository.resolveExpiredUnrecorded(effectiveOwner, new Date().toISOString());
    setReadModel(await getTodayReadModel({ repository, owner: effectiveOwner, localDate }));
  };

  const handleAction = async (
    action: 'full' | 'minimum' | 'manual_skipped',
    session: TodayReadModel['sessions'][number],
    friction?: { frictionCode: FrictionReason | null; frictionNote: string | null },
  ) => {
    if (!repository) return;
    try {
      setError(null);
      const result = await recordCheckIn({
        repository,
        owner: effectiveOwner,
        commandId: crypto.randomUUID(),
        sessionId: session.id,
        outcome: action === 'manual_skipped' ? 'manual_skipped' : action,
        friction: {
          frictionCode: friction?.frictionCode ?? null,
          frictionNote: friction?.frictionNote ?? null,
        },
        expectedSessionRevision: session.revision,
        now: new Date().toISOString(),
      });
      setConfirmation(result.confirmation);
      await refreshToday();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Check-in could not be saved.');
    }
  };

  const handleEdit = async (
    session: TodayReadModel['sessions'][number],
    change: {
      outcome: UserRecordableCheckInOutcome;
      friction: { frictionCode: FrictionReason | null; frictionNote: string | null };
    },
  ) => {
    if (!repository || !session.currentCheckInId || session.currentCheckInRevision === undefined) {
      setError('This check-in is not ready to edit.');
      return;
    }
    try {
      setError(null);
      await editCheckIn({
        repository,
        owner: effectiveOwner,
        commandId: crypto.randomUUID(),
        currentCheckInId: session.currentCheckInId,
        sessionId: session.id,
        outcome: change.outcome,
        friction: change.friction,
        expectedSessionRevision: session.revision,
        expectedCheckInRevision: session.currentCheckInRevision,
        now: new Date().toISOString(),
      });
      setConfirmation('Today updated — prior history remains preserved.');
      await refreshToday();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Check-in could not be edited.');
    }
  };

  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!readModel) return <p aria-busy="true">Loading Today…</p>;

  return (
    <section className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-semibold text-[var(--color-primary)]">Today</p>
        <h1 className="mt-1 text-3xl font-bold">A steady next step</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {effectiveOwner.identityMode === 'account'
            ? 'Account mode · synced with Supabase'
            : 'Guest mode · stored in this browser'}
        </p>
      </header>
      <DailyProgressCard
        successfulCount={readModel.successfulCount}
        minimumCount={readModel.minimumCount}
        remainingCount={readModel.remainingCount}
        totalCount={readModel.sessions.length}
      />
      {confirmation ? <CheckInConfirmation message={confirmation} /> : null}
      {readModel.sessions.some((session) => session.status === 'unrecorded') ? (
        <FirstCheckInGuide />
      ) : null}
      {nextSession ? (
        <TodayEmptyState state={readModel.emptyState} nextSession={nextSession} />
      ) : (
        <TodayEmptyState state={readModel.emptyState} />
      )}
      <div className="grid gap-4">
        {readModel.sessions.map((session) => (
          <TodaySessionCard
            key={session.id}
            session={session}
            onAction={handleAction}
            onEdit={handleEdit}
            isSameDay={session.scheduledLocalDate === readModel.localDate}
          />
        ))}
      </div>
    </section>
  );
}
