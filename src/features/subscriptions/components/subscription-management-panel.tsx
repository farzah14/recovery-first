'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { SubscriptionSnapshot } from '@/features/subscriptions/subscription-query';
import { SubscriptionStatusCard } from '@/features/subscriptions/components/subscription-status-card';

type SubscriptionManagementPanelProps = Readonly<{
  snapshot: SubscriptionSnapshot;
  createPortalSession?: () => Promise<string>;
  navigate?: (url: string) => void;
  refreshStatus?: () => void;
}>;

async function requestPortalSession(): Promise<string> {
  const response = await fetch('/api/billing/portal', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok || typeof body !== 'object' || body === null || !('url' in body)) {
    throw new Error('portal_unavailable');
  }

  const url = body.url;
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    throw new Error('portal_unavailable');
  }

  return url;
}

export function SubscriptionManagementPanel({
  snapshot,
  createPortalSession = requestPortalSession,
  navigate = (url) => window.location.assign(url),
  refreshStatus = () => window.location.reload(),
}: SubscriptionManagementPanelProps): React.JSX.Element {
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManageBilling(): Promise<void> {
    setIsOpening(true);
    setError(null);

    try {
      const url = await createPortalSession();
      navigate(url);
    } catch {
      setError('Billing management is temporarily unavailable. Please try again later.');
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <div className="space-y-3">
      <SubscriptionStatusCard snapshot={snapshot} onManageBilling={handleManageBilling} />
      <Button onClick={refreshStatus} variant="ghost">
        Refresh status
      </Button>
      {isOpening ? (
        <p className="text-sm text-[var(--color-text-secondary)]" role="status">
          Opening secure billing management…
        </p>
      ) : null}
      {error ? (
        <div
          className="space-y-2 rounded-xl border border-[var(--color-danger)]/35 bg-[var(--color-danger)]/8 p-3 text-sm text-[var(--color-text-primary)]"
          role="alert"
        >
          <p>{error}</p>
          <Button onClick={() => void handleManageBilling()} size="compact" variant="secondary">
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
