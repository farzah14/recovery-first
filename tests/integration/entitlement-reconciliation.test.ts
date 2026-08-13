import { describe, expect, it, vi } from 'vitest';

import type { NormalizedBillingEvent } from '@/domain/billing/normalized-event';
import { createEntitlementRefreshService } from '@/features/subscriptions/entitlement-refresh-service';
import { handleRefreshRequest } from '@/app/api/billing/refresh/handler';
import { runScheduledSubscriptionReconciliation } from '@/server/billing/scheduled-reconciliation';

const userId = '12000000-0000-4000-8000-000000000001';
const otherUserId = '12000000-0000-4000-8000-000000000002';

const storedSubscription = {
  userId,
  providerCustomerId: 'ctm_01',
  providerSubscriptionId: 'sub_01',
  planCode: 'premium_monthly' as const,
  normalizedStatus: 'active' as const,
  currentPeriodEnd: '2026-09-03T00:00:00.000Z',
  updatedAt: '2026-08-03T00:00:00.000Z',
};

const normalizedEvent: NormalizedBillingEvent = {
  provider: 'paddle',
  eventId: 'reconciliation:sub_01:2026-08-03T00:00:01.000Z',
  eventType: 'subscription.updated',
  occurredAt: new Date('2026-08-03T00:00:01.000Z'),
  customerId: 'ctm_01',
  subscriptionId: 'sub_01',
  userId,
  productCode: 'premium_monthly',
  status: 'active',
  validFrom: new Date('2026-08-03T00:00:00.000Z'),
  validUntil: new Date('2026-09-03T00:00:00.000Z'),
  cancelAtPeriodEnd: false,
  providerPayloadHash: 'hash',
};

describe('authoritative entitlement reconciliation', () => {
  it('fetches by the stored subscription ID and sends the normalized event to the shared processor', async () => {
    const fetchSubscription = vi.fn().mockResolvedValue(normalizedEvent);
    const processEvent = vi
      .fn()
      .mockResolvedValue({ result: 'applied', eventId: normalizedEvent.eventId });
    const auditRefresh = vi.fn().mockResolvedValue(undefined);
    const service = createEntitlementRefreshService({
      readStoredSubscription: vi.fn().mockResolvedValue(storedSubscription),
      fetchSubscription,
      processEvent,
      auditRefresh,
    });

    await expect(service.refresh(userId)).resolves.toEqual({
      kind: 'applied',
      eventId: normalizedEvent.eventId,
    });
    expect(fetchSubscription).toHaveBeenCalledWith('sub_01');
    expect(processEvent).toHaveBeenCalledWith(normalizedEvent);
    expect(auditRefresh).toHaveBeenCalledWith({
      userId,
      providerSubscriptionId: 'sub_01',
      result: 'applied',
    });
  });

  it('rejects a provider event that belongs to another user or subscription', async () => {
    const service = createEntitlementRefreshService({
      readStoredSubscription: vi.fn().mockResolvedValue(storedSubscription),
      fetchSubscription: vi.fn().mockResolvedValue({ ...normalizedEvent, userId: otherUserId }),
      processEvent: vi.fn(),
      auditRefresh: vi.fn(),
    });

    await expect(service.refresh(userId)).rejects.toThrow('reconciliation_ownership_mismatch');
  });

  it('preserves the processor result for stale and repeated provider state', async () => {
    const processEvent = vi
      .fn()
      .mockResolvedValueOnce({ result: 'stale', eventId: normalizedEvent.eventId })
      .mockResolvedValueOnce({ result: 'duplicate', eventId: normalizedEvent.eventId });
    const service = createEntitlementRefreshService({
      readStoredSubscription: vi.fn().mockResolvedValue(storedSubscription),
      fetchSubscription: vi.fn().mockResolvedValue(normalizedEvent),
      processEvent,
      auditRefresh: vi.fn().mockResolvedValue(undefined),
    });

    await expect(service.refresh(userId)).resolves.toEqual({
      kind: 'stale',
      eventId: normalizedEvent.eventId,
    });
    await expect(service.refresh(userId)).resolves.toEqual({
      kind: 'duplicate',
      eventId: normalizedEvent.eventId,
    });
  });

  it('returns none when the account has no stored subscription', async () => {
    const fetchSubscription = vi.fn();
    const service = createEntitlementRefreshService({
      readStoredSubscription: vi.fn().mockResolvedValue(null),
      fetchSubscription,
      processEvent: vi.fn(),
      auditRefresh: vi.fn(),
    });

    await expect(service.refresh(userId)).resolves.toEqual({ kind: 'none' });
    expect(fetchSubscription).not.toHaveBeenCalled();
  });
});

describe('manual entitlement refresh route', () => {
  it('requires authentication and rejects cross-origin requests before refresh', async () => {
    const refresh = vi.fn();
    const response = await handleRefreshRequest(
      new Request('https://tracker.example/api/billing/refresh', {
        method: 'POST',
        headers: { origin: 'https://evil.example' },
      }),
      {
        getUser: vi.fn().mockResolvedValue(null),
        refresh,
        readSnapshot: vi.fn(),
        isAllowed: vi.fn().mockReturnValue(true),
      },
    );

    expect(response.status).toBe(403);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('uses only the authenticated account and returns a bounded refreshed snapshot', async () => {
    const refresh = vi.fn().mockResolvedValue({ kind: 'applied', eventId: 'reconciliation:event' });
    const readSnapshot = vi.fn().mockResolvedValue({
      status: 'active',
      planCode: 'premium_monthly',
      premium: true,
      validUntil: '2026-09-03T00:00:00.000Z',
      cancelAtPeriodEnd: false,
      checkoutAttemptStatus: null,
      revision: 4,
    });
    const response = await handleRefreshRequest(
      new Request('https://tracker.example/api/billing/refresh', {
        method: 'POST',
        headers: { origin: 'https://tracker.example', 'content-type': 'application/json' },
        body: JSON.stringify({ providerSubscriptionId: 'sub_other_user' }),
      }),
      {
        getUser: vi.fn().mockResolvedValue({ id: userId, email: null }),
        refresh,
        readSnapshot,
        isAllowed: vi.fn().mockReturnValue(true),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({
      status: 'active',
      planCode: 'premium_monthly',
      premium: true,
      validUntil: '2026-09-03T00:00:00.000Z',
      cancelAtPeriodEnd: false,
      checkoutAttemptStatus: null,
      revision: 4,
    });
    expect(refresh).toHaveBeenCalledWith(userId);
    expect(readSnapshot).toHaveBeenCalledWith(userId);
  });

  it('returns rate-limit status without calling the provider refresh', async () => {
    const refresh = vi.fn();
    const response = await handleRefreshRequest(
      new Request('https://tracker.example/api/billing/refresh', { method: 'POST' }),
      {
        getUser: vi.fn().mockResolvedValue({ id: userId, email: null }),
        refresh,
        readSnapshot: vi.fn(),
        isAllowed: vi.fn().mockReturnValue(false),
      },
    );

    expect(response.status).toBe(429);
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe('scheduled reconciliation entrypoint', () => {
  it('uses a bounded cursor batch and returns safe retry codes for transient failures', async () => {
    const listEligible = vi.fn().mockResolvedValue({
      subscriptions: [{ userId }, { userId: otherUserId }],
      nextCursor: null,
    });
    const refresh = vi
      .fn()
      .mockResolvedValueOnce({ kind: 'applied', eventId: 'reconciliation:one' })
      .mockRejectedValueOnce(new Error('provider_timeout'));

    await expect(
      runScheduledSubscriptionReconciliation({ listEligible, refresh }, { batchSize: 2 }),
    ).resolves.toEqual({
      processed: 1,
      retried: [{ userId: otherUserId, code: 'provider_unavailable' }],
      nextCursor: null,
    });
    expect(listEligible).toHaveBeenCalledWith({ afterUserId: null, batchSize: 2 });
    expect(refresh).toHaveBeenNthCalledWith(1, userId);
    expect(refresh).toHaveBeenNthCalledWith(2, otherUserId);
  });
});
