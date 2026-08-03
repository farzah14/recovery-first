import { CreditCard } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { SubscriptionManagementPanel } from '@/features/subscriptions/components/subscription-management-panel';
import { requireAccount } from '@/lib/auth/require-account';
import { createProductionSubscriptionQuery } from '@/server/billing/subscription-query';

export const metadata = {
  title: 'Subscription Settings | RecoveryFirst',
  description: 'Review verified subscription access and manage provider billing securely.',
};

export const dynamic = 'force-dynamic';

export default async function SubscriptionSettingsPage(): Promise<React.JSX.Element> {
  const account = await requireAccount({ returnTo: '/app/settings/subscription' });
  const query = createProductionSubscriptionQuery();
  const snapshot = await query.readCurrentSnapshot(account.id);

  return (
    <AppShell showCreateHabitActions={false}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="border-b border-[var(--color-border)] pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)]">
            <CreditCard className="size-4" />
            <span>Preferences & Account</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
            Subscription & Billing
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Access is based on the latest verified entitlement. Provider billing opens in a secure
            external portal.
          </p>
        </div>

        <SubscriptionManagementPanel snapshot={snapshot} />
      </div>
    </AppShell>
  );
}
