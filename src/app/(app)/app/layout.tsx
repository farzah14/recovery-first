import type { ReactNode } from 'react';

import { requireAccount } from '@/lib/auth/require-account';

export default async function ApplicationLayout({ children }: { children: ReactNode }) {
  await requireAccount({ returnTo: '/app' });
  return children;
}
