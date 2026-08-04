'use client';

import { useMemo, useState } from 'react';

import type { PaidProductCode } from '@/features/subscriptions/checkout-service';
import { Button } from '@/components/ui/button';
import type { BillingPriceMap } from '@/domain/billing/billing-price';
import { formatBillingPrice } from '@/domain/billing/billing-price';
import { DokuCheckoutLauncher } from '@/features/subscriptions/components/doku-checkout-launcher';

export type CheckoutSession = Readonly<{
  providerTransactionId: string;
  checkoutUrl: string;
  returnUrl: string;
}>;

type CheckoutConfirmationProps = Readonly<{
  productCode: PaidProductCode;
  now: Date;
  onConfirm: () => Promise<CheckoutSession | void> | CheckoutSession | void;
  prices?: BillingPriceMap | null;
}>;

const trialDays = 14;

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date);
}

function cadence(productCode: PaidProductCode): string {
  return productCode.endsWith('_annual') ? 'annually' : 'monthly';
}

export function CheckoutConfirmation({
  productCode,
  now,
  onConfirm,
  prices,
}: CheckoutConfirmationProps): React.JSX.Element {
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [error, setError] = useState(false);
  const trialEndsAt = useMemo(() => new Date(now.getTime() + trialDays * 86_400_000), [now]);

  async function confirmCheckout(): Promise<void> {
    setError(false);
    setPending(true);
    try {
      const nextSession = await onConfirm();
      if (nextSession) {
        setSession(nextSession);
      }
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  if (session) {
    return (
      <section
        aria-labelledby="checkout-launch-title"
        className="space-y-4 rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-surface)] p-5 shadow-sm"
      >
        <h2
          className="text-lg font-semibold text-[var(--color-text-primary)]"
          id="checkout-launch-title"
        >
          Continue securely
        </h2>
        <DokuCheckoutLauncher checkoutUrl={session.checkoutUrl} />
      </section>
    );
  }

  return (
    <section
      aria-labelledby="checkout-confirmation-title"
      className="space-y-4 rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-surface)] p-5 shadow-sm"
    >
      <div>
        <h2
          className="text-lg font-semibold text-[var(--color-text-primary)]"
          id="checkout-confirmation-title"
        >
          Review your trial
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Your 14-day trial ends on {formatDate(trialEndsAt)}. The first billing date is the same
          day.
        </p>
      </div>
      <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
        <li>
          After the trial, {formatBillingPrice(prices?.[productCode])} renews {cadence(productCode)}{' '}
          until cancelled.
        </li>
        <li>You can cancel before renewal; access follows the authoritative expiry date.</li>
        <li>Refund requests follow the published refund policy.</li>
      </ul>
      <label className="flex items-start gap-3 text-sm text-[var(--color-text-primary)]">
        <input
          checked={accepted}
          className="mt-1 size-4 accent-[var(--color-primary)]"
          onChange={(event) => setAccepted(event.target.checked)}
          type="checkbox"
        />
        <span>I authorize the trial and the recurring charge described above.</span>
      </label>
      <Button disabled={!accepted || pending} onClick={confirmCheckout} fullWidth type="button">
        {pending ? 'Creating secure checkout…' : 'Confirm checkout'}
      </Button>
      {error ? (
        <p aria-live="polite" className="text-sm text-[var(--color-danger)]">
          Checkout could not be created. Your plan was not changed. Please try again.
        </p>
      ) : null}
    </section>
  );
}
