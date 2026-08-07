import { render, screen, within } from '@testing-library/react';
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

  it('uses the pricing cards without the separate plan-review selector', () => {
    render(<PricingPage />);

    expect(
      screen.queryByRole('heading', { name: 'Choose a plan to review' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Choose a plan' })).not.toBeInTheDocument();
  });

  it('opens trial review in a dialog after starting a paid plan', async () => {
    const user = userEvent.setup();
    render(<PricingPage />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start Trial' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeVisible();
    const review = within(dialog).getByRole('region', { name: 'Review your trial' });
    expect(review).toBeVisible();
    expect(within(review).getByRole('heading', { name: 'Review your trial' })).toBeVisible();
    expect(within(review).getByText(/14-day trial ends/i)).toBeVisible();
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
