import type { PlanTier } from '@/domain/shared/plan-tier';

const activeHabitLimits: Readonly<Record<PlanTier, number>> = {
  guest: 3,
  free: 5,
  premium: 20,
};

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

export function activeHabitLimitFor(planTier: PlanTier): number {
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
