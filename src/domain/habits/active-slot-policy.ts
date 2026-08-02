import type { PlanTier } from '@/domain/shared/plan-tier';

const activeHabitLimits: Readonly<Record<PlanTier, number>> = {
  free: 5,
  lite: 10,
  premium: 30,
};

const legacyGuestActiveHabitLimit = 3;

export type ActivationDecision =
  | {
      allowed: true;
      limit: number;
      remainingAfterActivation: number;
    }
  | {
      allowed: false;
      limit: number;
      reason: 'active_limit_reached';
    };

export function activeHabitLimitFor(planTier: PlanTier): number;
/**
 * @deprecated Only retained while versioned local data is migrated. New runtime
 * ownership must use an authenticated Free, Lite, or Premium account.
 */
export function activeHabitLimitFor(planTier: 'guest'): number;
export function activeHabitLimitFor(planTier: PlanTier | 'guest'): number {
  if (planTier === 'guest') {
    return legacyGuestActiveHabitLimit;
  }

  return activeHabitLimits[planTier];
}

export function evaluateActivation({
  planTier,
  activeCount,
}: {
  planTier: PlanTier;
  activeCount: number;
}): ActivationDecision {
  if (!Number.isInteger(activeCount) || activeCount < 0) {
    throw new RangeError('activeCount must be a non-negative integer');
  }

  const limit = activeHabitLimitFor(planTier);
  if (activeCount >= limit) {
    return { allowed: false, limit, reason: 'active_limit_reached' };
  }

  return {
    allowed: true,
    limit,
    remainingAfterActivation: limit - activeCount - 1,
  };
}
