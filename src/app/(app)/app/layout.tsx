import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AccountStateProvider } from '@/components/account/account-state';
import { buildAccountContext } from '@/lib/auth/account-context';
import { readVerifiedAccountTier } from '@/lib/auth/verified-account-tier';
import { requireAccount } from '@/lib/auth/require-account';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function ApplicationLayout({ children }: { children: ReactNode }) {
  const account = await requireAccount({ returnTo: '/app' });
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name,timezone,terms_accepted_at,onboarding_completed_at')
    .eq('id', account.id)
    .maybeSingle();
  if (!profile?.onboarding_completed_at) {
    redirect('/onboarding');
  }
  const verifiedTier = await readVerifiedAccountTier(supabase);
  const accountContext = buildAccountContext(account, profile, verifiedTier);

  return <AccountStateProvider account={accountContext}>{children}</AccountStateProvider>;
}
