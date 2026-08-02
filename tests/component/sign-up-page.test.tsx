import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SignUpPage from '@/app/auth/sign-up/page';

describe('SignUpPage', () => {
  it('renders start your journey title, Google sso, registration form, and sign in link', () => {
    render(<SignUpPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Start your journey' })).toBeVisible();
    expect(screen.getByText('Create an account to save your progress safely.')).toBeVisible();
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
    expect(screen.getByPlaceholderText('Alex')).toBeVisible();
    expect(screen.getByPlaceholderText('alex@example.com')).toBeVisible();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /Sign In/i })).toHaveAttribute('href', '/auth/sign-in');
  });
});
