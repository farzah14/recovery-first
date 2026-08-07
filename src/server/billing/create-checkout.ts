import 'server-only';

import { getAuthenticatedUser } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env/server-env';
import { createDokuProvider } from '@/lib/payments/doku-provider';
import { getDokuBillingConfig } from '@/server/billing/billing-config';
import {
  createCheckoutService,
  type CheckoutAttemptRecord,
  type CheckoutAttemptStatus,
  type CheckoutRequest,
  type PaidProductCode,
} from '@/features/subscriptions/checkout-service';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const activePaidStatuses = [
  'trial_active',
  'trial_cancelled',
  'active',
  'grace_period',
  'past_due',
  'cancelled',
] as const;

function asPaidProductCode(value: string): PaidProductCode {
  if (
    value === 'lite_monthly' ||
    value === 'lite_annual' ||
    value === 'premium_monthly' ||
    value === 'premium_annual'
  ) {
    return value;
  }

  throw new Error('checkout_plan_invalid');
}

function asCheckoutAttemptStatus(value: string): CheckoutAttemptStatus {
  if (
    value === 'created' ||
    value === 'opened' ||
    value === 'processing' ||
    value === 'confirmed' ||
    value === 'failed' ||
    value === 'expired'
  ) {
    return value;
  }

  throw new Error('checkout_status_invalid');
}

export function createProductionCheckoutService() {
  const admin = createSupabaseAdminClient();
  const billingConfig = getDokuBillingConfig();
  const provider = createDokuProvider();

  const service = createCheckoutService({
    appOrigin: serverEnv.NEXT_PUBLIC_APP_URL,
    resolveProviderPriceId: (productCode) => String(billingConfig.amounts[productCode]),
    findAttempt: async (userId, idempotencyKey): Promise<CheckoutAttemptRecord | null> => {
      const { data, error } = await admin
        .schema('private')
        .from('checkout_attempts')
        .select(
          'id,user_id,plan_code,idempotency_key,status,provider_transaction_id,provider_checkout_url,expires_at,created_at,updated_at',
        )
        .eq('user_id', userId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (error) {
        throw new Error('checkout_attempt_lookup_failed');
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        productCode: asPaidProductCode(data.plan_code),
        idempotencyKey: data.idempotency_key,
        status: asCheckoutAttemptStatus(data.status),
        providerTransactionId: data.provider_transaction_id,
        providerCheckoutUrl: data.provider_checkout_url,
      };
    },
    hasActivePaidEntitlement: async (userId) => {
      const { data, error } = await admin
        .schema('private')
        .from('billing_subscriptions')
        .select('provider_subscription_id,normalized_status,current_period_end')
        .eq('user_id', userId)
        .in('normalized_status', [...activePaidStatuses]);

      if (error) {
        throw new Error('billing_subscription_lookup_failed');
      }

      const now = Date.now();
      return data.some(
        (subscription) =>
          subscription.current_period_end === null ||
          new Date(subscription.current_period_end).getTime() > now,
      );
    },
    createAttempt: async (attempt) => {
      const { error } = await admin
        .schema('private')
        .from('checkout_attempts')
        .insert({
          id: attempt.id,
          user_id: attempt.userId,
          plan_code: attempt.productCode,
          provider: 'doku',
          idempotency_key: attempt.idempotencyKey,
          status: attempt.status,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        });

      if (error) {
        throw new Error('checkout_attempt_create_failed');
      }
    },
    updateAttempt: async (attemptId, update) => {
      const { error } = await admin
        .schema('private')
        .from('checkout_attempts')
        .update({
          status: update.status,
          provider_transaction_id: update.providerTransactionId,
          ...(update.providerCheckoutUrl !== undefined
            ? { provider_checkout_url: update.providerCheckoutUrl }
            : {}),
        })
        .eq('id', attemptId);

      if (error) {
        throw new Error('checkout_attempt_update_failed');
      }
    },
    createProviderCheckout: (input) => provider.createCheckout(input),
    createAttemptId: () => crypto.randomUUID(),
  });

  return {
    async createCheckout(input: Omit<CheckoutRequest, 'userId' | 'userEmail'>) {
      const user = await getAuthenticatedUser();
      if (!user) {
        throw new Error('authenticated_account_required');
      }
      if (!user.email) {
        throw new Error('authenticated_email_required');
      }

      return service.createCheckout({
        ...input,
        userId: user.id,
        userEmail: user.email,
      });
    },
  };
}
