import 'server-only';

import type { PaymentProvider } from './payment-provider';
import { createDokuProvider } from './doku-provider';

export function getPaymentProvider(): PaymentProvider {
  return createDokuProvider();
}
