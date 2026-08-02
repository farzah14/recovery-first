import type { BillingProductCode } from '@/domain/billing/product-catalog';
import type { EntitlementStatus } from '@/domain/subscriptions/entitlement';

export type NormalizedBillingEvent = Readonly<{
  provider: 'paddle';
  eventId: string;
  eventType: string;
  occurredAt: Date;
  customerId: string;
  subscriptionId: string;
  userId: string;
  productCode: BillingProductCode;
  status: EntitlementStatus;
  validFrom: Date;
  validUntil: Date | null;
  cancelAtPeriodEnd: boolean;
  providerPayloadHash: string;
}>;
