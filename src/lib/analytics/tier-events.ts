import type { PlanTier } from '@/domain/shared/plan-tier';

export const tierAnalyticsEventNames = [
  'account_signed_in',
  'entitlement_resolved',
  'checkout_started',
  'checkout_completed',
  'tier_downgraded',
  'legacy_data_transfer',
] as const;

export type TierAnalyticsEventName = (typeof tierAnalyticsEventNames)[number];

export const tierAnalyticsOutcomes = [
  'resolved',
  'pending',
  'unavailable',
  'started',
  'completed',
  'failed',
  'over_limit_paused',
  'transferred',
  'exported',
  'cleared',
] as const;

export type TierAnalyticsOutcome = (typeof tierAnalyticsOutcomes)[number];

export interface TierAnalyticsEvent {
  name: TierAnalyticsEventName;
  tier: PlanTier;
  previousTier?: PlanTier;
  outcome?: TierAnalyticsOutcome;
}

export function createTierAnalyticsEvent(input: TierAnalyticsEvent): TierAnalyticsEvent {
  return {
    name: input.name,
    tier: input.tier,
    ...(input.previousTier ? { previousTier: input.previousTier } : {}),
    ...(input.outcome ? { outcome: input.outcome } : {}),
  };
}
