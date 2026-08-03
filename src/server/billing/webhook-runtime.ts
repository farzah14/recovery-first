import 'server-only';

import type { NormalizedBillingEvent } from '@/domain/billing/normalized-event';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createPaddleProvider } from '@/lib/payments/paddle-provider';
import { getBillingConfig } from '@/server/billing/billing-config';
import { createProductionNormalizedBillingEventProcessor } from '@/server/billing/process-normalized-billing-event';
import {
  createWebhookProcessor,
  type WebhookProcessingStatus,
} from '@/server/billing/process-webhook';

function parseProcessingStatus(value: unknown): WebhookProcessingStatus {
  if (value === 'received' || value === 'processed' || value === 'ignored' || value === 'failed') {
    return value;
  }

  throw new Error('billing_event_status_invalid');
}

function serializeNormalizedEvent(event: NormalizedBillingEvent) {
  return {
    provider: event.provider,
    eventId: event.eventId,
    eventType: event.eventType,
    occurredAt: event.occurredAt.toISOString(),
    customerId: event.customerId,
    subscriptionId: event.subscriptionId,
    userId: event.userId,
    productCode: event.productCode,
    status: event.status,
    validFrom: event.validFrom.toISOString(),
    validUntil: event.validUntil?.toISOString() ?? null,
    cancelAtPeriodEnd: event.cancelAtPeriodEnd,
    providerPayloadHash: event.providerPayloadHash,
  } as const;
}

export function createProductionWebhookProcessor() {
  const billingConfig = getBillingConfig();
  const admin = createSupabaseAdminClient();
  const processNormalizedBillingEvent = createProductionNormalizedBillingEventProcessor();

  return createWebhookProcessor({
    provider: createPaddleProvider(),
    rawRetentionDays: billingConfig.webhookRawRetentionDays,
    insertEvent: async ({ event, rawBody, receivedAt, rawPayloadExpiresAt }) => {
      const { error } = await admin
        .schema('private')
        .from('payment_events')
        .insert({
          provider: event.provider,
          provider_event_id: event.eventId,
          signature_valid: true,
          processing_status: 'received',
          payload_hash: event.providerPayloadHash,
          normalized_payload: serializeNormalizedEvent(event),
          received_at: receivedAt.toISOString(),
          event_type: event.eventType,
          occurred_at: event.occurredAt.toISOString(),
          provider_entity_id: event.subscriptionId,
          raw_payload: rawBody,
          raw_payload_expires_at: rawPayloadExpiresAt.toISOString(),
        });

      if (error?.code === '23505') {
        const existing = await admin
          .schema('private')
          .from('payment_events')
          .select('processing_status')
          .eq('provider', event.provider)
          .eq('provider_event_id', event.eventId)
          .maybeSingle();

        if (existing.error || !existing.data) {
          throw new Error('billing_event_status_lookup_failed');
        }

        return {
          kind: 'duplicate' as const,
          processingStatus: parseProcessingStatus(existing.data.processing_status),
        };
      }
      if (error) {
        throw new Error('billing_event_storage_failed');
      }

      return { kind: 'inserted' as const };
    },
    applyEvent: processNormalizedBillingEvent,
    markEventFailed: async (eventId, errorCode) => {
      const { error } = await admin
        .schema('private')
        .from('payment_events')
        .update({
          processing_status: 'failed',
          error_code: errorCode,
          processed_at: new Date().toISOString(),
        })
        .eq('provider', 'paddle')
        .eq('provider_event_id', eventId);

      if (error) {
        throw new Error('billing_event_failure_recording_failed');
      }
    },
    recordFailure: async ({ reason, message }) => {
      await admin.schema('private').from('billing_webhook_failures').insert({
        provider: 'paddle',
        reason,
        error_message: message,
      });
    },
  });
}
