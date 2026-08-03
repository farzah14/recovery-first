import 'server-only';

import { createBillingConfig } from '@/lib/payments/billing-config';

export { createBillingConfig } from '@/lib/payments/billing-config';
export type { BillingConfig } from '@/lib/payments/billing-config';

export function getBillingConfig() {
  return createBillingConfig(process.env);
}
