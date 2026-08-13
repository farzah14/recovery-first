import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import UpdatePasswordPage from '@/app/auth/update-password/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe('UpdatePasswordPage', () => {
  it('renders new password heading, both password fields, and submit button', () => {
    render(<UpdatePasswordPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Choose a new password' })).toBeVisible();
    expect(screen.getByPlaceholderText('New password')).toBeVisible();
    expect(screen.getByPlaceholderText('Confirm new password')).toBeVisible();
    expect(screen.getByRole('button', { name: /Update password/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /Sign In/i })).toHaveAttribute('href', '/auth/sign-in');
  });
});
