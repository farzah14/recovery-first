'use client';

import { initializePaddle, type Paddle } from '@paddle/paddle-js';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getPublicBillingConfig } from '@/lib/payments/paddle-browser-config';

export type CheckoutPresentationState = 'opening' | 'open' | 'processing' | 'closed' | 'error';

type PaddleEvent = Readonly<{ name?: string }>;

type PaddleCheckoutLauncherProps = Readonly<{
  providerTransactionId: string;
  returnUrl: string;
  onNavigate?: (url: string) => void;
  onStateChange?: (state: CheckoutPresentationState) => void;
}>;

let paddlePromise: Promise<Paddle | undefined> | null = null;
let paddlePromiseKey: string | null = null;

function getPaddle(
  config: ReturnType<typeof getPublicBillingConfig>,
  eventCallback: (event: PaddleEvent) => void,
): Promise<Paddle | undefined> {
  const key = `${config.environment}:${config.clientToken}`;
  if (paddlePromise === null || paddlePromiseKey !== key) {
    paddlePromiseKey = key;
    paddlePromise = initializePaddle({
      token: config.clientToken,
      environment: config.environment,
      version: 'v1',
      eventCallback,
    });
  }

  return paddlePromise;
}

export function PaddleCheckoutLauncher({
  providerTransactionId,
  returnUrl,
  onNavigate,
  onStateChange,
}: PaddleCheckoutLauncherProps): React.JSX.Element {
  const [state, setState] = useState<CheckoutPresentationState>('closed');
  const [error, setError] = useState(false);

  const updateState = useCallback(
    (nextState: CheckoutPresentationState) => {
      setState(nextState);
      onStateChange?.(nextState);
    },
    [onStateChange],
  );

  const handleEvent = useCallback(
    (event: PaddleEvent) => {
      const name = event.name?.toLowerCase() ?? '';
      if (name.includes('completed')) {
        updateState('processing');
        if (onNavigate) {
          onNavigate(returnUrl);
        } else {
          window.location.assign(returnUrl);
        }
      } else if (name.includes('error')) {
        setError(true);
        updateState('error');
      } else if (name.includes('closed') || name.includes('close')) {
        updateState('closed');
      }
    },
    [onNavigate, returnUrl, updateState],
  );

  const openCheckout = useCallback(async () => {
    setError(false);
    updateState('opening');

    try {
      const config = getPublicBillingConfig();
      const paddle = await getPaddle(config, handleEvent);
      if (!paddle) {
        throw new Error('Paddle unavailable');
      }

      paddle.Checkout.open({
        transactionId: providerTransactionId,
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          successUrl: returnUrl,
        },
      });
      updateState('open');
    } catch {
      setError(true);
      updateState('error');
    }
  }, [handleEvent, providerTransactionId, returnUrl, updateState]);

  return (
    <div className="space-y-3">
      <Button disabled={state === 'opening' || state === 'processing'} onClick={openCheckout}>
        {state === 'opening' ? 'Opening secure checkout…' : 'Continue to secure checkout'}
      </Button>
      <p aria-live="polite" className="text-sm text-[var(--color-text-secondary)]">
        {state === 'processing'
          ? 'Checkout finished. We are confirming your subscription securely.'
          : state === 'open'
            ? 'Secure checkout is open.'
            : 'Your plan remains unchanged until the server confirms provider payment.'}
      </p>
      {error ? (
        <div role="alert" className="space-y-2 text-sm text-[var(--color-danger)]">
          <p>Secure checkout is unavailable right now. Your plan was not changed.</p>
          <Button onClick={openCheckout} variant="secondary">
            Try checkout again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
