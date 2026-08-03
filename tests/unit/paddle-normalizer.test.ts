import { describe, expect, it } from 'vitest';

import {
  BillingNormalizationError,
  normalizePaddleSubscriptionEvent,
  type PaddlePriceIds,
} from '@/lib/payments/paddle-normalizer';

const priceIds: PaddlePriceIds = {
  lite_monthly: 'pri_lite_monthly',
  lite_annual: 'pri_lite_annual',
  premium_monthly: 'pri_premium_monthly',
  premium_annual: 'pri_premium_annual',
};

const baseData = {
  id: 'sub_01',
  status: 'active',
  customer_id: 'ctm_01',
  custom_data: {
    userId: '12000000-0000-4000-8000-000000000001',
    checkoutAttemptId: 'attempt_01',
  },
  items: [
    {
      price: {
        id: 'pri_premium_monthly',
      },
    },
  ],
  current_billing_period: {
    starts_at: '2026-08-01T00:00:00.000Z',
    ends_at: '2026-09-01T00:00:00.000Z',
  },
  scheduled_change: null,
  canceled_at: null,
};

function event(eventType: string, data: Record<string, unknown> = baseData) {
  return {
    event_id: `evt_${eventType}`,
    event_type: eventType,
    occurred_at: '2026-08-03T00:00:00.000Z',
    data,
  };
}

describe('Paddle billing normalizer', () => {
  it('maps a subscription event to the internal entitlement contract', () => {
    const normalized = normalizePaddleSubscriptionEvent(event('subscription.created'), {
      priceIds,
      providerPayloadHash: 'hash_01',
    });

    expect(normalized).toMatchObject({
      provider: 'paddle',
      eventId: 'evt_subscription.created',
      eventType: 'subscription_created',
      customerId: 'ctm_01',
      subscriptionId: 'sub_01',
      userId: '12000000-0000-4000-8000-000000000001',
      productCode: 'premium_monthly',
      status: 'active',
      cancelAtPeriodEnd: false,
      providerPayloadHash: 'hash_01',
    });
    expect(normalized.occurredAt).toBeInstanceOf(Date);
    expect(normalized.validFrom).toEqual(new Date('2026-08-01T00:00:00.000Z'));
    expect(normalized.validUntil).toEqual(new Date('2026-09-01T00:00:00.000Z'));
  });

  it.each([
    ['subscription.trialing', 'trial_active'],
    ['subscription.activated', 'active'],
    ['subscription.past_due', 'past_due'],
    ['subscription.paused', 'revoked'],
  ] as const)('maps %s to %s without leaking the provider event name', (eventType, status) => {
    const normalized = normalizePaddleSubscriptionEvent(
      event(eventType, {
        ...baseData,
        status: eventType === 'subscription.trialing' ? 'trialing' : baseData.status,
      }),
      { priceIds, providerPayloadHash: 'hash_02' },
    );

    expect(normalized.status).toBe(status);
    expect(normalized.eventType).not.toBe(eventType);
  });

  it('preserves the entitlement window for a scheduled cancellation', () => {
    const normalized = normalizePaddleSubscriptionEvent(
      event('subscription.updated', {
        ...baseData,
        scheduled_change: {
          action: 'cancel',
          effective_at: '2026-09-01T00:00:00.000Z',
        },
      }),
      { priceIds, providerPayloadHash: 'hash_03' },
    );

    expect(normalized).toMatchObject({
      status: 'cancelled',
      cancelAtPeriodEnd: true,
    });
    expect(normalized.validUntil).toEqual(new Date('2026-09-01T00:00:00.000Z'));
  });

  it('maps refund and administrative revocation events to non-granting states', () => {
    const refunded = normalizePaddleSubscriptionEvent(
      event('adjustment.created', { ...baseData, action: 'refund', subscription_id: 'sub_01' }),
      { priceIds, providerPayloadHash: 'hash_04' },
    );
    const revoked = normalizePaddleSubscriptionEvent(event('subscription.paused', baseData), {
      priceIds,
      providerPayloadHash: 'hash_05',
    });

    expect(refunded.status).toBe('refunded');
    expect(revoked.status).toBe('revoked');
  });

  it.each([
    ['transaction.payment_failed', 'past_due'],
    ['transaction.past_due', 'past_due'],
    ['transaction.completed', 'active'],
  ] as const)('maps %s to %s for a subscription transaction', (eventType, status) => {
    const normalized = normalizePaddleSubscriptionEvent(
      event(eventType, {
        ...baseData,
        id: 'txn_01',
        subscription_id: 'sub_01',
        status: eventType === 'transaction.payment_failed' ? 'past_due' : 'completed',
      }),
      { priceIds, providerPayloadHash: 'hash_transaction' },
    );

    expect(normalized.subscriptionId).toBe('sub_01');
    expect(normalized.status).toBe(status);
  });

  it.each([
    ['chargeback', 'revoked'],
    ['chargeback_warning', 'past_due'],
    ['chargeback_reverse', 'active'],
  ] as const)('maps the %s adjustment to %s', (action, status) => {
    const normalized = normalizePaddleSubscriptionEvent(
      event('adjustment.created', {
        ...baseData,
        subscription_id: 'sub_01',
        action,
      }),
      { priceIds, providerPayloadHash: 'hash_chargeback' },
    );

    expect(normalized.subscriptionId).toBe('sub_01');
    expect(normalized.status).toBe(status);
  });

  it.each([
    ['missing user ID', { custom_data: {} }],
    ['unknown price ID', { items: [{ price: { id: 'pri_unknown' } }] }],
    ['missing subscription ID', { id: undefined }],
    ['invalid occurrence timestamp', { occurred_at: 'not-a-date' }],
  ])('rejects %s before producing an entitlement event', (label, override) => {
    const input =
      label === 'invalid occurrence timestamp'
        ? { ...event('subscription.created'), ...override }
        : event('subscription.created', { ...baseData, ...override });

    expect(() =>
      normalizePaddleSubscriptionEvent(input, { priceIds, providerPayloadHash: 'hash_invalid' }),
    ).toThrow(BillingNormalizationError);
  });
});
