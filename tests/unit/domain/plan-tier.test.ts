import { describe, expect, it } from 'vitest';

import {
  comparePlanTiers,
  downgradeTargetFor,
  isPlanTier,
  planTiers,
} from '@/domain/shared/plan-tier';
import { identityModes, isIdentityMode } from '@/domain/shared/identity-mode';

describe('plan tier contract', () => {
  it('exposes only the ordered Free, Lite, and Premium tiers', () => {
    expect(planTiers).toEqual(['free', 'lite', 'premium']);
    expect(isPlanTier('guest')).toBe(false);
    expect(isPlanTier('free')).toBe(true);
  });

  it('compares tiers in upgrade order', () => {
    expect(comparePlanTiers('free', 'lite')).toBeLessThan(0);
    expect(comparePlanTiers('lite', 'premium')).toBeLessThan(0);
    expect(comparePlanTiers('premium', 'premium')).toBe(0);
  });

  it('selects the next lower tier for entitlement downgrade', () => {
    expect(downgradeTargetFor('premium')).toBe('lite');
    expect(downgradeTargetFor('lite')).toBe('free');
    expect(downgradeTargetFor('free')).toBe('free');
  });

  it('uses authenticated account identity for normal runtime ownership', () => {
    expect(identityModes).toEqual(['account']);
    expect(isIdentityMode('account')).toBe(true);
    expect(isIdentityMode('guest')).toBe(false);
  });
});
