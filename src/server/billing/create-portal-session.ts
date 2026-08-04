import 'server-only';

import { getAuthenticatedUser } from '@/lib/supabase/server';
import { createDokuProvider } from '@/lib/payments/doku-provider';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSubscriptionManagementService } from '@/features/subscriptions/subscription-management-service';

export function createProductionPortalService() {
  const admin = createSupabaseAdminClient();
  const provider = createDokuProvider();
  const service = createSubscriptionManagementService({
    readProviderIdentity: async (userId) => {
      const { data, error } = await admin
        .schema('private')
        .from('billing_subscriptions')
        .select('provider_customer_id,provider_subscription_id')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error('billing_identity_lookup_failed');
      }

      return data
        ? {
            providerCustomerId: data.provider_customer_id,
            providerSubscriptionId: data.provider_subscription_id,
          }
        : null;
    },
    createPortal: (input) => provider.createCustomerPortal(input),
  });

  return {
    async createPortalSession() {
      const user = await getAuthenticatedUser();
      if (!user) {
        throw new Error('authenticated_account_required');
      }

      return service.createPortalSession(user.id);
    },
  };
}
