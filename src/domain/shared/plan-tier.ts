export const planTiers = ['free', 'lite', 'premium'] as const;

export type PlanTier = (typeof planTiers)[number];

const planTierRanks: Readonly<Record<PlanTier, number>> = {
  free: 0,
  lite: 1,
  premium: 2,
};

export function isPlanTier(value: string): value is PlanTier {
  return planTiers.includes(value as PlanTier);
}

export function comparePlanTiers(left: PlanTier, right: PlanTier): number {
  return planTierRanks[left] - planTierRanks[right];
}

export function downgradeTargetFor(planTier: PlanTier): PlanTier {
  if (planTier === 'premium') {
    return 'lite';
  }

  return 'free';
}
