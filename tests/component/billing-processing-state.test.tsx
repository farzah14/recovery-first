import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { initializePaddle } = vi.hoisted(() => ({ initializePaddle: vi.fn() }));

vi.mock('@paddle/paddle-js', () => ({ initializePaddle }));

import { PaddleCheckoutLauncher } from '@/features/subscriptions/components/paddle-checkout-launcher';

describe('PaddleCheckoutLauncher', () => {
  let tokenCounter = 0;

  beforeEach(() => {
    initializePaddle.mockReset();
    tokenCounter += 1;
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN = `test_client_token_${tokenCounter}`;
    process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT = 'sandbox';
  });

  it('opens checkout with the server-created transaction and not a browser price', async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    initializePaddle.mockResolvedValue({ Checkout: { open } });

    render(
      <PaddleCheckoutLauncher
        providerTransactionId="txn_server_01"
        returnUrl="https://tracker.example/billing/return?attempt=attempt_01"
      />,
    );

    await user.click(screen.getByRole('button', { name: /secure checkout/i }));

    expect(initializePaddle).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith({
      transactionId: 'txn_server_01',
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        successUrl: 'https://tracker.example/billing/return?attempt=attempt_01',
      },
    });
    expect(open.mock.calls[0]?.[0]).not.toHaveProperty('items');
  });

  it('routes completion to Processing and never grants Premium locally', async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    let callback: ((event: { name?: string }) => void) | undefined;
    initializePaddle.mockImplementation(async (options: { eventCallback?: typeof callback }) => {
      callback = options.eventCallback;
      return { Checkout: { open } };
    });
    const navigate = vi.fn();
    const states: string[] = [];

    render(
      <PaddleCheckoutLauncher
        onNavigate={navigate}
        onStateChange={(state) => states.push(state)}
        providerTransactionId="txn_server_01"
        returnUrl="https://tracker.example/billing/return?attempt=attempt_01"
      />,
    );

    await user.click(screen.getByRole('button', { name: /secure checkout/i }));
    callback?.({ name: 'checkout.completed' });

    expect(navigate).toHaveBeenCalledWith(
      'https://tracker.example/billing/return?attempt=attempt_01',
    );
    expect(states).toContain('processing');
    expect(screen.queryByText(/premium enabled/i)).not.toBeInTheDocument();
  });

  it('shows retry guidance when Paddle cannot initialize', async () => {
    const user = userEvent.setup();
    initializePaddle.mockRejectedValue(new Error('provider unavailable'));

    render(
      <PaddleCheckoutLauncher
        providerTransactionId="txn_server_01"
        returnUrl="https://tracker.example/billing/return?attempt=attempt_01"
      />,
    );

    await user.click(screen.getByRole('button', { name: /secure checkout/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/unavailable/i);
    expect(screen.getByRole('button', { name: /try checkout again/i })).toBeVisible();
  });
});
