import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  AccountStateProvider,
  AccountTierNotice,
  AccountTierSummary,
} from '@/components/account/account-state';

describe('account tier presentation', () => {
  it('renders the resolved account name and tier without Guest labels', () => {
    render(
      <AccountStateProvider account={{ displayName: 'Ada', planTier: 'lite' }}>
        <AccountTierSummary />
      </AccountStateProvider>,
    );

    expect(screen.getByText('Ada')).toBeVisible();
    expect(screen.getByText('Lite Plan')).toBeVisible();
    expect(screen.queryByText(/Guest/i)).not.toBeInTheDocument();
  });

  it('renders honest entitlement and legacy-data recovery states', () => {
    render(
      <AccountStateProvider
        account={{ displayName: 'Ada', planTier: 'free', entitlementStatus: 'legacy_recovery' }}
      >
        <AccountTierNotice />
      </AccountStateProvider>,
    );

    expect(screen.getByText(/legacy browser data is available/i)).toBeVisible();
  });
});
