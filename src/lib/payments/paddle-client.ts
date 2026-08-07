import 'server-only';

import { Environment, Paddle } from '@paddle/paddle-node-sdk';

import { getBillingConfig } from '@/server/billing/billing-config';

export function createPaddleClient(): Paddle {
  const config = getBillingConfig();

  return new Paddle(config.apiKey, {
    environment: config.environment === 'sandbox' ? Environment.sandbox : Environment.production,
  });
}
