import 'server-only';

import { createEntitlementRefreshService } from '@/features/subscriptions/entitlement-refresh-service';
import { createPaddleProvider } from '@/lib/payments/paddle-provider';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createProductionNormalizedBillingEventProcessor } from '@/server/billing/process-normalized-billing-event';

export function createProductionEntitlementRefreshService() {
  const admin = createSupabaseAdminClient();
  const provider = createPaddleProvider();
  const processEvent = createProductionNormalizedBillingEventProcessor();

  return createEntitlementRefreshService({
    readStoredSubscription: async (userId) => {
      const { data, error } = await admin
        .schema('private')
        .from('billing_subscriptions')
        .select(
          'user_id,provider_customer_id,provider_subscription_id,plan_code,normalized_status,current_period_end,updated_at',
        )
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw new Error('billing_subscription_lookup_failed');
      }

      return data
        ? {
            userId: data.user_id,
            providerCustomerId: data.provider_customer_id,
            providerSubscriptionId: data.provider_subscription_id,
            planCode: data.plan_code as
              'lite_monthly' | 'lite_annual' | 'premium_monthly' | 'premium_annual',
            normalizedStatus: data.normalized_status,
            currentPeriodEnd: data.current_period_end,
            updatedAt: data.updated_at,
          }
        : null;
    },
    fetchSubscription: (providerSubscriptionId) =>
      provider.fetchSubscription(providerSubscriptionId),
    processEvent,
    auditRefresh: async ({ userId, providerSubscriptionId, result }) => {
      const { error } = await admin
        .schema('private')
        .from('audit_events')
        .insert({
          user_id: userId,
          event_type: 'billing_reconciliation_requested',
          entity_type: 'subscription',
          entity_id: providerSubscriptionId,
          metadata: { provider: 'paddle', result },
        });

      if (error) {
        throw new Error('billing_reconciliation_audit_failed');
      }
    },
  });
}
