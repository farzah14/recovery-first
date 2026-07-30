import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HowItWorksPage from '@/app/(public)/how-it-works/page';

describe('HowItWorksPage', () => {
  it('renders how-it-works hero title, 6 step loop cards, and final cta', () => {
    render(<HowItWorksPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Built for the reality of your life.' }),
    ).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Design' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Do' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Check-In' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Identify Friction' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Adapt' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Recover' })).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Ready to build sustainable habits?' }),
    ).toBeVisible();
  });
});
