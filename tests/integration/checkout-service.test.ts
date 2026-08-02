import { describe, expect, it } from 'vitest';

import { createCheckoutService } from '@/features/subscriptions/checkout-service';

describe('checkout service', () => {
  it('creates a Lite checkout with server-owned identity and a bounded return URL', async () => {
    const calls: unknown[] = [];
    const service = createCheckoutService({
      appOrigin: 'https://tracker.example',
      resolveProviderPriceId: () => 'pri_lite_monthly',
      createAttempt: async (attempt) => {
        calls.push(attempt);
      },
      createProviderCheckout: async (input) => {
        calls.push(input);
        return { providerTransactionId: 'txn_123' };
      },
      createAttemptId: () => 'attempt_123',
    });

    await expect(
      service.createCheckout({
        userId: 'user_123',
        userEmail: 'person@example.com',
        productCode: 'lite_monthly',
      }),
    ).resolves.toEqual({
      attemptId: 'attempt_123',
      providerTransactionId: 'txn_123',
      returnUrl: 'https://tracker.example/billing/return?attempt=attempt_123',
    });

    expect(calls).toEqual([
      {
        id: 'attempt_123',
        userId: 'user_123',
        productCode: 'lite_monthly',
        status: 'created',
      },
      {
        userId: 'user_123',
        userEmail: 'person@example.com',
        checkoutAttemptId: 'attempt_123',
        productCode: 'lite_monthly',
        providerPriceId: 'pri_lite_monthly',
        returnUrl: 'https://tracker.example/billing/return?attempt=attempt_123',
      },
    ]);
  });

  it('rejects Free, legacy product aliases, and browser-owned return data', async () => {
    const service = createCheckoutService({
      appOrigin: 'https://tracker.example',
      resolveProviderPriceId: () => 'pri_lite_monthly',
      createAttempt: async () => {
        return;
      },
      createProviderCheckout: async () => ({ providerTransactionId: 'txn_123' }),
      createAttemptId: () => 'attempt_123',
    });

    await expect(
      service.createCheckout({
        userId: 'user_123',
        userEmail: 'person@example.com',
        productCode: 'free',
      }),
    ).rejects.toThrow('Paid product required');
  });
});
