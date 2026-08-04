import type { NormalizedBillingEvent } from '@/domain/billing/normalized-event';
import type { BillingProductCode } from '@/domain/billing/product-catalog';

export type CreateCheckoutInput = Readonly<{
  userId: string;
  userEmail: string;
  checkoutAttemptId: string;
  productCode: Exclude<BillingProductCode, 'free' | 'lite' | 'premium'>;
  providerPriceId: string;
  returnUrl: string;
}>;

export type ProviderWebhookVerificationInput = Readonly<{
  rawBody: string;
  signature: string;
  headers?: Readonly<Record<string, string>>;
}>;

export interface PaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<{
    providerTransactionId: string;
    checkoutUrl?: string;
  }>;
  createCustomerPortal(input: {
    providerCustomerId: string;
    providerSubscriptionId: string;
  }): Promise<{ url: string }>;
  verifyWebhook(input: ProviderWebhookVerificationInput): Promise<NormalizedBillingEvent>;
  fetchSubscription(providerSubscriptionId: string): Promise<NormalizedBillingEvent>;
}
