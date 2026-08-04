'use client';

import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';

export type DokuCheckoutPresentationState = 'opening' | 'open' | 'processing' | 'error';

type DokuCheckoutLauncherProps = Readonly<{
  checkoutUrl: string;
  onNavigate?: (url: string) => void;
  onStateChange?: (state: DokuCheckoutPresentationState) => void;
}>;

function isSafeDokuCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'sandbox.doku.com' || url.hostname === 'jokul.doku.com')
    );
  } catch {
    return false;
  }
}

export function DokuCheckoutLauncher({
  checkoutUrl,
  onNavigate,
  onStateChange,
}: DokuCheckoutLauncherProps): React.JSX.Element {
  const [state, setState] = useState<DokuCheckoutPresentationState>('open');
  const [error, setError] = useState(false);

  const updateState = useCallback(
    (nextState: DokuCheckoutPresentationState) => {
      setState(nextState);
      onStateChange?.(nextState);
    },
    [onStateChange],
  );

  const openCheckout = useCallback(() => {
    setError(false);
    updateState('opening');

    if (!isSafeDokuCheckoutUrl(checkoutUrl)) {
      setError(true);
      updateState('error');
      return;
    }

    updateState('processing');
    if (onNavigate) {
      onNavigate(checkoutUrl);
    } else {
      window.location.assign(checkoutUrl);
    }
  }, [checkoutUrl, onNavigate, updateState]);

  return (
    <div className="space-y-3">
      <Button disabled={state === 'opening' || state === 'processing'} onClick={openCheckout}>
        Continue to secure checkout
      </Button>
      <p aria-live="polite" className="text-sm text-[var(--color-text-secondary)]">
        {state === 'processing'
          ? 'Checkout opened. We are waiting for verified provider confirmation.'
          : 'Your plan remains unchanged until the server confirms provider payment.'}
      </p>
      {error ? (
        <div role="alert" className="space-y-2 text-sm text-[var(--color-danger)]">
          <p>Secure DOKU Checkout is unavailable right now. Your plan was not changed.</p>
          <Button onClick={openCheckout} variant="secondary">
            Try checkout again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
