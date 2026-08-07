import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { CheckoutConfirmation } from '@/features/subscriptions/components/checkout-confirmation';

describe('CheckoutConfirmation', () => {
  it('discloses trial and recurring billing before enabling confirmation', async () => {
    const user = userEvent.setup();
    let confirmed = false;

    render(
      <CheckoutConfirmation
        productCode="premium_monthly"
        now={new Date('2026-08-03T00:00:00.000Z')}
        onConfirm={() => {
          confirmed = true;
        }}
      />,
    );

    expect(screen.getByText(/14-day trial ends/i)).toBeVisible();
    expect(screen.getByText(/renews monthly until cancelled/i)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Confirm checkout' })).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: /authorize the trial/i }));
    expect(screen.getByRole('button', { name: 'Confirm checkout' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Confirm checkout' }));
    expect(confirmed).toBe(true);
  });
});
