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
      const parsed = entitlementSnapshotSchema.safeParse(await dependencies.project(event));
      if (!parsed.success) {
        throw new Error('Invalid entitlement projection');
      }

      return {
        ...parsed.data,
      };
    },
  };
}
