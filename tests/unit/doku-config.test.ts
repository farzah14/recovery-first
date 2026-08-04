import { describe, expect, it } from 'vitest';

import { createDokuBillingConfig } from '@/lib/payments/doku-config';

const validEnvironment = {
  BILLING_PROVIDER: 'doku',
  DOKU_ENVIRONMENT: 'sandbox',
  DOKU_CLIENT_ID: 'MCH-TEST-01',
  DOKU_SECRET_KEY: 'secret-key',
  DOKU_API_BASE_URL: 'https://api-sandbox.doku.com',
  DOKU_NOTIFICATION_URL: 'https://example.test/api/billing/webhook',
  DOKU_CURRENCY: 'IDR',
  DOKU_LITE_MONTHLY_AMOUNT: '49000',
  DOKU_LITE_ANNUAL_AMOUNT: '490000',
  DOKU_PREMIUM_MONTHLY_AMOUNT: '99000',
  DOKU_PREMIUM_ANNUAL_AMOUNT: '990000',
  DOKU_CHECKOUT_PAYMENT_METHOD_TYPES: 'VIRTUAL_ACCOUNT_BCA,QRIS,EMONEY_OVO,CREDIT_CARD',
  DOKU_RECURRING_METHODS: 'DIRECT_DEBIT_BRI,EMONEY_OVO,CREDIT_CARD',
  BILLING_WEBHOOK_RAW_RETENTION_DAYS: '30',
  BILLING_RECONCILIATION_BATCH_SIZE: '100',
} as const;

describe('DOKU billing configuration', () => {
  it('parses IDR prices and the configured Checkout and recurring methods', () => {
    expect(createDokuBillingConfig(validEnvironment)).toEqual({
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
    });
  });

  it('rejects non-IDR currency and non-positive rupiah amounts', () => {
    expect(() => createDokuBillingConfig({ ...validEnvironment, DOKU_CURRENCY: 'USD' })).toThrow();

    expect(() =>
      createDokuBillingConfig({ ...validEnvironment, DOKU_PREMIUM_MONTHLY_AMOUNT: '0' }),
    ).toThrow();
  });

  it('rejects an API URL that is not HTTPS', () => {
    expect(() =>
      createDokuBillingConfig({ ...validEnvironment, DOKU_API_BASE_URL: 'http://localhost:8080' }),
    ).toThrow();
  });
});
