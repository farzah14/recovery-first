import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import FeaturesPage from '@/app/(public)/features/page';

describe('FeaturesPage', () => {
  it('renders features hero title and bento grid feature cards', () => {
    render(<FeaturesPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Built for the reality of habit building.' }),
    ).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Flexible Continuity' })).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Supportive Recovery Mode' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Insightful Weekly Reviews' }),
    ).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Privacy & Control' })).toBeVisible();
  });
});
