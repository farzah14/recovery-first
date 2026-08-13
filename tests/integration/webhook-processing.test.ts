import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type { NormalizedBillingEvent } from '@/domain/billing/normalized-event';
import { BillingNormalizationError } from '@/lib/payments/paddle-normalizer';
import { readRawWebhook } from '@/lib/payments/webhook-envelope';
import { createWebhookProcessor } from '@/server/billing/process-webhook';
import { handleWebhookRequest } from '@/app/api/billing/webhook/handler';

const normalizedEvent: NormalizedBillingEvent = {
  provider: 'paddle',
  eventId: 'evt_01',
  eventType: 'subscription_created',
  occurredAt: new Date('2026-08-03T00:00:00.000Z'),
  customerId: 'ctm_01',
  subscriptionId: 'sub_01',
  userId: '12000000-0000-4000-8000-000000000001',
  productCode: 'premium_monthly',
  status: 'active',
  validFrom: new Date('2026-08-03T00:00:00.000Z'),
  validUntil: new Date('2026-09-03T00:00:00.000Z'),
  cancelAtPeriodEnd: false,
  providerPayloadHash: 'hash_01',
};

function createDependencies() {
  return {
    provider: {
      verifyWebhook: vi.fn().mockResolvedValue(normalizedEvent),
    },
    insertEvent: vi.fn().mockResolvedValue({ kind: 'inserted' as const }),
    applyEvent: vi.fn().mockResolvedValue({ result: 'applied' as const }),
    markEventFailed: vi.fn().mockResolvedValue(undefined),
    recordFailure: vi.fn().mockResolvedValue(undefined),
    now: () => new Date('2026-08-03T01:00:00.000Z'),
    rawRetentionDays: 30,
  };
}

describe('Paddle webhook processing', () => {
  it('passes the unchanged raw body to signature verification', async () => {
    const dependencies = createDependencies();
    const processor = createWebhookProcessor(dependencies);
    const rawBody = '{"data":{"status":"active"}}';

    await processor.process({ rawBody, signature: 'ts=1;h1=signature' });

    expect(dependencies.provider.verifyWebhook).toHaveBeenCalledWith({
      rawBody,
      signature: 'ts=1;h1=signature',
    });
  });

  it('does not store an event when signature verification fails', async () => {
    const dependencies = createDependencies();
    dependencies.provider.verifyWebhook.mockRejectedValue(
      new Error('Paddle webhook verification failed'),
    );
    const processor = createWebhookProcessor(dependencies);

    await expect(
      processor.process({ rawBody: '{"event":"bad"}', signature: 'invalid' }),
    ).rejects.toThrow('Paddle webhook verification failed');

    expect(dependencies.insertEvent).not.toHaveBeenCalled();
    expect(dependencies.applyEvent).not.toHaveBeenCalled();
  });

  it('returns duplicate success without applying the event a second time', async () => {
    const dependencies = createDependencies();
    dependencies.insertEvent.mockResolvedValue({
      kind: 'duplicate' as const,
      processingStatus: 'processed' as const,
    });
    const processor = createWebhookProcessor(dependencies);

    await expect(
      processor.process({ rawBody: '{"event":"duplicate"}', signature: 'valid' }),
    ).resolves.toEqual({ result: 'duplicate', eventId: 'evt_01' });

    expect(dependencies.applyEvent).not.toHaveBeenCalled();
  });

  it('reconciles a persisted but not yet processed duplicate', async () => {
    const dependencies = createDependencies();
    dependencies.insertEvent.mockResolvedValue({
      kind: 'duplicate' as const,
      processingStatus: 'received' as const,
    });
    const processor = createWebhookProcessor(dependencies);

    await expect(
      processor.process({ rawBody: '{"event":"pending"}', signature: 'valid' }),
    ).resolves.toEqual({ result: 'applied', eventId: 'evt_01' });

    expect(dependencies.applyEvent).toHaveBeenCalledWith(normalizedEvent);
  });

  it('marks an applied event failed with a redacted processing code', async () => {
    const dependencies = createDependencies();
    dependencies.applyEvent.mockRejectedValue(new Error('provider secret and SQL details'));
    const processor = createWebhookProcessor(dependencies);

    await expect(
      processor.process({ rawBody: '{"event":"apply-fails"}', signature: 'valid' }),
    ).rejects.toThrow('provider secret and SQL details');

    expect(dependencies.markEventFailed).toHaveBeenCalledWith(
      normalizedEvent.eventId,
      'billing_event_processing_failed',
    );
  });

  it('records a redacted failure for malformed normalized data', async () => {
    const dependencies = createDependencies();
    dependencies.provider.verifyWebhook.mockRejectedValue(
      new BillingNormalizationError('Unknown Paddle price ID: pri_secret'),
    );
    const processor = createWebhookProcessor(dependencies);

    await expect(
      processor.process({ rawBody: '{"secret":"do-not-store"}', signature: 'valid' }),
    ).rejects.toThrow(BillingNormalizationError);

    expect(dependencies.recordFailure).toHaveBeenCalledWith({
      reason: 'normalization_failed',
      message: 'Unknown Paddle price ID: pri_secret',
    });
    expect(dependencies.recordFailure.mock.calls[0]?.[0]).not.toHaveProperty('rawBody');
    expect(dependencies.insertEvent).not.toHaveBeenCalled();
  });

  it('maps a missing signature to HTTP 400 without using a session cookie', async () => {
    const processor = { process: vi.fn() };
    const request = new Request('https://tracker.example/api/billing/webhook', {
      method: 'POST',
      body: '{"event":"missing-signature"}',
    });

    const response = await handleWebhookRequest(request, processor);

    expect(response.status).toBe(400);
    expect(processor.process).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ error: 'webhook_signature_required' });
  });

  it('reads the raw body and Paddle signature without parsing JSON', async () => {
    const request = new Request('https://tracker.example/api/billing/webhook', {
      method: 'POST',
      headers: { 'paddle-signature': 'ts=1;h1=signature' },
      body: '{"data":{"value":"preserve-whitespace"}}',
    });

    await expect(readRawWebhook(request)).resolves.toEqual({
      rawBody: '{"data":{"value":"preserve-whitespace"}}',
      signature: 'ts=1;h1=signature',
    });
  });
});
