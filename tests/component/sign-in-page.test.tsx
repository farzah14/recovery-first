import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SignInPage from '@/app/auth/sign-in/page';

describe('SignInPage', () => {
  it('renders welcome back title, Google sso, email form, and Sign Up guest link', () => {
    render(<SignInPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible();
    expect(screen.getByText('One day at a time.')).toBeVisible();
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
    expect(screen.getByPlaceholderText('Sign in with Email')).toBeVisible();
    expect(screen.getByRole('button', { name: /Continue with Email/i })).toBeVisible();
    expect(screen.getByText(/Don't have an account\?/i)).toBeVisible();
    expect(screen.getByRole('link', { name: /Sign Up/i })).toHaveAttribute('href', '/auth/sign-up');
  });
});
