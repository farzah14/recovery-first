import { describe, expect, it } from 'vitest';

import { activeHabitLimitFor, evaluateActivation } from '@/domain/habits/active-slot-policy';

describe('active slot policy', () => {
  it('returns fixed limits for every plan tier', () => {
    expect(activeHabitLimitFor('free')).toBe(5);
    expect(activeHabitLimitFor('lite')).toBe(10);
    expect(activeHabitLimitFor('premium')).toBe(30);
  });

  it('permits activation while capacity remains', () => {
    expect(evaluateActivation({ planTier: 'free', activeCount: 4 })).toEqual({
      allowed: true,
      limit: 5,
      remainingAfterActivation: 0,
    });
  });

  it('rejects activation when the limit is reached', () => {
    expect(evaluateActivation({ planTier: 'free', activeCount: 5 })).toEqual({
      allowed: false,
      limit: 5,
      reason: 'active_limit_reached',
    });
  });
});
