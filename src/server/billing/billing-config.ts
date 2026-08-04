import 'server-only';

import { createBillingConfig } from '@/lib/payments/billing-config';
import { createDokuBillingConfig, type DokuBillingConfig } from '@/lib/payments/doku-config';

export { createBillingConfig } from '@/lib/payments/billing-config';
export type { BillingConfig } from '@/lib/payments/billing-config';
export type { DokuBillingConfig } from '@/lib/payments/doku-config';

export function getBillingConfig() {
  return createBillingConfig(process.env);
}

export function getDokuBillingConfig(): DokuBillingConfig {
  return createDokuBillingConfig(process.env);
}
