import { describe, expect, it } from 'vitest';

import { buildAccountContext } from '@/lib/auth/account-context';

describe('buildAccountContext', () => {
  it('uses the supplied verified tier', () => {
    expect(
      buildAccountContext(
        { id: 'user-1', email: 'alex@example.com' },
        { display_name: 'Zah Febri', timezone: 'Asia/Jakarta' },
        { planTier: 'lite', entitlementStatus: 'resolved' },
      ),
    ).toEqual({
      accountId: 'user-1',
      displayName: 'Zah Febri',
      planTier: 'lite',
      timezone: 'Asia/Jakarta',
      entitlementStatus: 'resolved',
    });
  });

  it('falls back to Free when no verified tier is available', () => {
    expect(
      buildAccountContext(
        { id: 'user-2', email: 'alex@example.com' },
        { display_name: null, timezone: 'UTC' },
      ),
    ).toMatchObject({
      accountId: 'user-2',
      displayName: 'alex',
      planTier: 'free',
      timezone: 'UTC',
      entitlementStatus: 'resolved',
    });
  });
});
