import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BillingProcessingState } from '@/features/subscriptions/components/billing-processing-state';

describe('BillingProcessingState', () => {
  it('shows a safe error for a missing or malformed attempt', () => {
    render(<BillingProcessingState attempt="not-a-uuid" />);

    expect(screen.getByRole('heading', { name: /checkout link is invalid/i })).toBeVisible();
    expect(screen.getByText(/start again from pricing/i)).toBeVisible();
  });

  it('starts in Processing and shows Premium only after authoritative status', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'active',
          planCode: 'premium_monthly',
          premium: true,
          validUntil: '2026-09-03T00:00:00.000Z',
          cancelAtPeriodEnd: false,
          checkoutAttemptStatus: 'confirmed',
          revision: 2,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    render(<BillingProcessingState attempt="550e8400-e29b-41d4-a716-446655440000" />);

    expect(screen.getByRole('heading', { name: /processing/i })).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /premium is ready/i })).toBeVisible(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/billing/status?attempt=550e8400-e29b-41d4-a716-446655440000',
      { cache: 'no-store' },
    );

    fetchMock.mockRestore();
  });

  it('shows retry guidance for failed checkout status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'failed',
          planCode: null,
          premium: false,
          validUntil: null,
          cancelAtPeriodEnd: false,
          checkoutAttemptStatus: 'failed',
          revision: null,
        }),
        { status: 200 },
      ),
    );

    render(<BillingProcessingState attempt="550e8400-e29b-41d4-a716-446655440000" />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /checkout was not completed/i })).toBeVisible(),
    );
    expect(screen.getByRole('link', { name: /return to pricing/i })).toBeVisible();
  });
});
