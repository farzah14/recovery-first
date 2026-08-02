import type { ReactNode } from 'react';

import { AccountStateProvider } from '@/components/account/account-state';
import { requireAccount } from '@/lib/auth/require-account';

export default async function ApplicationLayout({ children }: { children: ReactNode }) {
  const account = await requireAccount({ returnTo: '/app' });
  const displayName = account.email?.split('@')[0] || 'Account';

  return (
    <AccountStateProvider account={{ displayName, planTier: 'free' }}>
      {children}
    </AccountStateProvider>
  );
}
