import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  buildSubscriptionSnapshot,
  type SubscriptionSnapshot,
} from '@/features/subscriptions/subscription-query';

export function createProductionSubscriptionQuery() {
  const admin = createSupabaseAdminClient();

  async function readLatestEntitlement(userId: string) {
    const { data: entitlement, error: entitlementError } = await admin
      .from('entitlements')
      .select('product_code,status,valid_from,valid_until,cancel_at_period_end,revision')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (entitlementError) {
      throw new Error('entitlement_lookup_failed');
    }

    return entitlement
      ? {
          productCode: entitlement.product_code,
          status: entitlement.status,
          validFrom: entitlement.valid_from,
          validUntil: entitlement.valid_until,
          cancelAtPeriodEnd: entitlement.cancel_at_period_end,
          revision: entitlement.revision,
        }
      : null;
  }

  return {
    async readSnapshot(userId: string, attemptId: string): Promise<SubscriptionSnapshot | null> {
      const { data: attempt, error: attemptError } = await admin
        .schema('private')
        .from('checkout_attempts')
        .select('id,status,provider_transaction_id')
        .eq('id', attemptId)
        .eq('user_id', userId)
        .maybeSingle();

      if (attemptError) {
        throw new Error('checkout_attempt_lookup_failed');
      }
      if (!attempt) {
        return null;
      }

      return buildSubscriptionSnapshot({
        now: new Date(),
        checkoutAttemptStatus: attempt.status,
        entitlement: await readLatestEntitlement(userId),
      });
    },

    async readCurrentSnapshot(userId: string): Promise<SubscriptionSnapshot> {
      return buildSubscriptionSnapshot({
        now: new Date(),
        checkoutAttemptStatus: null,
        entitlement: await readLatestEntitlement(userId),
      });
    },
  };
}
