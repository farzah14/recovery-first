import { describe, expect, it } from 'vitest';

import { normalizeDokuNotification } from '@/lib/payments/doku-normalizer';

const base = {
  order: { invoice_number: 'TH-PM-attempt-01', amount: 99000 },
  customer: { id: 'user-01', email: 'user@example.test' },
  additional_info: { product_code: 'premium_monthly', recurring: true },
  transaction: {
    status: 'SUCCESS',
    date: '2026-08-04T00:00:00.000Z',
    original_request_id: 'request-payment-01',
  },
};

describe('DOKU notification normalizer', () => {
  it('maps a successful recurring payment into the provider-neutral event contract', () => {
    expect(
      normalizeDokuNotification(base, {
        requestId: 'request-notification-01',
        providerPayloadHash: 'hash-01',
      }),
    ).toMatchObject({
      provider: 'doku',
      eventId: 'request-notification-01',
      eventType: 'payment_succeeded',
      customerId: 'user-01',
      subscriptionId: 'TH-PM-attempt-01',
      userId: 'user-01',
      productCode: 'premium_monthly',
      status: 'active',
      cancelAtPeriodEnd: false,
      providerPayloadHash: 'hash-01',
    });
  });

  it('maps a failed recurring payment to past_due without granting a new period', () => {
    const event = normalizeDokuNotification(
      {
        ...base,
        transaction: { ...base.transaction, status: 'FAILED' },
      },
      { requestId: 'request-notification-02', providerPayloadHash: 'hash-02' },
    );

    expect(event.status).toBe('past_due');
    expect(event.eventType).toBe('payment_failed');
  });

  it('rejects a notification without an account, product, invoice, or timestamp', () => {
    expect(() =>
      normalizeDokuNotification(
        { order: {}, transaction: { status: 'SUCCESS' } },
        { requestId: 'request-03', providerPayloadHash: 'hash-03' },
      ),
    ).toThrow();
  });
});
