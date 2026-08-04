import 'server-only';

import { createHash } from 'node:crypto';

import type { PaymentProvider } from '@/lib/payments/payment-provider';
import { getDokuBillingConfig } from '@/server/billing/billing-config';

import type { DokuBillingConfig } from './doku-config';
import {
  createDokuClient,
  createDokuRequestHeaders,
  isValidDokuSignature,
  type DokuClient,
} from './doku-client';
import { normalizeDokuNotification } from './doku-normalizer';

type DokuRecord = Record<string, unknown>;

type DokuCheckoutResponse = Readonly<{
  response?: {
    order?: { session_id?: unknown };
    payment?: { url?: unknown };
  };
}>;

type DokuProviderDependencies = Readonly<{
  client: DokuClient;
  config: DokuBillingConfig;
  createInvoiceNumber?: (input: { checkoutAttemptId: string; productCode: string }) => string;
}>;

function asRecord(value: unknown): DokuRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as DokuRecord)
    : {};
}

function hashPayload(payload: string): string {
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} is required`);
  }
  return value;
}

function safeCheckoutUrl(value: unknown, environment: DokuBillingConfig['environment']): string {
  const url = new URL(requiredString(value, 'DOKU Checkout URL'));
  const allowedHosts =
    environment === 'sandbox'
      ? ['sandbox.doku.com', 'jokul.doku.com']
      : ['jokul.doku.com', 'doku.com'];

  if (url.protocol !== 'https:' || !allowedHosts.some((host) => url.hostname === host)) {
    throw new Error('DOKU Checkout URL is invalid');
  }

  return url.toString();
}

function defaultInvoiceNumber(input: { checkoutAttemptId: string; productCode: string }): string {
  const compactAttemptId = input.checkoutAttemptId.replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
  const productTokens: Readonly<Record<string, string>> = {
    lite_monthly: 'LM',
    lite_annual: 'LA',
    premium_monthly: 'PM',
    premium_annual: 'PA',
  };
  const productToken = productTokens[input.productCode] ?? 'XX';
  return `TH-${productToken}-${compactAttemptId}`.slice(0, 30);
}

export function createDokuProvider(dependencies?: DokuProviderDependencies): PaymentProvider {
  const config = dependencies?.config ?? getDokuBillingConfig();
  const resolved = dependencies ?? { client: createDokuClient(config), config };
  const createInvoiceNumber = resolved.createInvoiceNumber ?? defaultInvoiceNumber;

  return {
    async createCheckout(input) {
      const amount = Number(input.providerPriceId);
      if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw new Error('DOKU Checkout amount is invalid');
      }

      const invoiceNumber = createInvoiceNumber({
        checkoutAttemptId: input.checkoutAttemptId,
        productCode: input.productCode,
      });
      const response = await resolved.client.post<DokuCheckoutResponse>('/checkout/v1/payment', {
        order: {
          amount,
          currency: resolved.config.currency,
          invoice_number: invoiceNumber,
          callback_url: input.returnUrl,
          callback_url_result: input.returnUrl,
          auto_redirect: true,
        },
        payment: {
          payment_method_types: resolved.config.checkoutPaymentMethodTypes,
        },
        customer: {
          id: input.userId,
          email: input.userEmail,
        },
        additional_info: {
          product_code: input.productCode,
          checkout_attempt_id: input.checkoutAttemptId,
        },
      });
      const responseRecord = asRecord(response.body);
      const responseData = asRecord(responseRecord.response);
      const order = asRecord(responseData.order);
      const payment = asRecord(responseData.payment);
      const providerTransactionId = requiredString(order.session_id, 'DOKU session ID');
      const checkoutUrl = safeCheckoutUrl(payment.url, resolved.config.environment);

      return { providerTransactionId, checkoutUrl };
    },

    async createCustomerPortal() {
      throw new Error('DOKU customer portal is unsupported; use app-owned subscription settings');
    },

    async verifyWebhook(input) {
      const headers = input.headers ?? {};
      const getHeader = (name: string): string =>
        headers[name] ??
        headers[name.toLowerCase()] ??
        headers[name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] ??
        '';
      const clientId = getHeader('Client-Id');
      const requestId = getHeader('Request-Id');
      const requestTimestamp = getHeader('Request-Timestamp');
      const requestTarget = getHeader('Request-Target');
      const signature = input.signature || getHeader('Signature');

      if (
        clientId !== resolved.config.clientId ||
        requestId.trim() === '' ||
        requestTimestamp.trim() === '' ||
        requestTarget.trim() === '' ||
        signature.trim() === ''
      ) {
        throw new Error('DOKU webhook signature is required');
      }

      const signatureInput = {
        clientId,
        secretKey: resolved.config.secretKey,
        requestId,
        requestTimestamp,
        requestTarget,
        body: input.rawBody,
      } as const;
      const expectedHeaders = createDokuRequestHeaders(signatureInput);
      const digest = getHeader('Digest');
      if (
        digest !== expectedHeaders.Digest ||
        !isValidDokuSignature({ ...signatureInput, signature })
      ) {
        throw new Error('DOKU webhook verification failed');
      }

      return normalizeDokuNotification(JSON.parse(input.rawBody) as unknown, {
        requestId,
        providerPayloadHash: hashPayload(input.rawBody),
      });
    },

    async fetchSubscription() {
      throw new Error('DOKU subscription reconciliation requires the activated recurring API');
    },
  };
}

export type { DokuClient };
