import { NextResponse } from 'next/server';

import { BillingNormalizationError } from '@/lib/payments/paddle-normalizer';
import { readRawWebhook } from '@/lib/payments/webhook-envelope';
import { WebhookVerificationError, type WebhookEnvelope } from '@/server/billing/process-webhook';

export const runtime = 'nodejs';

type WebhookProcessor = Readonly<{
  process: (envelope: WebhookEnvelope) => Promise<Readonly<Record<string, unknown>>>;
}>;

export async function handleWebhookRequest(
  request: Request,
  processor: WebhookProcessor,
): Promise<Response> {
  const envelope = await readRawWebhook(request);
  if (envelope.signature.trim() === '') {
    return NextResponse.json({ error: 'webhook_signature_required' }, { status: 400 });
  }

  try {
    const result = await processor.process(envelope);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return NextResponse.json({ error: 'webhook_signature_invalid' }, { status: 400 });
    }

    if (error instanceof BillingNormalizationError) {
      return NextResponse.json({ error: 'webhook_payload_invalid' }, { status: 422 });
    }

    return NextResponse.json({ error: 'webhook_processing_failed' }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const { createProductionWebhookProcessor } = await import('@/server/billing/webhook-runtime');
  return handleWebhookRequest(request, createProductionWebhookProcessor());
}
