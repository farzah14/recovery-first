import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PublicFooter } from '@/components/layout/public-footer';
import { PublicHeader } from '@/components/layout/public-header';

describe('public shell', () => {
  it('exposes public navigation and entry actions', () => {
    render(
      <>
        <PublicHeader />
        <PublicFooter />
      </>,
    );

    expect(screen.getByRole('link', { name: 'Recovery First' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Features' })).toHaveAttribute('href', '/features');
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/auth/sign-in');
    expect(screen.getByRole('link', { name: 'Start Free' })).toHaveAttribute('href', '/app/today');
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
  });
});
