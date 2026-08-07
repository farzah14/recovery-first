import 'server-only';

import { getDokuBillingConfig } from '@/server/billing/billing-config';
import { createProductionEntitlementRefreshService } from '@/server/billing/reconcile-subscription';
import { runScheduledSubscriptionReconciliation } from '@/server/billing/scheduled-reconciliation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const eligibleStatuses = [
  'trial_active',
  'trial_cancelled',
  'active',
  'grace_period',
  'past_due',
  'cancelled',
] as const;

export async function runProductionScheduledSubscriptionReconciliation(cursor?: string | null) {
  const config = getDokuBillingConfig();
  const admin = createSupabaseAdminClient();
  const refreshService = createProductionEntitlementRefreshService();

  return runScheduledSubscriptionReconciliation(
    {
      listEligible: async ({ afterUserId, batchSize }) => {
        let query = admin
          .schema('private')
          .from('billing_subscriptions')
          .select('user_id')
          .in('normalized_status', [...eligibleStatuses])
          .order('user_id', { ascending: true })
          .limit(batchSize);

        if (afterUserId) {
          query = query.gt('user_id', afterUserId);
        }

        const { data, error } = await query;
        if (error) {
          throw new Error('scheduled_reconciliation_lookup_failed');
        }

        const subscriptions = data.map((row) => ({ userId: row.user_id }));
        return {
          subscriptions,
          nextCursor:
            subscriptions.length === batchSize
              ? (subscriptions[subscriptions.length - 1]?.userId ?? null)
              : null,
        };
      },
      refresh: refreshService.refresh,
    },
    {
      batchSize: config.reconciliationBatchSize,
      ...(cursor !== undefined ? { cursor } : {}),
    },
  );
}
