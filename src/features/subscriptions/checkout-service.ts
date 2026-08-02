import type { BillingProductCode } from '@/domain/billing/product-catalog';
import { billingProductForCode } from '@/domain/billing/product-catalog';

type CheckoutAttempt = Readonly<{
  id: string;
  userId: string;
  productCode: Exclude<BillingProductCode, 'free' | 'lite' | 'premium'>;
  status: 'created';
}>;

type ProviderCheckoutInput = Readonly<{
  userId: string;
  userEmail: string;
  checkoutAttemptId: string;
  productCode: Exclude<BillingProductCode, 'free' | 'lite' | 'premium'>;
  providerPriceId: string;
  returnUrl: string;
}>;

type CheckoutServiceDependencies = Readonly<{
  appOrigin: string;
  resolveProviderPriceId: (
    productCode: Exclude<BillingProductCode, 'free' | 'lite' | 'premium'>,
  ) => string;
  createAttempt: (attempt: CheckoutAttempt) => Promise<void>;
  createProviderCheckout: (
    input: ProviderCheckoutInput,
  ) => Promise<{ providerTransactionId: string }>;
  createAttemptId: () => string;
}>;

type CheckoutRequest = Readonly<{
  userId: string;
  userEmail: string;
  productCode: string;
}>;

function isPaidProductCode(
  code: string,
): code is Exclude<BillingProductCode, 'free' | 'lite' | 'premium'> {
  const product = billingProductForCode(code);
  return Boolean(product && product.interval !== null && product.tier !== 'free');
}

export function createCheckoutService(dependencies: CheckoutServiceDependencies) {
  return {
    async createCheckout(input: CheckoutRequest) {
      if (!isPaidProductCode(input.productCode)) {
        throw new Error('Paid product required');
      }

      const attemptId = dependencies.createAttemptId();
      const returnUrl = new URL('/billing/return', dependencies.appOrigin);
      returnUrl.searchParams.set('attempt', attemptId);

      await dependencies.createAttempt({
        id: attemptId,
        userId: input.userId,
        productCode: input.productCode,
        status: 'created',
      });

      const checkout = await dependencies.createProviderCheckout({
        userId: input.userId,
        userEmail: input.userEmail,
        checkoutAttemptId: attemptId,
        productCode: input.productCode,
        providerPriceId: dependencies.resolveProviderPriceId(input.productCode),
        returnUrl: returnUrl.toString(),
      });

      return {
        attemptId,
        providerTransactionId: checkout.providerTransactionId,
        returnUrl: returnUrl.toString(),
      } as const;
    },
  };
}
