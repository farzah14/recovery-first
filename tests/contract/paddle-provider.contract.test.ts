import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type { BillingConfig } from '@/lib/payments/billing-config';
import { createPaddleProvider, type PaddleClient } from '@/lib/payments/paddle-provider';

const config: BillingConfig = {
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
};

const subscription = {
  id: 'sub_01',
  status: 'active',
  customer_id: 'ctm_01',
  updated_at: '2026-08-03T00:00:00.000Z',
  custom_data: { userId: '12000000-0000-4000-8000-000000000001' },
  items: [{ price: { id: 'pri_premium_monthly' } }],
  current_billing_period: {
    starts_at: '2026-08-01T00:00:00.000Z',
    ends_at: '2026-09-01T00:00:00.000Z',
  },
  scheduled_change: null,
};

describe('Paddle provider contract', () => {
  it('creates a checkout with server-owned custom data and price selection', async () => {
    const calls: unknown[] = [];
    const client: PaddleClient = {
      transactions: {
        create: async (input) => {
          calls.push(input);
          return { id: 'txn_01' };
        },
      },
      customerPortalSessions: {
        create: async () => ({
          urls: { general: { overview: 'https://portal.example.invalid/one-time' } },
        }),
      },
      subscriptions: {
        get: async () => subscription,
      },
      webhooks: {
        unmarshal: async () => ({ eventType: 'subscription.created', data: subscription }),
      },
    };
    const provider = createPaddleProvider({ client, config });

    await expect(
      provider.createCheckout({
        userId: '12000000-0000-4000-8000-000000000001',
        userEmail: 'person@example.com',
        checkoutAttemptId: 'attempt_01',
        productCode: 'premium_monthly',
        providerPriceId: 'pri_premium_monthly',
        returnUrl: 'https://tracker.example/billing/return?attempt=attempt_01',
      }),
    ).resolves.toEqual({ providerTransactionId: 'txn_01' });

    expect(calls).toEqual([
      {
        items: [{ priceId: 'pri_premium_monthly', quantity: 1 }],
        customData: {
          userId: '12000000-0000-4000-8000-000000000001',
          checkoutAttemptId: 'attempt_01',
          productCode: 'premium_monthly',
        },
        checkout: {
          url: 'https://tracker.example/billing/return?attempt=attempt_01',
        },
      },
    ]);
  });

  it('returns a temporary portal URL without persisting it', async () => {
    const client: PaddleClient = {
      transactions: { create: async () => ({ id: 'txn_01' }) },
      customerPortalSessions: {
        create: async (customerId, subscriptionIds) => {
          expect(customerId).toBe('ctm_01');
          expect(subscriptionIds).toEqual(['sub_01']);
          return { urls: { general: { overview: 'https://portal.example.invalid/one-time' } } };
        },
      },
      subscriptions: { get: async () => subscription },
      webhooks: { unmarshal: async () => ({}) },
    };
    const provider = createPaddleProvider({ client, config });

    await expect(
      provider.createCustomerPortal({
        providerCustomerId: 'ctm_01',
        providerSubscriptionId: 'sub_01',
      }),
    ).resolves.toEqual({ url: 'https://portal.example.invalid/one-time' });
  });

  it('rejects invalid webhook signatures before normalization', async () => {
    const client: PaddleClient = {
      transactions: { create: async () => ({ id: 'txn_01' }) },
      customerPortalSessions: {
        create: async () => ({
          urls: { general: { overview: 'https://portal.example.invalid/one-time' } },
        }),
      },
      subscriptions: { get: async () => subscription },
      webhooks: {
        unmarshal: async () => {
          throw new Error('Invalid Paddle signature: test_webhook_secret');
        },
      },
    };
    const provider = createPaddleProvider({ client, config });

    await expect(
      provider.verifyWebhook({ rawBody: '{"event":"bad"}', signature: 'invalid' }),
    ).rejects.toThrow('Paddle webhook verification failed');
  });

  it('normalizes fetched subscriptions through the same internal contract as webhooks', async () => {
    const client: PaddleClient = {
      transactions: { create: async () => ({ id: 'txn_01' }) },
      customerPortalSessions: {
        create: async () => ({
          urls: { general: { overview: 'https://portal.example.invalid/one-time' } },
        }),
      },
      subscriptions: { get: async () => subscription },
      webhooks: { unmarshal: async () => ({}) },
    };
    const provider = createPaddleProvider({ client, config });

    await expect(provider.fetchSubscription('sub_01')).resolves.toMatchObject({
      provider: 'paddle',
      subscriptionId: 'sub_01',
      customerId: 'ctm_01',
      userId: '12000000-0000-4000-8000-000000000001',
      productCode: 'premium_monthly',
      status: 'active',
    });
  });

  it('enriches adjustment webhooks from the authoritative subscription before normalization', async () => {
    const client: PaddleClient = {
      transactions: { create: async () => ({ id: 'txn_01' }) },
      customerPortalSessions: {
        create: async () => ({
          urls: { general: { overview: 'https://portal.example.invalid/one-time' } },
        }),
      },
      subscriptions: {
        get: async (subscriptionId) => {
          expect(subscriptionId).toBe('sub_01');
          return subscription;
        },
      },
      webhooks: {
        unmarshal: async () => ({
          event_id: 'evt_chargeback_01',
          event_type: 'adjustment.created',
          occurred_at: '2026-08-04T00:00:00.000Z',
          data: {
            id: 'adj_01',
            action: 'chargeback',
            subscription_id: 'sub_01',
            customer_id: 'ctm_01',
          },
        }),
      },
    };
    const provider = createPaddleProvider({ client, config });

    await expect(
      provider.verifyWebhook({ rawBody: '{}', signature: 'valid' }),
    ).resolves.toMatchObject({
      eventId: 'evt_chargeback_01',
      subscriptionId: 'sub_01',
      status: 'revoked',
      productCode: 'premium_monthly',
    });
  });
});
