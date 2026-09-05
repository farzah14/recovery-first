import type { JSX } from 'react';
import { ClipboardCheck } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { ReviewPanel } from '@/components/account/account-data-panels';
import { requireAccount } from '@/lib/auth/require-account';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { readAccountSurfaces } from '@/server/account/account-surfaces';

export const dynamic = 'force-dynamic';

export default async function ReviewPage(): Promise<JSX.Element> {
  const account = await requireAccount({ returnTo: '/app/review' });
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', account.id)
    .maybeSingle();
  const read = await readAccountSurfaces({
    client: supabase,
    userId: account.id,
    timezone: profile?.timezone ?? 'UTC',
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)]">
              <ClipboardCheck className="size-4" />
              <span>Weekly Review</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
              Weekly Review & Reset
            </h1>
            <p className="mt-1 text-xs text-[var(--color-text-muted)] sm:text-sm">
              Reflect on your routine, adjust minimum baselines, and reset without shame.
            </p>
          </div>
        </div>

        <ReviewPanel read={read} />
      </div>
    </AppShell>
  );
}
