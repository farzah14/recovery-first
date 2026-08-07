import { expect, it } from 'vitest';

import { redactBillingMetadata } from '@/lib/payments/redaction';

it('removes billing secrets, payment instruments, raw payloads, and portal URLs', () => {
  expect(
    redactBillingMetadata({
      apiKey: 'secret',
      cardNumber: '4242424242424242',
      rawPayload: '{...}',
      portalUrl: 'https://example.invalid/token',
      eventId: 'evt_1',
      status: 'active',
    }),
  ).toEqual({ eventId: 'evt_1', status: 'active' });
});
