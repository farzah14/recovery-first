import type { ReactNode } from 'react';

import { AccountStateProvider } from '@/components/account/account-state';
import { DeviceTimeSync } from '@/components/account/device-time-sync';
import { requireAccount } from '@/lib/auth/require-account';
import { buildAccountContext } from '@/lib/auth/account-context';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function ApplicationLayout({ children }: { children: ReactNode }) {
  const account = await requireAccount({ returnTo: '/app' });
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name,plan_code,timezone,week_start')
    .eq('id', account.id)
    .maybeSingle();
  const accountContext = buildAccountContext(account, profile);

  return (
    <AccountStateProvider account={accountContext}>
      <DeviceTimeSync>{children}</DeviceTimeSync>
    </AccountStateProvider>
  );
}
