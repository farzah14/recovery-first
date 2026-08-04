import type { BillingProductCode } from '@/domain/billing/product-catalog';
import { resolveTierFromEntitlement } from '@/domain/billing/product-catalog';
import type { EntitlementStatus } from '@/domain/subscriptions/entitlement';

export type BillingStatus = EntitlementStatus | 'failed' | 'none' | 'processing';

export type SubscriptionSnapshot = Readonly<{
  status: BillingStatus;
  planCode: BillingProductCode | null;
  premium: boolean;
  validUntil: string | null;
  cancelAtPeriodEnd: boolean;
  checkoutAttemptStatus: string | null;
  revision: number | null;
}>;

export type SubscriptionEntitlementRecord = Readonly<{
  productCode: string;
  status: EntitlementStatus;
  validFrom: string;
  validUntil: string | null;
  cancelAtPeriodEnd: boolean;
  revision: number;
}>;

function isBillingProductCode(value: string): value is BillingProductCode {
  return [
    'free',
    'lite',
    'lite_monthly',
    'lite_annual',
    'premium',
    'premium_monthly',
    'premium_annual',
  ].includes(value);
}

export function buildSubscriptionSnapshot(
  input: Readonly<{
    now: Date;
    checkoutAttemptStatus: string | null;
    entitlement: SubscriptionEntitlementRecord | null;
  }>,
): SubscriptionSnapshot {
  if (!input.entitlement) {
    return {
      status:
        input.checkoutAttemptStatus === 'failed' || input.checkoutAttemptStatus === 'expired'
          ? 'failed'
          : input.checkoutAttemptStatus
            ? 'processing'
            : 'none',
      planCode: null,
      premium: false,
      validUntil: null,
      cancelAtPeriodEnd: false,
      checkoutAttemptStatus: input.checkoutAttemptStatus,
      revision: null,
    };
  }

  const planCode = isBillingProductCode(input.entitlement.productCode)
    ? input.entitlement.productCode
    : null;
  const premium =
    planCode !== null &&
    resolveTierFromEntitlement({
      productCode: planCode,
      status: input.entitlement.status,
      validFrom: new Date(input.entitlement.validFrom),
      validUntil: input.entitlement.validUntil ? new Date(input.entitlement.validUntil) : null,
      now: input.now,
    }) === 'premium';

  return {
    status: input.entitlement.status,
    planCode,
    premium,
    validUntil: input.entitlement.validUntil,
    cancelAtPeriodEnd: input.entitlement.cancelAtPeriodEnd,
    checkoutAttemptStatus: input.checkoutAttemptStatus,
    revision: input.entitlement.revision,
  };
}
