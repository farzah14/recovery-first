import type { BillingProductCode } from '@/domain/billing/product-catalog';
import { z } from 'zod';

type PaidProductCode = Exclude<BillingProductCode, 'free' | 'lite' | 'premium'>;

const environmentSchema = z.object({
  BILLING_PROVIDER: z.literal('paddle'),
  PADDLE_ENVIRONMENT: z.enum(['sandbox', 'production']),
  PADDLE_API_KEY: z.string().min(1),
  PADDLE_NOTIFICATION_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().min(1),
  PADDLE_LITE_MONTHLY_PRICE_ID: z.string().startsWith('pri_'),
  PADDLE_LITE_ANNUAL_PRICE_ID: z.string().startsWith('pri_'),
  PADDLE_PREMIUM_MONTHLY_PRICE_ID: z.string().startsWith('pri_'),
  PADDLE_PREMIUM_ANNUAL_PRICE_ID: z.string().startsWith('pri_'),
  BILLING_WEBHOOK_RAW_RETENTION_DAYS: z.coerce.number().int().min(1).max(90),
  BILLING_RECONCILIATION_BATCH_SIZE: z.coerce.number().int().min(1).max(500),
});

export type BillingConfig = Readonly<{
  provider: 'paddle';
  environment: 'sandbox' | 'production';
  apiKey: string;
  webhookSecret: string;
  clientToken: string;
  priceIds: Readonly<Record<PaidProductCode, string>>;
  webhookRawRetentionDays: number;
  reconciliationBatchSize: number;
}>;

export function createBillingConfig(source: Record<string, string | undefined>): BillingConfig {
  const parsed = environmentSchema.parse(source);

  return {
    provider: parsed.BILLING_PROVIDER,
    environment: parsed.PADDLE_ENVIRONMENT,
    apiKey: parsed.PADDLE_API_KEY,
    webhookSecret: parsed.PADDLE_NOTIFICATION_WEBHOOK_SECRET,
    clientToken: parsed.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    priceIds: {
      lite_monthly: parsed.PADDLE_LITE_MONTHLY_PRICE_ID,
      lite_annual: parsed.PADDLE_LITE_ANNUAL_PRICE_ID,
      premium_monthly: parsed.PADDLE_PREMIUM_MONTHLY_PRICE_ID,
      premium_annual: parsed.PADDLE_PREMIUM_ANNUAL_PRICE_ID,
    },
    webhookRawRetentionDays: parsed.BILLING_WEBHOOK_RAW_RETENTION_DAYS,
    reconciliationBatchSize: parsed.BILLING_RECONCILIATION_BATCH_SIZE,
  };
}
