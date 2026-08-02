import { describe, expect, it } from 'vitest';

import {
  calculateConsistency,
  calculateContinuity,
  nextManualSkipCounter,
} from '@/domain/check-ins/metrics';

describe('check-in metrics', () => {
  it('counts Full and Minimum as successful consistency', () => {
    expect(calculateConsistency(['full', 'minimum', 'manual_skipped', 'excused'])).toEqual({
      successful: 2,
      resolved: 3,
      percentage: 66.67,
    });
  });

  it('excludes Excused and Unrecorded from the denominator', () => {
    expect(calculateConsistency(['excused', 'unrecorded'])).toEqual({
      successful: 0,
      resolved: 0,
      percentage: null,
    });
  });

  it('preserves continuity for Full and Minimum', () => {
    expect(calculateContinuity(['full', 'minimum', 'full'])).toBe(3);
  });

  it('breaks continuity after a skipped outcome', () => {
    expect(calculateContinuity(['full', 'minimum', 'automatic_skipped', 'full'])).toBe(1);
  });

  it('increments only for Manual Skipped and resets on success', () => {
    expect(nextManualSkipCounter(2, 'manual_skipped')).toBe(3);
    expect(nextManualSkipCounter(2, 'automatic_skipped')).toBe(2);
    expect(nextManualSkipCounter(2, 'excused')).toBe(2);
    expect(nextManualSkipCounter(2, 'full')).toBe(0);
    expect(nextManualSkipCounter(2, 'minimum')).toBe(0);
  });
});
