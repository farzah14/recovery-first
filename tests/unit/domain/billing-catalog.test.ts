import { describe, expect, it } from 'vitest';

import {
  billingProductCodes,
  billingProductForCode,
  resolveTierFromEntitlement,
} from '@/domain/billing/product-catalog';

describe('billing product catalog', () => {
  it('maps every supported paid product to Lite or Premium and keeps Free internal', () => {
    expect(billingProductCodes).toEqual([
      'free',
      'lite',
      'lite_monthly',
      'lite_annual',
      'premium',
      'premium_monthly',
      'premium_annual',
    ]);
    expect(billingProductForCode('lite_monthly')).toMatchObject({
      tier: 'lite',
      interval: 'monthly',
    });
    expect(billingProductForCode('premium_annual')).toMatchObject({
      tier: 'premium',
      interval: 'annual',
    });
    expect(billingProductForCode('unknown')).toBeUndefined();
  });

  it('falls back to Free for unknown, invalid, or expired entitlement data', () => {
    const now = new Date('2026-08-03T00:00:00.000Z');

    expect(resolveTierFromEntitlement({ productCode: 'lite_monthly', status: 'active', now })).toBe(
      'lite',
    );
    expect(
      resolveTierFromEntitlement({ productCode: 'premium_monthly', status: 'cancelled', now }),
    ).toBe('premium');
    expect(
      resolveTierFromEntitlement({ productCode: 'premium_monthly', status: 'past_due', now }),
    ).toBe('premium');
    expect(
      resolveTierFromEntitlement({
        productCode: 'premium_monthly',
        status: 'active',
        validUntil: new Date('2026-08-02T23:59:59.000Z'),
        now,
      }),
    ).toBe('free');
    expect(resolveTierFromEntitlement({ productCode: 'unknown', status: 'active', now })).toBe(
      'free',
    );
    expect(resolveTierFromEntitlement({ productCode: 'premium', status: 'revoked', now })).toBe(
      'free',
    );
  });
});
