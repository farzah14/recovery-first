import type { PlanTier } from '@/domain/shared/plan-tier';
import type { EntitlementStatus } from '@/domain/subscriptions/entitlement';

export const billingProductCodes = [
  'free',
  'lite',
  'lite_monthly',
  'lite_annual',
  'premium',
  'premium_monthly',
  'premium_annual',
] as const;

export type BillingProductCode = (typeof billingProductCodes)[number];
export type BillingInterval = 'monthly' | 'annual' | null;

export type BillingProduct = Readonly<{
  code: BillingProductCode;
  tier: PlanTier;
  interval: BillingInterval;
}>;

const billingProducts: Readonly<Record<BillingProductCode, BillingProduct>> = {
  free: { code: 'free', tier: 'free', interval: null },
  lite: { code: 'lite', tier: 'lite', interval: null },
  lite_monthly: { code: 'lite_monthly', tier: 'lite', interval: 'monthly' },
  lite_annual: { code: 'lite_annual', tier: 'lite', interval: 'annual' },
  premium: { code: 'premium', tier: 'premium', interval: null },
  premium_monthly: { code: 'premium_monthly', tier: 'premium', interval: 'monthly' },
  premium_annual: { code: 'premium_annual', tier: 'premium', interval: 'annual' },
};

const activeEntitlementStatuses: ReadonlySet<EntitlementStatus> = new Set([
  'trial_active',
  'trial_cancelled',
  'active',
  'grace_period',
  'cancelled',
  'past_due',
]);

export function billingProductForCode(code: string): BillingProduct | undefined {
  return code in billingProducts ? billingProducts[code as BillingProductCode] : undefined;
}

export function resolveTierFromEntitlement(input: {
  productCode: string;
  status: EntitlementStatus;
  validFrom?: Date;
  validUntil?: Date | null;
  now: Date;
}): PlanTier {
  if (!activeEntitlementStatuses.has(input.status)) {
    return 'free';
  }

  if (input.validFrom && input.now.getTime() < input.validFrom.getTime()) {
    return 'free';
  }

  if (input.validUntil && input.now.getTime() >= input.validUntil.getTime()) {
    return 'free';
  }

  return billingProductForCode(input.productCode)?.tier ?? 'free';
}
