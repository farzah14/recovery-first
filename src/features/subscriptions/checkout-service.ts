import { z } from 'zod';

import type { BillingProductCode } from '@/domain/billing/product-catalog';
import { billingProductForCode } from '@/domain/billing/product-catalog';

export type PaidProductCode = Exclude<BillingProductCode, 'free' | 'lite' | 'premium'>;

export type CheckoutAttemptStatus =
  'created' | 'opened' | 'processing' | 'confirmed' | 'failed' | 'expired';

export type CheckoutAttemptRecord = Readonly<{
  id: string;
  userId: string;
  productCode: PaidProductCode;
  idempotencyKey: string;
  status: CheckoutAttemptStatus;
  providerTransactionId: string | null;
}>;

type ProviderCheckoutInput = Readonly<{
  userId: string;
  userEmail: string;
  checkoutAttemptId: string;
  productCode: PaidProductCode;
  providerPriceId: string;
  returnUrl: string;
}>;

type CheckoutAttemptInsert = Readonly<{
  id: string;
  userId: string;
  productCode: PaidProductCode;
  idempotencyKey: string;
  status: 'created';
}>;

type CheckoutServiceDependencies = Readonly<{
  appOrigin: string;
  resolveProviderPriceId: (productCode: PaidProductCode) => string;
  findAttempt: (userId: string, idempotencyKey: string) => Promise<CheckoutAttemptRecord | null>;
  hasActivePaidEntitlement: (userId: string) => Promise<boolean>;
  createAttempt: (attempt: CheckoutAttemptInsert) => Promise<void>;
  updateAttempt: (
    attemptId: string,
    update: Readonly<{
      status: CheckoutAttemptStatus;
      providerTransactionId: string | null;
    }>,
  ) => Promise<void>;
  createProviderCheckout: (
    input: ProviderCheckoutInput,
  ) => Promise<{ providerTransactionId: string }>;
  createAttemptId: () => string;
}>;

export type CheckoutRequest = Readonly<{
  userId: string;
  userEmail: string;
  productCode: string;
  acceptedTerms: boolean;
  idempotencyKey: string;
}>;

function isPaidProductCode(code: string): code is PaidProductCode {
  const product = billingProductForCode(code);
  return Boolean(product && product.interval !== null && product.tier !== 'free');
}

const idempotencyKeySchema = z.string().uuid();

export function createCheckoutService(dependencies: CheckoutServiceDependencies) {
  return {
    async createCheckout(input: CheckoutRequest) {
      if (input.userId.trim() === '') {
        throw new Error('Authenticated account required');
      }

      if (!isPaidProductCode(input.productCode)) {
        throw new Error('Paid product required');
      }

      if (!input.acceptedTerms) {
        throw new Error('Checkout terms must be accepted');
      }

      if (!idempotencyKeySchema.safeParse(input.idempotencyKey).success) {
        throw new Error('Valid idempotency key required');
      }

      const existing = await dependencies.findAttempt(input.userId, input.idempotencyKey);
      if (existing) {
        if (existing.productCode !== input.productCode) {
          throw new Error('Checkout idempotency key belongs to another product');
        }

        if (existing.providerTransactionId) {
          return {
            attemptId: existing.id,
            providerTransactionId: existing.providerTransactionId,
            returnUrl: new URL(
              `/billing/return?attempt=${existing.id}`,
              dependencies.appOrigin,
            ).toString(),
          } as const;
        }
      } else if (await dependencies.hasActivePaidEntitlement(input.userId)) {
        throw new Error('Paid subscription already active');
      }

      const attemptId = existing?.id ?? dependencies.createAttemptId();
      const returnUrl = new URL('/billing/return', dependencies.appOrigin);
      returnUrl.searchParams.set('attempt', attemptId);

      if (!existing) {
        await dependencies.createAttempt({
          id: attemptId,
          userId: input.userId,
          productCode: input.productCode,
          idempotencyKey: input.idempotencyKey,
          status: 'created',
        });
      }

      try {
        const checkout = await dependencies.createProviderCheckout({
          userId: input.userId,
          userEmail: input.userEmail,
          checkoutAttemptId: attemptId,
          productCode: input.productCode,
          providerPriceId: dependencies.resolveProviderPriceId(input.productCode),
          returnUrl: returnUrl.toString(),
        });

        await dependencies.updateAttempt(attemptId, {
          status: 'opened',
          providerTransactionId: checkout.providerTransactionId,
        });

        return {
          attemptId,
          providerTransactionId: checkout.providerTransactionId,
          returnUrl: returnUrl.toString(),
        } as const;
      } catch {
        await dependencies.updateAttempt(attemptId, {
          status: 'failed',
          providerTransactionId: null,
        });
        throw new Error('Checkout creation failed');
      }
    },
  };
}
