import 'server-only';

import { createHash } from 'node:crypto';

import type { BillingConfig } from '@/lib/payments/billing-config';
import { getBillingConfig } from '@/server/billing/billing-config';
import type { PaymentProvider } from '@/lib/payments/payment-provider';

import { createPaddleClient } from './paddle-client';
import {
  normalizeFetchedPaddleSubscription,
  normalizePaddleSubscriptionEvent,
} from './paddle-normalizer';

type PaddleTransactionClient = Readonly<{
  create: (input: {
    items: Array<{ priceId: string; quantity: number }>;
    customData?: Record<string, string>;
    checkout?: { url: string };
  }) => Promise<{ id: string }>;
}>;

type PaddlePortalClient = Readonly<{
  create: (
    customerId: string,
    subscriptionIds: string[],
  ) => Promise<{ urls: { general: { overview: string } } }>;
}>;

type PaddleSubscriptionClient = Readonly<{
  get: (subscriptionId: string) => Promise<unknown>;
}>;

type PaddleWebhookClient = Readonly<{
  unmarshal: (rawBody: string, secret: string, signature: string) => Promise<unknown>;
}>;

export type PaddleClient = Readonly<{
  transactions: PaddleTransactionClient;
  customerPortalSessions: PaddlePortalClient;
  subscriptions: PaddleSubscriptionClient;
  webhooks: PaddleWebhookClient;
}>;

type PaddleProviderDependencies = Readonly<{
  client: PaddleClient;
  config: BillingConfig;
  hashPayload?: (payload: string) => string;
}>;

function sha256(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

function hashValue(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error('Unable to serialize provider response for reconciliation');
  }

  return sha256(serialized);
}

export function createPaddleProvider(dependencies?: PaddleProviderDependencies): PaymentProvider {
  const resolved: PaddleProviderDependencies = dependencies ?? {
    client: createPaddleClient(),
    config: getBillingConfig(),
  };
  const hashPayload = resolved.hashPayload ?? sha256;

  return {
    async createCheckout(input) {
      const transaction = await resolved.client.transactions.create({
        items: [{ priceId: input.providerPriceId, quantity: 1 }],
        customData: {
          userId: input.userId,
          checkoutAttemptId: input.checkoutAttemptId,
          productCode: input.productCode,
        },
        checkout: { url: input.returnUrl },
      });

      return { providerTransactionId: transaction.id };
    },

    async createCustomerPortal(input) {
      const session = await resolved.client.customerPortalSessions.create(
        input.providerCustomerId,
        [input.providerSubscriptionId],
      );

      return { url: session.urls.general.overview };
    },

    async verifyWebhook(input) {
      if (input.signature.trim() === '') {
        throw new Error('Paddle webhook signature is required');
      }

      let event: unknown;
      try {
        event = await resolved.client.webhooks.unmarshal(
          input.rawBody,
          resolved.config.webhookSecret,
          input.signature,
        );
      } catch {
        throw new Error('Paddle webhook verification failed');
      }

      return normalizePaddleSubscriptionEvent(event, {
        priceIds: resolved.config.priceIds,
        providerPayloadHash: hashPayload(input.rawBody),
      });
    },

    async fetchSubscription(providerSubscriptionId) {
      const subscription = await resolved.client.subscriptions.get(providerSubscriptionId);

      return normalizeFetchedPaddleSubscription(subscription, {
        priceIds: resolved.config.priceIds,
        providerPayloadHash: hashValue(subscription),
      });
    },
  };
}
