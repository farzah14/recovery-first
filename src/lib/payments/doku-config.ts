import { z } from 'zod';

import type { BillingProductCode } from '@/domain/billing/product-catalog';

type PaidProductCode = Exclude<BillingProductCode, 'free' | 'lite' | 'premium'>;

export const dokuPaidProductCodes = [
  'lite_monthly',
  'lite_annual',
  'premium_monthly',
  'premium_annual',
] as const satisfies readonly PaidProductCode[];

const recurringMethodSchema = z.enum(['DIRECT_DEBIT_BRI', 'EMONEY_OVO', 'CREDIT_CARD']);

const environmentSchema = z.object({
  BILLING_PROVIDER: z.literal('doku'),
  DOKU_ENVIRONMENT: z.enum(['sandbox', 'production']),
  DOKU_CLIENT_ID: z.string().min(1),
  DOKU_SECRET_KEY: z.string().min(1),
  DOKU_API_BASE_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith('https://'), {
      message: 'DOKU API base URL must use HTTPS',
    }),
  DOKU_NOTIFICATION_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith('https://'), {
      message: 'DOKU notification URL must use HTTPS',
    }),
  DOKU_CURRENCY: z.literal('IDR'),
  DOKU_LITE_MONTHLY_AMOUNT: z.coerce.number().int().positive(),
  DOKU_LITE_ANNUAL_AMOUNT: z.coerce.number().int().positive(),
  DOKU_PREMIUM_MONTHLY_AMOUNT: z.coerce.number().int().positive(),
  DOKU_PREMIUM_ANNUAL_AMOUNT: z.coerce.number().int().positive(),
  DOKU_CHECKOUT_PAYMENT_METHOD_TYPES: z.string().min(1),
  DOKU_RECURRING_METHODS: z.string().min(1),
  BILLING_WEBHOOK_RAW_RETENTION_DAYS: z.coerce.number().int().min(1).max(90),
  BILLING_RECONCILIATION_BATCH_SIZE: z.coerce.number().int().min(1).max(500),
});

export type DokuBillingConfig = Readonly<{
  provider: 'doku';
  environment: 'sandbox' | 'production';
  clientId: string;
  secretKey: string;
  apiBaseUrl: string;
  notificationUrl: string;
  currency: 'IDR';
  amounts: Readonly<Record<(typeof dokuPaidProductCodes)[number], number>>;
  checkoutPaymentMethodTypes: readonly string[];
  recurringMethods: readonly z.infer<typeof recurringMethodSchema>[];
  webhookRawRetentionDays: number;
  reconciliationBatchSize: number;
}>;

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function createDokuBillingConfig(
  source: Record<string, string | undefined>,
): DokuBillingConfig {
  const parsed = environmentSchema.parse(source);
  const checkoutPaymentMethodTypes = parseList(parsed.DOKU_CHECKOUT_PAYMENT_METHOD_TYPES);
  const recurringMethods = parseList(parsed.DOKU_RECURRING_METHODS).map((method) =>
    recurringMethodSchema.parse(method),
  );

  if (checkoutPaymentMethodTypes.length === 0 || recurringMethods.length === 0) {
    throw new Error('DOKU payment method configuration is required');
  }

  return {
    provider: 'doku',
    environment: parsed.DOKU_ENVIRONMENT,
    clientId: parsed.DOKU_CLIENT_ID,
    secretKey: parsed.DOKU_SECRET_KEY,
    apiBaseUrl: parsed.DOKU_API_BASE_URL.replace(/\/$/, ''),
    notificationUrl: parsed.DOKU_NOTIFICATION_URL,
    currency: parsed.DOKU_CURRENCY,
    amounts: {
      lite_monthly: parsed.DOKU_LITE_MONTHLY_AMOUNT,
      lite_annual: parsed.DOKU_LITE_ANNUAL_AMOUNT,
      premium_monthly: parsed.DOKU_PREMIUM_MONTHLY_AMOUNT,
      premium_annual: parsed.DOKU_PREMIUM_ANNUAL_AMOUNT,
    },
    checkoutPaymentMethodTypes,
    recurringMethods,
    webhookRawRetentionDays: parsed.BILLING_WEBHOOK_RAW_RETENTION_DAYS,
    reconciliationBatchSize: parsed.BILLING_RECONCILIATION_BATCH_SIZE,
  };
}
