import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SubscriptionStatusCard } from '@/features/subscriptions/components/subscription-status-card';

describe('SubscriptionStatusCard', () => {
  it('explains cancellation without threatening data loss', () => {
    render(
      <SubscriptionStatusCard
        snapshot={{
          status: 'cancelled',
          planCode: 'premium_monthly',
          premium: true,
          validUntil: '2026-09-03T00:00:00.000Z',
          cancelAtPeriodEnd: true,
          checkoutAttemptStatus: 'confirmed',
          revision: 3,
        }}
        onManageBilling={() => undefined}
      />,
    );

    expect(screen.getByText(/cancelled/i)).toBeVisible();
    expect(screen.getByText(/access remains available until/i)).toBeVisible();
    expect(screen.queryByText(/delete|lose your data/i)).not.toBeInTheDocument();
  });

  it('shows payment recovery guidance for past due status', () => {
    render(
      <SubscriptionStatusCard
        snapshot={{
          status: 'past_due',
          planCode: 'lite_monthly',
          premium: false,
          validUntil: '2026-09-03T00:00:00.000Z',
          cancelAtPeriodEnd: false,
          checkoutAttemptStatus: 'confirmed',
          revision: 2,
        }}
        onManageBilling={() => undefined}
      />,
    );

    expect(screen.getByText(/payment needs attention/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /manage billing/i })).toBeVisible();
  });
});
