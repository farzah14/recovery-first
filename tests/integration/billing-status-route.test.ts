import { describe, expect, it, vi } from 'vitest';

import { handleBillingStatusRequest } from '@/app/api/billing/status/handler';

describe('billing status route', () => {
  it('rejects a missing or malformed attempt identifier', async () => {
    const response = await handleBillingStatusRequest(
      new Request('https://tracker.example/api/billing/status?attempt=not-a-uuid'),
      { getUser: vi.fn(), readSnapshot: vi.fn() },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'attempt_invalid' });
  });

  it('requires an authenticated account before reading billing state', async () => {
    const readSnapshot = vi.fn();
    const response = await handleBillingStatusRequest(
      new Request(
        'https://tracker.example/api/billing/status?attempt=550e8400-e29b-41d4-a716-446655440000',
      ),
      { getUser: vi.fn().mockResolvedValue(null), readSnapshot },
    );

    expect(response.status).toBe(401);
    expect(readSnapshot).not.toHaveBeenCalled();
  });

  it('returns only a bounded authoritative snapshot with no-store caching', async () => {
    const readSnapshot = vi.fn().mockResolvedValue({
      status: 'processing',
      planCode: null,
      premium: false,
      validUntil: null,
      cancelAtPeriodEnd: false,
      checkoutAttemptStatus: 'opened',
      revision: null,
    });
    const response = await handleBillingStatusRequest(
      new Request(
        'https://tracker.example/api/billing/status?attempt=550e8400-e29b-41d4-a716-446655440000',
      ),
      {
        getUser: vi.fn().mockResolvedValue({
          id: '12000000-0000-4000-8000-000000000001',
          email: 'person@example.com',
        }),
        readSnapshot,
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({
      status: 'processing',
      planCode: null,
      premium: false,
      validUntil: null,
      cancelAtPeriodEnd: false,
      checkoutAttemptStatus: 'opened',
      revision: null,
    });
    expect(readSnapshot).toHaveBeenCalledWith(
      '12000000-0000-4000-8000-000000000001',
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('does not expose provider identifiers or raw payment data', async () => {
    const readSnapshot = vi.fn().mockResolvedValue({
      status: 'active',
      planCode: 'premium_monthly',
      premium: true,
      validUntil: '2026-09-03T00:00:00.000Z',
      cancelAtPeriodEnd: false,
      checkoutAttemptStatus: 'confirmed',
      revision: 2,
      providerSubscriptionId: 'sub_secret',
      rawPayload: '{"secret":true}',
    });
    const response = await handleBillingStatusRequest(
      new Request(
        'https://tracker.example/api/billing/status?attempt=550e8400-e29b-41d4-a716-446655440000',
      ),
      {
        getUser: vi
          .fn()
          .mockResolvedValue({ id: '12000000-0000-4000-8000-000000000001', email: null }),
        readSnapshot,
      },
    );

    const body = await response.json();
    expect(body).not.toHaveProperty('providerSubscriptionId');
    expect(body).not.toHaveProperty('rawPayload');
  });
});
