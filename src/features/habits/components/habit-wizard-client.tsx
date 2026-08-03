'use client';

import { useEffect, useState } from 'react';

import { HabitWizard } from '@/features/habits/components/habit-wizard';
import { DexieProductRepository } from '@/lib/repositories/guest/dexie-product-repository';
import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

const guestOwner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

export function HabitWizardClient(): React.JSX.Element {
  const [repository, setRepository] = useState<ProductRepository | null>(null);

  useEffect(() => {
    const database = new RecoveryFirstDatabase();
    const nextRepository = new DexieProductRepository(database);
    const timer = window.setTimeout(() => setRepository(nextRepository), 0);
    return () => {
      window.clearTimeout(timer);
      void database.close();
    };
  }, []);

  if (!repository) {
    return <div className="mx-auto max-w-3xl rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6" aria-busy="true">Loading habit creation…</div>;
  }

  return <HabitWizard repository={repository} owner={guestOwner} />;
}
