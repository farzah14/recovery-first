import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AboutPage from '@/app/(public)/about/page';

describe('AboutPage', () => {
  it('renders about hero title, problem with streaks, principles, and story sections', () => {
    render(<AboutPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'About Us' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'The Problem with Streaks' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Our Core Principles' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Our Story' })).toBeVisible();
  });
});
