import type { ReactNode } from 'react';

import { AccountStateProvider } from '@/components/account/account-state';
import { getAccountContext } from '@/lib/auth/account-context';

export default async function ApplicationLayout({ children }: { children: ReactNode }) {
  const account = await getAccountContext();

  return <AccountStateProvider account={account}>{children}</AccountStateProvider>;
}
