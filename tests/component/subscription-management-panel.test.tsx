import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SubscriptionManagementPanel } from '@/features/subscriptions/components/subscription-management-panel';

const snapshot = {
  status: 'active' as const,
  planCode: 'premium_monthly' as const,
  premium: true,
  validUntil: '2026-09-03T00:00:00.000Z',
  cancelAtPeriodEnd: false,
  checkoutAttemptStatus: 'confirmed',
  revision: 3,
};

describe('SubscriptionManagementPanel', () => {
  it('opens the verified provider portal URL', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const createPortalSession = vi.fn().mockResolvedValue('https://pay.example.test/portal');

    render(
      <SubscriptionManagementPanel
        snapshot={snapshot}
        createPortalSession={createPortalSession}
        navigate={navigate}
      />,
    );

    await user.click(screen.getByRole('button', { name: /manage billing/i }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('https://pay.example.test/portal'));
    expect(createPortalSession).toHaveBeenCalledOnce();
  });

  it('keeps the user in the app when the provider portal is unavailable', async () => {
    const user = userEvent.setup();
    const createPortalSession = vi.fn().mockRejectedValue(new Error('portal_unavailable'));

    render(
      <SubscriptionManagementPanel
        snapshot={snapshot}
        createPortalSession={createPortalSession}
        navigate={() => undefined}
      />,
    );

    await user.click(screen.getByRole('button', { name: /manage billing/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/temporarily unavailable/i);
  });
});
