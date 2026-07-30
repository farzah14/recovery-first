import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import PricingPage from '@/app/(public)/pricing/page';

describe('PricingPage', () => {
  it('renders simple transparent pricing title and plan options', () => {
    render(<PricingPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Simple, transparent pricing.' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Guest' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Free' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Premium' })).toBeVisible();
  });

  it('toggles between monthly and annual pricing', async () => {
    const user = userEvent.setup();
    render(<PricingPage />);

    const annualButton = screen.getByRole('button', { name: /Annually/i });
    await user.click(annualButton);

    expect(screen.getByText('$48')).toBeVisible();
    expect(screen.getByText('/yr')).toBeVisible();
  });
});
