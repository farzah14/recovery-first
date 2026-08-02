import { describe, expect, it } from 'vitest';

import { grantsPremiumAccess, type EntitlementStatus } from '@/domain/subscriptions/entitlement';

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
