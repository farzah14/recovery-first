import 'server-only';

import type { NormalizedBillingEvent } from '@/domain/billing/normalized-event';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export function createProductionNormalizedBillingEventProcessor() {
  const admin = createSupabaseAdminClient();

  return async function processNormalizedBillingEvent(event: NormalizedBillingEvent) {
    const { data, error } = await admin.schema('private').rpc('process_normalized_billing_event', {
      p_provider: event.provider,
      p_event_id: event.eventId,
      p_event_type: event.eventType,
      p_occurred_at: event.occurredAt.toISOString(),
      p_user_id: event.userId,
      p_customer_id: event.customerId,
      p_subscription_id: event.subscriptionId,
      p_plan_code: event.productCode,
      p_status: event.status,
      p_valid_from: event.validFrom.toISOString(),
      p_valid_until: event.validUntil?.toISOString() ?? null,
      p_cancel_at_period_end: event.cancelAtPeriodEnd,
      p_payload_hash: event.providerPayloadHash,
    });

    if (error || typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error('billing_event_processing_failed');
    }

    const result = data as { result?: unknown; eventId?: unknown };
    if (typeof result.result !== 'string') {
      throw new Error('billing_event_processing_failed');
    }

    return {
      result: result.result,
      ...(typeof result.eventId === 'string' ? { eventId: result.eventId } : {}),
    };
  };
}
