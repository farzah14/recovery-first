import 'server-only';

import type { NormalizedBillingEvent } from '@/domain/billing/normalized-event';
import {
  createBillingEntitlementProjector,
  type EntitlementSnapshot,
} from '@/features/entitlements/billing-entitlement-projector';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export function createProductionBillingEntitlementProjector() {
  const admin = createSupabaseAdminClient();

  return createBillingEntitlementProjector({
    project: async (event: NormalizedBillingEvent) => {
      const { data, error } = await admin.schema('private').rpc('project_billing_entitlement', {
        p_user_id: event.userId,
        p_subscription_id: event.subscriptionId,
        p_plan_code: event.productCode,
        p_status: event.status,
        p_valid_from: event.validFrom.toISOString(),
        p_valid_until: event.validUntil?.toISOString() ?? null,
        p_cancel_at_period_end: event.cancelAtPeriodEnd,
        p_source_event_id: event.eventId,
      });

      if (error) {
        throw new Error('billing_entitlement_projection_failed');
      }

      return data;
    },
  });
}

export type { EntitlementSnapshot };
