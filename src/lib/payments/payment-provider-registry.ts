import 'server-only';

import type { PaymentProvider } from './payment-provider';
import { createPaddleProvider } from './paddle-provider';

export function getPaymentProvider(): PaymentProvider {
  return createPaddleProvider();
}
