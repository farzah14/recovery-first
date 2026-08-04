import { describe, expect, it } from 'vitest';

import { createBillingConfig } from '@/lib/payments/billing-config';

const validEnvironment = {
  BILLING_PROVIDER: 'paddle',
  PADDLE_ENVIRONMENT: 'sandbox',
  PADDLE_API_KEY: 'test_api_key',
  PADDLE_NOTIFICATION_WEBHOOK_SECRET: 'test_webhook_secret',
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: 'test_client_token',
  PADDLE_LITE_MONTHLY_PRICE_ID: 'pri_lite_monthly',
  PADDLE_LITE_ANNUAL_PRICE_ID: 'pri_lite_annual',
  PADDLE_PREMIUM_MONTHLY_PRICE_ID: 'pri_premium_monthly',
  PADDLE_PREMIUM_ANNUAL_PRICE_ID: 'pri_premium_annual',
  BILLING_WEBHOOK_RAW_RETENTION_DAYS: '30',
  BILLING_RECONCILIATION_BATCH_SIZE: '100',
} as const;

describe('billing configuration', () => {
  it('parses the provider configuration and maps every paid product to a server price ID', () => {
    expect(createBillingConfig(validEnvironment)).toEqual({
      provider: 'paddle',
      environment: 'sandbox',
      apiKey: 'test_api_key',
      webhookSecret: 'test_webhook_secret',
      clientToken: 'test_client_token',
      priceIds: {
        lite_monthly: 'pri_lite_monthly',
        lite_annual: 'pri_lite_annual',
        premium_monthly: 'pri_premium_monthly',
        premium_annual: 'pri_premium_annual',
      },
      webhookRawRetentionDays: 30,
      reconciliationBatchSize: 100,
    });
  });

  it('rejects missing secrets, invalid price IDs, and unsafe retention settings', () => {
    expect(() =>
      createBillingConfig({
        ...validEnvironment,
        PADDLE_API_KEY: '',
      }),
    ).toThrow();

    expect(() =>
      createBillingConfig({
        ...validEnvironment,
        PADDLE_PREMIUM_ANNUAL_PRICE_ID: 'price_not_paddle',
      }),
    ).toThrow();

    expect(() =>
      createBillingConfig({
        ...validEnvironment,
        BILLING_WEBHOOK_RAW_RETENTION_DAYS: '91',
      }),
    ).toThrow();
  });
});
