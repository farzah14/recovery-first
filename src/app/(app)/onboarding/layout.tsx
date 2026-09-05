import type { ReactNode } from 'react';

import { AccountStateProvider } from '@/components/account/account-state';
import { requireAccount } from '@/lib/auth/require-account';
import { buildAccountContext } from '@/lib/auth/account-context';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const account = await requireAccount({ returnTo: '/onboarding' });
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name,plan_code,timezone,week_start')
    .eq('id', account.id)
    .maybeSingle();
  const accountContext = buildAccountContext(account, profile);

  return <AccountStateProvider account={accountContext}>{children}</AccountStateProvider>;
}
