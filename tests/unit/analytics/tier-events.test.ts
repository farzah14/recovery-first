import { describe, expect, it } from 'vitest';

import { createTierAnalyticsEvent, tierAnalyticsEventNames } from '@/lib/analytics/tier-events';

describe('tier analytics contract', () => {
  it('uses only the ordered account tier names and safe event names', () => {
    expect(tierAnalyticsEventNames).toEqual([
      'account_signed_in',
      'entitlement_resolved',
      'checkout_started',
      'checkout_completed',
      'tier_downgraded',
      'legacy_data_transfer',
    ]);
  });

  it('emits only tier and operational outcome fields', () => {
    expect(
      createTierAnalyticsEvent({
        name: 'tier_downgraded',
        tier: 'lite',
        previousTier: 'premium',
        outcome: 'over_limit_paused',
      }),
    ).toEqual({
      name: 'tier_downgraded',
      tier: 'lite',
      previousTier: 'premium',
      outcome: 'over_limit_paused',
    });
  });
});
