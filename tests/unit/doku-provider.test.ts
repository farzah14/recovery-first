import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type { DokuBillingConfig } from '@/lib/payments/doku-config';
import { createDokuRequestHeaders } from '@/lib/payments/doku-client';
import { createDokuProvider, type DokuClient } from '@/lib/payments/doku-provider';

const config: DokuBillingConfig = {
  provider: 'doku',
  environment: 'sandbox',
  clientId: 'MCH-TEST-01',
  secretKey: 'secret-key',
  apiBaseUrl: 'https://api-sandbox.doku.com',
  notificationUrl: 'https://example.test/api/billing/webhook',
  currency: 'IDR',
  amounts: {
    lite_monthly: 49000,
    lite_annual: 490000,
    premium_monthly: 99000,
    premium_annual: 990000,
  },
  checkoutPaymentMethodTypes: ['VIRTUAL_ACCOUNT_BCA', 'QRIS', 'EMONEY_OVO', 'CREDIT_CARD'],
  recurringMethods: ['DIRECT_DEBIT_BRI', 'EMONEY_OVO', 'CREDIT_CARD'],
  webhookRawRetentionDays: 30,
  reconciliationBatchSize: 100,
};

describe('DOKU provider', () => {
  it('creates an IDR Checkout session with the configured payment methods', async () => {
    const client: DokuClient = {
      post: vi.fn().mockResolvedValue({
        body: {
          message: ['SUCCESS'],
          response: {
            order: { invoice_number: 'TH-premium-monthly-attempt-01', session_id: 'session-01' },
            payment: { url: 'https://sandbox.doku.com/checkout-link/session-01' },
          },
        },
        headers: new Headers(),
      }),
      get: vi.fn(),
    };
    const provider = createDokuProvider({
      client,
      config,
      createInvoiceNumber: () => 'TH-premium-monthly-attempt-01',
    });

    await expect(
      provider.createCheckout({
        userId: 'user-01',
        userEmail: 'user@example.test',
        checkoutAttemptId: 'attempt-01',
        productCode: 'premium_monthly',
        providerPriceId: '99000',
        returnUrl: 'https://example.test/billing/return?attempt=attempt-01',
      }),
    ).resolves.toEqual({
      providerTransactionId: 'session-01',
      checkoutUrl: 'https://sandbox.doku.com/checkout-link/session-01',
    });

    expect(client.post).toHaveBeenCalledWith('/checkout/v1/payment', {
      order: {
        amount: 99000,
        currency: 'IDR',
        invoice_number: 'TH-premium-monthly-attempt-01',
        callback_url: 'https://example.test/billing/return?attempt=attempt-01',
        callback_url_result: 'https://example.test/billing/return?attempt=attempt-01',
        auto_redirect: true,
      },
      payment: {
        payment_method_types: ['VIRTUAL_ACCOUNT_BCA', 'QRIS', 'EMONEY_OVO', 'CREDIT_CARD'],
      },
      customer: { id: 'user-01', email: 'user@example.test' },
      additional_info: { product_code: 'premium_monthly', checkout_attempt_id: 'attempt-01' },
    });
  });

  it('rejects a provider response without a safe hosted Checkout URL', async () => {
    const client: DokuClient = {
      post: vi.fn().mockResolvedValue({
        body: {
          response: {
            order: { session_id: 'session-01' },
            payment: { url: 'http://attacker.test/payment' },
          },
        },
        headers: new Headers(),
      }),
      get: vi.fn(),
    };
    const provider = createDokuProvider({ client, config });

    await expect(
      provider.createCheckout({
        userId: 'user-01',
        userEmail: 'user@example.test',
        checkoutAttemptId: 'attempt-01',
        productCode: 'lite_monthly',
        providerPriceId: '49000',
        returnUrl: 'https://example.test/billing/return?attempt=attempt-01',
      }),
    ).rejects.toThrow('DOKU Checkout URL is invalid');
  });

  it('verifies the raw notification body before normalizing it', async () => {
    const body = JSON.stringify({
      order: { invoice_number: 'TH-PM-attempt-01', amount: 99000 },
      customer: { id: 'user-01' },
      additional_info: { product_code: 'premium_monthly', recurring: true },
      transaction: { status: 'SUCCESS', date: '2026-08-04T00:00:00.000Z' },
    });
    const input = {
      clientId: config.clientId,
      secretKey: config.secretKey,
      requestId: 'request-notification-01',
      requestTimestamp: '2026-08-04T00:00:00Z',
      requestTarget: '/api/billing/webhook',
      body,
    } as const;
    const headers = createDokuRequestHeaders(input);
    const client: DokuClient = { post: vi.fn(), get: vi.fn() };
    const provider = createDokuProvider({ client, config });

    await expect(
      provider.verifyWebhook({
        rawBody: body,
        signature: headers.Signature,
        headers: {
          'Client-Id': config.clientId,
          'Request-Id': input.requestId,
          'Request-Timestamp': input.requestTimestamp,
          'Request-Target': input.requestTarget,
          Digest: headers.Digest ?? '',
        },
      }),
    ).resolves.toMatchObject({ provider: 'doku', status: 'active' });
  });
});
