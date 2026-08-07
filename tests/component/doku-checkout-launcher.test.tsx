import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DokuCheckoutLauncher } from '@/features/subscriptions/components/doku-checkout-launcher';

describe('DokuCheckoutLauncher', () => {
  it('redirects to the server-created hosted Checkout URL', async () => {
    const user = userEvent.setup();
    const assign = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign },
    });

    render(
      <DokuCheckoutLauncher checkoutUrl="https://sandbox.doku.com/checkout-link/session-01" />,
    );

    await user.click(screen.getByRole('button', { name: /secure checkout/i }));

    expect(assign).toHaveBeenCalledWith('https://sandbox.doku.com/checkout-link/session-01');
    expect(screen.getByText(/provider confirmation/i)).toBeInTheDocument();

    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });
});
