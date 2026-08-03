import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type { NormalizedBillingEvent } from '@/domain/billing/normalized-event';
import { createBillingEntitlementProjector } from '@/features/entitlements/billing-entitlement-projector';

const event: NormalizedBillingEvent = {
  provider: 'paddle',
  eventId: 'evt_project_01',
  eventType: 'subscription_created',
  occurredAt: new Date('2026-08-03T00:00:00.000Z'),
  customerId: 'ctm_project_01',
  subscriptionId: 'sub_project_01',
  userId: '14000000-0000-4000-8000-000000000001',
  productCode: 'premium_monthly',
  status: 'active',
  validFrom: new Date('2026-08-03T00:00:00.000Z'),
  validUntil: new Date('2026-09-03T00:00:00.000Z'),
  cancelAtPeriodEnd: false,
  providerPayloadHash: 'hash_project_01',
};

describe('billing entitlement projector', () => {
  it('projects only a normalized event and returns a bounded entitlement snapshot', async () => {
    const project = vi.fn().mockResolvedValue({
      userId: event.userId,
      subscriptionId: event.subscriptionId,
      productCode: event.productCode,
      status: event.status,
      validFrom: event.validFrom,
      validUntil: event.validUntil,
      revision: 1,
    });
    const projector = createBillingEntitlementProjector({ project });

    await expect(projector.project(event)).resolves.toEqual({
      userId: event.userId,
      subscriptionId: event.subscriptionId,
      productCode: event.productCode,
      status: event.status,
      validFrom: event.validFrom,
      validUntil: event.validUntil,
      revision: 1,
    });

    expect(project).toHaveBeenCalledWith(event);
    expect(project).toHaveBeenCalledTimes(1);
  });

  it('rejects an unbounded SQL response instead of exposing provider data', async () => {
    const project = vi.fn().mockResolvedValue({
      userId: event.userId,
      subscriptionId: event.subscriptionId,
      productCode: event.productCode,
      status: event.status,
      validFrom: event.validFrom,
      validUntil: event.validUntil,
      revision: 1,
      providerPayloadHash: event.providerPayloadHash,
    });
    const projector = createBillingEntitlementProjector({ project });

    await expect(projector.project(event)).rejects.toThrow('Invalid entitlement projection');
  });
});
