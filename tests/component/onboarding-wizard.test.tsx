import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AccountStateProvider } from '@/components/account/account-state';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe('OnboardingWizard', () => {
  it('renders the consent step first with terms and privacy links', () => {
    render(
      <AccountStateProvider account={{ accountId: 'user-1', displayName: 'Ada', planTier: 'free' }}>
        <OnboardingWizard />
      </AccountStateProvider>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome to Recovery First' }),
    ).toBeVisible();
    expect(
      screen.getByRole('checkbox', { name: /accept terms and privacy policy/i }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute(
      'href',
      '/terms',
    );
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy',
    );
    expect(screen.getByRole('button', { name: /Continue/i })).toBeVisible();
  });

  it('blocks advancing when consent is not checked', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    render(
      <AccountStateProvider account={{ accountId: 'user-1', displayName: 'Ada', planTier: 'free' }}>
        <OnboardingWizard />
      </AccountStateProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: /Continue/i }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(
      'Please accept the Terms of Service and Privacy Policy to continue.',
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome to Recovery First' }),
    ).toBeVisible();
  });

  it('moves to the profile step after consent is checked', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    render(
      <AccountStateProvider account={{ accountId: 'user-1', displayName: 'Ada', planTier: 'free' }}>
        <OnboardingWizard />
      </AccountStateProvider>,
    );

    await userEvent.click(
      screen.getByRole('checkbox', { name: /accept terms and privacy policy/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(screen.getByRole('heading', { level: 1, name: 'Set up your profile' })).toBeVisible();
    expect(screen.getByLabelText('Display name')).toBeVisible();
    expect(screen.getByLabelText('Timezone')).toBeVisible();
    expect(screen.getByRole('radiogroup', { name: 'Week start day' })).toBeVisible();
    expect(screen.getByRole('switch', { name: 'Enable quiet hours' })).toBeVisible();
  });
});
