import { z } from 'zod';

import type { NormalizedBillingEvent } from '@/domain/billing/normalized-event';
import { entitlementStatuses, type EntitlementStatus } from '@/domain/subscriptions/entitlement';
import { billingProductCodes, type BillingProductCode } from '@/domain/billing/product-catalog';

const entitlementSnapshotSchema = z
  .object({
    userId: z.string().uuid(),
    subscriptionId: z.string().min(1),
    productCode: z.enum(billingProductCodes),
    status: z.enum(entitlementStatuses),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date().nullable(),
    revision: z.number().int().positive(),
  })
  .strict();

const normalizedBillingEventSchema = z
  .object({
    provider: z.enum(['paddle', 'doku']),
    eventId: z.string().min(1),
    eventType: z.string().min(1),
    occurredAt: z.coerce.date(),
    customerId: z.string().min(1),
    subscriptionId: z.string().min(1),
    userId: z.string().uuid(),
    productCode: z.enum(billingProductCodes),
    status: z.enum(entitlementStatuses),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date().nullable(),
    cancelAtPeriodEnd: z.boolean(),
    providerPayloadHash: z.string().min(1),
  })
  .strict();

export type EntitlementSnapshot = Readonly<{
  userId: string;
  subscriptionId: string;
  productCode: BillingProductCode;
  status: EntitlementStatus;
  validFrom: Date;
  validUntil: Date | null;
  revision: number;
}>;

type BillingEntitlementProjectorDependencies = Readonly<{
  project: (event: NormalizedBillingEvent) => Promise<unknown>;
}>;

export function createBillingEntitlementProjector(
  dependencies: BillingEntitlementProjectorDependencies,
) {
  return {
    async project(event: NormalizedBillingEvent): Promise<EntitlementSnapshot> {
      const normalized = normalizedBillingEventSchema.safeParse(event);
      if (!normalized.success) {
        throw new Error('Invalid normalized billing event');
      }

      const parsed = entitlementSnapshotSchema.safeParse(
        await dependencies.project(normalized.data),
      );
      if (!parsed.success) {
        throw new Error('Invalid entitlement projection');
      }

      return {
        ...parsed.data,
      };
    },
  };
}
