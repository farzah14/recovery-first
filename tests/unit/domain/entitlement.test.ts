import { describe, expect, it } from 'vitest';

import {
  grantsPaidTierAccess,
  grantsPremiumAccess,
  type EntitlementStatus,
} from '@/domain/subscriptions/entitlement';

describe('entitlement status', () => {
  it.each<EntitlementStatus>(['trial_active', 'active', 'grace_period'])(
    'grants Premium access for %s',
    (status) => {
      expect(grantsPremiumAccess(status)).toBe(true);
    },
  );

  it.each<EntitlementStatus>(['past_due', 'cancelled', 'expired', 'refunded', 'revoked'])(
    'does not grant Premium access for %s',
    (status) => {
      expect(grantsPremiumAccess(status)).toBe(false);
    },
  );
});

it.each<EntitlementStatus>(['trial_active', 'active', 'grace_period', 'past_due', 'cancelled'])(
  'keeps paid-tier access within the authoritative entitlement window for %s',
  (status) => {
    expect(grantsPaidTierAccess(status)).toBe(true);
  },
);

it('keeps paid-tier access for a cancelled trial until the authoritative expiry', () => {
  expect(grantsPaidTierAccess('trial_cancelled')).toBe(true);
});
