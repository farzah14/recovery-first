import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PricingPage from '@/app/(public)/pricing/page';

const dokuPricing = {
  currency: 'IDR',
  amounts: {
    lite_monthly: 20_000,
    lite_annual: 300_000,
    premium_monthly: 70_000,
    premium_annual: 700_000,
  },
};

describe('PricingPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => dokuPricing,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders simple transparent pricing title and plan options', () => {
    render(<PricingPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Tracker Plan' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Free' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Lite' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Premium' })).toBeVisible();
  });

  it('toggles between monthly and annual pricing', async () => {
    const user = userEvent.setup();
    render(<PricingPage />);

    const annualButton = screen.getByRole('button', { name: /Annually/i });
    await user.click(annualButton);

    expect((await screen.findAllByText(/Rp\s*300\.000/))[0]).toBeVisible();
    expect(screen.getAllByText('/yr')[0]).toBeVisible();
  });
});
