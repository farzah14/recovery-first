import { describe, expect, it } from 'vitest';

import { activeHabitLimitFor, evaluateActivation } from '@/domain/habits/active-slot-policy';

describe('active slot policy', () => {
  it('returns fixed limits for every plan tier', () => {
    expect(activeHabitLimitFor('guest')).toBe(3);
    expect(activeHabitLimitFor('free')).toBe(5);
    expect(activeHabitLimitFor('premium')).toBe(20);
  });

  it('permits activation while capacity remains', () => {
    expect(evaluateActivation({ planTier: 'free', activeCount: 4 })).toEqual({
      allowed: true,
      limit: 5,
      remainingAfterActivation: 0,
    });
  });

  it('rejects activation when the limit is reached', () => {
    expect(evaluateActivation({ planTier: 'guest', activeCount: 3 })).toEqual({
      allowed: false,
      limit: 3,
      reason: 'active_limit_reached',
    });
  });
});
