'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import { routes } from '@/lib/navigation/route-definitions';

type BillingStatusSnapshot = Readonly<{
  status: string;
  planCode: string | null;
  premium: boolean;
  validUntil: string | null;
  cancelAtPeriodEnd: boolean;
  checkoutAttemptStatus: string | null;
  revision: number | null;
}>;

type BillingProcessingStateProps = Readonly<{
  attempt: string | undefined;
}>;

const attemptSchema = z.string().uuid();
const pollingDelays = [1000, 2000, 3000, 5000] as const;
const activeWindowMs = 60_000;

export function BillingProcessingState({
  attempt,
}: BillingProcessingStateProps): React.JSX.Element {
  const validAttempt = attemptSchema.safeParse(attempt);
  const attemptId = validAttempt.success ? validAttempt.data : null;
  const [state, setState] = useState<
    'processing' | 'ready' | 'confirmed' | 'failed' | 'error' | 'timeout'
  >('processing');
  const [snapshot, setSnapshot] = useState<BillingStatusSnapshot | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const pollingAttemptId = attemptId ?? '';
    if (pollingAttemptId === '') {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let delayIndex = 0;
    let elapsed = 0;

    async function poll(): Promise<void> {
      try {
        const response = await fetch(
          `/api/billing/status?attempt=${encodeURIComponent(pollingAttemptId)}`,
          { cache: 'no-store' },
        );
        if (!response.ok) {
          throw new Error('billing_status_unavailable');
        }

        const nextSnapshot = (await response.json()) as BillingStatusSnapshot;
        if (cancelled) {
          return;
        }

        setSnapshot(nextSnapshot);
        if (nextSnapshot.premium) {
          setState('ready');
          return;
        }
        if (nextSnapshot.status === 'failed') {
          setState('failed');
          return;
        }
        if (nextSnapshot.status !== 'processing') {
          setState('confirmed');
          return;
        }

        const delay = pollingDelays[Math.min(delayIndex, pollingDelays.length - 1)] ?? 5000;
        delayIndex += 1;
        elapsed += delay;
        if (elapsed >= activeWindowMs) {
          setState('timeout');
          return;
        }
        timer = setTimeout(() => void poll(), delay);
      } catch {
        if (!cancelled) {
          setState('error');
        }
      }
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'visible') {
        if (timer) {
          clearTimeout(timer);
        }
        void poll();
      } else if (timer) {
        clearTimeout(timer);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    void poll();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attemptId, refreshNonce]);

  if (!validAttempt.success) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-6 py-12">
        <section className="space-y-3 text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Checkout link is invalid
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Start again from Pricing to create a new secure checkout.
          </p>
          <Link
            className="font-semibold text-[var(--color-primary)] underline"
            href={routes.pricing}
          >
            Return to pricing
          </Link>
        </section>
      </main>
    );
  }

  const content =
    state === 'ready' ? (
      <>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Premium is ready</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Your verified subscription is active until{' '}
          {snapshot?.validUntil ?? 'the provider confirms the date'}.
        </p>
      </>
    ) : state === 'failed' ? (
      <>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Checkout was not completed
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Your plan was not changed. You can return to Pricing and try again.
        </p>
      </>
    ) : state === 'timeout' ? (
      <>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Still processing</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          The provider confirmation is taking longer than usual. Refresh status manually or try
          again later.
        </p>
      </>
    ) : state === 'error' ? (
      <>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Status is temporarily unavailable
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          We could not confirm your subscription right now. Your plan remains unchanged.
        </p>
      </>
    ) : state === 'confirmed' ? (
      <>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Checkout received</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          We are waiting for verified entitlement confirmation before changing your plan.
        </p>
      </>
    ) : (
      <>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Processing</h1>
        <p className="text-sm text-[var(--color-text-secondary)]" aria-live="polite">
          We are confirming your subscription securely. Premium access appears only after backend
          verification.
        </p>
      </>
    );

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-6 py-12">
      <section aria-live="polite" className="space-y-4 text-center">
        {content}
        {state === 'timeout' ? (
          <button
            className="font-semibold text-[var(--color-primary)] underline"
            onClick={() => {
              setSnapshot(null);
              setState('processing');
              setRefreshNonce((value) => value + 1);
            }}
            type="button"
          >
            Refresh status
          </button>
        ) : null}
        {(state === 'failed' || state === 'error' || state === 'timeout') && (
          <Link
            className="font-semibold text-[var(--color-primary)] underline"
            href={routes.pricing}
          >
            Return to pricing
          </Link>
        )}
      </section>
    </main>
  );
}
