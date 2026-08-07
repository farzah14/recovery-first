import { describe, expect, it, vi } from 'vitest';

import { handleCheckoutRequest } from '@/app/api/billing/checkout/route';

describe('checkout route', () => {
  it('rejects malformed requests without invoking checkout creation', async () => {
    const createCheckout = vi.fn();
    const request = new Request('https://tracker.example/api/billing/checkout', {
      method: 'POST',
      body: '{"productCode":"premium_monthly"}',
    });

    const response = await handleCheckoutRequest(request, { createCheckout });

    expect(response.status).toBe(400);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(createCheckout).not.toHaveBeenCalled();
  });

  it('rejects a cross-origin browser request before checkout creation', async () => {
    const createCheckout = vi.fn();
    const request = new Request('https://tracker.example/api/billing/checkout', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
      body: JSON.stringify({
        productCode: 'premium_monthly',
        acceptedTerms: true,
        idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
      }),
    });

    const response = await handleCheckoutRequest(request, { createCheckout });

    expect(response.status).toBe(403);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(createCheckout).not.toHaveBeenCalled();
  });

  it('passes only validated checkout input to the authenticated server service', async () => {
    const createCheckout = vi.fn().mockResolvedValue({
      attemptId: 'attempt_01',
      providerTransactionId: 'txn_01',
    });
    const request = new Request('https://tracker.example/api/billing/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        productCode: 'premium_monthly',
        acceptedTerms: true,
        idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'attacker-controlled-user',
      }),
    });

    const response = await handleCheckoutRequest(request, { createCheckout });

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(createCheckout).toHaveBeenCalledWith({
      productCode: 'premium_monthly',
      acceptedTerms: true,
      idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(await response.json()).toEqual({
      attemptId: 'attempt_01',
      providerTransactionId: 'txn_01',
    });
  });

  it('does not expose provider or database error details', async () => {
    const createCheckout = vi.fn().mockRejectedValue(new Error('secret SQL/provider detail'));
    const request = new Request('https://tracker.example/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({
        productCode: 'premium_monthly',
        acceptedTerms: true,
        idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
      }),
    });

    const response = await handleCheckoutRequest(request, { createCheckout });

    expect(response.status).toBe(500);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'checkout_creation_failed' });
  });
});
