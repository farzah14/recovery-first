import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ForgotPasswordPage from '@/app/auth/forgot-password/page';

describe('ForgotPasswordPage', () => {
  it('renders reset heading, email input, and sign in link', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Reset your password' })).toBeVisible();
    expect(screen.getByText("We'll email you a secure reset link.")).toBeVisible();
    expect(screen.getByPlaceholderText('alex@example.com')).toBeVisible();
    expect(screen.getByRole('button', { name: /Send reset link/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /Sign In/i })).toHaveAttribute('href', '/auth/sign-in');
  });
});
