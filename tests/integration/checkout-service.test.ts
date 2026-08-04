import { describe, expect, it, vi } from 'vitest';

import {
  createCheckoutService,
  type CheckoutAttemptRecord,
} from '@/features/subscriptions/checkout-service';

const baseInput = {
  userId: '12000000-0000-4000-8000-000000000001',
  userEmail: 'person@example.com',
  productCode: 'lite_monthly',
  acceptedTerms: true,
  idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
};

function createDependencies(
  overrides: Partial<{
    findAttempt: (userId: string, idempotencyKey: string) => Promise<CheckoutAttemptRecord | null>;
    hasActivePaidEntitlement: (userId: string) => Promise<boolean>;
  }> = {},
) {
  return {
    appOrigin: 'https://tracker.example',
    resolveProviderPriceId: () => 'pri_lite_monthly',
    findAttempt: overrides.findAttempt ?? (async () => null),
    hasActivePaidEntitlement: overrides.hasActivePaidEntitlement ?? (async () => false),
    createAttempt: vi.fn().mockResolvedValue(undefined),
    updateAttempt: vi.fn().mockResolvedValue(undefined),
    createProviderCheckout: vi.fn().mockResolvedValue({ providerTransactionId: 'txn_123' }),
    createAttemptId: () => 'attempt_123',
  };
}

describe('checkout service', () => {
  it('creates a Lite checkout with server-owned identity and a bounded return URL', async () => {
    const dependencies = createDependencies();
    const service = createCheckoutService(dependencies);

    await expect(service.createCheckout(baseInput)).resolves.toEqual({
      attemptId: 'attempt_123',
      providerTransactionId: 'txn_123',
      returnUrl: 'https://tracker.example/billing/return?attempt=attempt_123',
    });

    expect(dependencies.createAttempt).toHaveBeenCalledWith({
      id: 'attempt_123',
      userId: baseInput.userId,
      productCode: 'lite_monthly',
      idempotencyKey: baseInput.idempotencyKey,
      status: 'created',
    });
    expect(dependencies.createProviderCheckout).toHaveBeenCalledWith({
      userId: baseInput.userId,
      userEmail: baseInput.userEmail,
      checkoutAttemptId: 'attempt_123',
      productCode: 'lite_monthly',
      providerPriceId: 'pri_lite_monthly',
      returnUrl: 'https://tracker.example/billing/return?attempt=attempt_123',
    });
    expect(dependencies.updateAttempt).toHaveBeenCalledWith('attempt_123', {
      status: 'opened',
      providerTransactionId: 'txn_123',
    });
  });

  it('returns the server-created DOKU hosted checkout URL without accepting a browser URL', async () => {
    const dependencies = createDependencies();
    dependencies.createProviderCheckout.mockResolvedValue({
      providerTransactionId: 'session_123',
      checkoutUrl: 'https://sandbox.doku.com/checkout-link/session_123',
    });
    const service = createCheckoutService(dependencies);

    await expect(service.createCheckout(baseInput)).resolves.toMatchObject({
      providerTransactionId: 'session_123',
      checkoutUrl: 'https://sandbox.doku.com/checkout-link/session_123',
    });
  });

  it('replays the same provider transaction for a repeated idempotency key', async () => {
    const existing: CheckoutAttemptRecord = {
      id: 'attempt_existing',
      userId: baseInput.userId,
      productCode: 'lite_monthly',
      idempotencyKey: baseInput.idempotencyKey,
      status: 'opened',
      providerTransactionId: 'txn_existing',
    };
    const dependencies = createDependencies({ findAttempt: async () => existing });
    const service = createCheckoutService(dependencies);

    await expect(service.createCheckout(baseInput)).resolves.toEqual({
      attemptId: 'attempt_existing',
      providerTransactionId: 'txn_existing',
      returnUrl: 'https://tracker.example/billing/return?attempt=attempt_existing',
    });

    expect(dependencies.createProviderCheckout).not.toHaveBeenCalled();
  });

  it('rejects anonymous-shaped requests, missing selection, and unchecked terms', async () => {
    const dependencies = createDependencies();
    const service = createCheckoutService(dependencies);

    await expect(service.createCheckout({ ...baseInput, userId: '' })).rejects.toThrow(
      'Authenticated account required',
    );
    await expect(service.createCheckout({ ...baseInput, productCode: '' })).rejects.toThrow(
      'Paid product required',
    );
    await expect(service.createCheckout({ ...baseInput, acceptedTerms: false })).rejects.toThrow(
      'Checkout terms must be accepted',
    );
  });

  it('does not create a second checkout while a paid entitlement is active', async () => {
    const dependencies = createDependencies({ hasActivePaidEntitlement: async () => true });
    const service = createCheckoutService(dependencies);

    await expect(service.createCheckout(baseInput)).rejects.toThrow(
      'Paid subscription already active',
    );
    expect(dependencies.createAttempt).not.toHaveBeenCalled();
  });

  it('marks a failed provider attempt without exposing provider details', async () => {
    const dependencies = createDependencies();
    dependencies.createProviderCheckout.mockRejectedValue(new Error('secret provider response'));
    const service = createCheckoutService(dependencies);

    await expect(service.createCheckout(baseInput)).rejects.toThrow('Checkout creation failed');
    expect(dependencies.updateAttempt).toHaveBeenCalledWith('attempt_123', {
      status: 'failed',
      providerTransactionId: null,
    });
  });
});
