export const planTiers = ['guest', 'free', 'premium'] as const;

export type PlanTier = (typeof planTiers)[number];

export function isPlanTier(value: string): value is PlanTier {
  return planTiers.includes(value as PlanTier);
}
