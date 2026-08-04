import 'server-only';

import type { NormalizedBillingEvent } from '@/domain/billing/normalized-event';
import type { PaymentProvider } from '@/lib/payments/payment-provider';
import { BillingNormalizationError } from '@/lib/payments/paddle-normalizer';

const DAY_MS = 86_400_000;

export class WebhookVerificationError extends Error {
  constructor() {
    super('Paddle webhook verification failed');
    this.name = 'WebhookVerificationError';
  }
}

export type WebhookProcessingStatus = 'received' | 'processed' | 'ignored' | 'failed';

export type WebhookEventInsert = Readonly<{
  event: NormalizedBillingEvent;
  rawBody: string;
  receivedAt: Date;
  rawPayloadExpiresAt: Date;
}>;

export type WebhookEventInsertResult =
  | Readonly<{ kind: 'inserted' }>
  | Readonly<{ kind: 'duplicate'; processingStatus: WebhookProcessingStatus }>;

export type WebhookProcessorDependencies = Readonly<{
  provider: Pick<PaymentProvider, 'verifyWebhook'>;
  insertEvent: (input: WebhookEventInsert) => Promise<WebhookEventInsertResult>;
  applyEvent: (event: NormalizedBillingEvent) => Promise<{ result: string }>;
  markEventFailed?: (eventId: string, errorCode: string) => Promise<void>;
  recordFailure: (
    input: Readonly<{ reason: 'normalization_failed'; message: string }>,
  ) => Promise<void>;
  now?: () => Date;
  rawRetentionDays: number;
}>;

export type WebhookEnvelope = Readonly<{
  rawBody: string;
  signature: string;
  headers?: Readonly<Record<string, string>>;
}>;

export function createWebhookProcessor(dependencies: WebhookProcessorDependencies) {
  const now = dependencies.now ?? (() => new Date());

  return {
    async process(envelope: WebhookEnvelope) {
      let event: NormalizedBillingEvent;
      try {
        event = await dependencies.provider.verifyWebhook(envelope);
      } catch (error) {
        if (error instanceof BillingNormalizationError) {
          await dependencies.recordFailure({
            reason: 'normalization_failed',
            message: error.message,
          });
          throw error;
        }

        throw new WebhookVerificationError();
      }

      const receivedAt = now();
      const rawPayloadExpiresAt = new Date(
        receivedAt.getTime() + dependencies.rawRetentionDays * DAY_MS,
      );
      const inserted = await dependencies.insertEvent({
        event,
        rawBody: envelope.rawBody,
        receivedAt,
        rawPayloadExpiresAt,
      });

      if (
        inserted.kind === 'duplicate' &&
        inserted.processingStatus !== 'received' &&
        inserted.processingStatus !== 'failed'
      ) {
        return { result: 'duplicate', eventId: event.eventId } as const;
      }

      let result: { result: string };
      try {
        result = await dependencies.applyEvent(event);
      } catch (error) {
        try {
          await dependencies.markEventFailed?.(event.eventId, 'billing_event_processing_failed');
        } catch {
          // Preserve the original processing error; the event remains retryable.
        }
        throw error;
      }

      return { ...result, eventId: event.eventId } as const;
    },
  };
}
