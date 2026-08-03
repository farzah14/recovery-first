'use client';

import type { SubscriptionSnapshot } from '@/features/subscriptions/subscription-query';
import { Button } from '@/components/ui/button';

type SubscriptionStatusCardProps = Readonly<{
  snapshot: SubscriptionSnapshot;
  onManageBilling: () => void;
}>;

function statusLabel(status: SubscriptionSnapshot['status']): string {
  return status.replaceAll('_', ' ');
}

export function SubscriptionStatusCard({
  snapshot,
  onManageBilling,
}: SubscriptionStatusCardProps): React.JSX.Element {
  const message =
    snapshot.status === 'cancelled' || snapshot.status === 'trial_cancelled'
      ? 'Access remains available until the authoritative expiry date.'
      : snapshot.status === 'past_due' || snapshot.status === 'grace_period'
        ? 'Payment needs attention. Manage billing to recover the subscription.'
        : snapshot.status === 'expired' ||
            snapshot.status === 'refunded' ||
            snapshot.status === 'revoked'
          ? 'Paid access has ended. Your product history remains available.'
          : snapshot.status === 'processing'
            ? 'We are waiting for verified provider confirmation.'
            : 'Your current plan and verified entitlement status appear here.';

  return (
    <section
      aria-labelledby="subscription-status-title"
      className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className="text-lg font-semibold text-[var(--color-text-primary)]"
            id="subscription-status-title"
          >
            Subscription status
          </h2>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)] capitalize">
            {statusLabel(snapshot.status)}
          </p>
        </div>
        <span
          aria-label={`Premium ${snapshot.premium ? 'active' : 'inactive'}`}
          className="text-sm"
        >
          {snapshot.premium ? '✓ Premium access' : '○ No Premium access'}
        </span>
      </div>
      {snapshot.planCode ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          Plan: <span className="font-medium">{snapshot.planCode.replaceAll('_', ' ')}</span>
        </p>
      ) : null}
      <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
      {snapshot.cancelAtPeriodEnd ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          Automatic renewal is off; access remains available through the date below.
        </p>
      ) : null}
      {snapshot.validUntil ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          Valid until{' '}
          {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
            new Date(snapshot.validUntil),
          )}
          .
        </p>
      ) : null}
      <Button onClick={onManageBilling} variant="secondary">
        Manage billing
      </Button>
    </section>
  );
}
