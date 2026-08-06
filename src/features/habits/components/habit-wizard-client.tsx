'use client';

import { useAccountState } from '@/components/account/account-state';
import { useEffect, useMemo, useState } from 'react';

import { HabitWizard } from '@/features/habits/components/habit-wizard';
import { createClientProductRepository } from '@/lib/repositories/client-product-repository';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

const guestOwner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

export function HabitWizardClient({ owner }: { owner?: ProductOwner } = {}): React.JSX.Element {
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

  useEffect(() => {
    const handle = createClientProductRepository(effectiveOwner);
    const timer = window.setTimeout(() => setRepository(handle.repository), 0);
    return () => {
      window.clearTimeout(timer);
      handle.dispose();
    };
  }, [effectiveOwner]);

  if (!repository) {
    return (
      <div
        className="mx-auto max-w-3xl rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6"
        aria-busy="true"
      >
        Loading habit creation…
      </div>
    );
  }

  return <HabitWizard repository={repository} owner={effectiveOwner} />;
}
