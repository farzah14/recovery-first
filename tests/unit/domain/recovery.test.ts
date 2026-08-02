import { describe, expect, it } from 'vitest';

import { evaluateRecoveryEligibility, evaluateRecoveryPlan } from '@/domain/recovery/recovery';

describe('Recovery rules', () => {
  it('triggers after three consecutive Manual Skipped outcomes', () => {
    expect(evaluateRecoveryEligibility(3)).toEqual({ eligible: true });
  });

  it('does not trigger before three Manual Skipped outcomes', () => {
    expect(evaluateRecoveryEligibility(2)).toEqual({
      eligible: false,
      remainingManualSkips: 1,
    });
  });

  it('succeeds when the threshold is reached', () => {
    expect(
      evaluateRecoveryPlan({
        completedSessions: 3,
        successfulSessions: 2,
        durationSessions: 3,
        successThreshold: 2,
      }),
    ).toBe('succeeded');
  });

  it('remains active until all scheduled recovery sessions resolve', () => {
    expect(
      evaluateRecoveryPlan({
        completedSessions: 2,
        successfulSessions: 2,
        durationSessions: 3,
        successThreshold: 2,
      }),
    ).toBe('active');
  });
});
