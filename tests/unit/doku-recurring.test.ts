import { describe, expect, it } from 'vitest';

import { buildDokuRecurringPaymentRequest } from '@/lib/payments/doku-recurring';

const input = {
  invoiceNumber: 'TH-PM-renewal-01',
  customerId: 'user-01',
  amount: 99000,
  currency: 'IDR' as const,
  tokenId: 'token-01',
  billingNumber: 'billing-01',
  interval: 'monthly' as const,
};

describe('DOKU recurring payment request builders', () => {
  it('builds BRI Direct Debit recurring requests with a token and recurring scheme', () => {
    expect(buildDokuRecurringPaymentRequest('DIRECT_DEBIT_BRI', input)).toEqual({
      path: '/direct-debit/core/v1/debit/payment-host-to-host',
      body: {
        partnerReferenceNo: 'TH-PM-renewal-01',
        amount: { value: '99000.00', currency: 'IDR' },
        additionalInfo: {
          channel: 'DIRECT_DEBIT_BRI_SNAP',
          paymentType: 'RECURRING',
          tokenId: 'token-01',
        },
      },
    });
  });

  it('builds OVO recurring requests with the recurring payment type', () => {
    expect(buildDokuRecurringPaymentRequest('EMONEY_OVO', input)).toMatchObject({
      path: '/direct-debit/core/v1/debit/payment-host-to-host',
      body: {
        partnerReferenceNo: 'TH-PM-renewal-01',
        additionalInfo: { channel: 'OVO', paymentType: 'RECURRING', tokenId: 'token-01' },
      },
    });
  });

  it('builds card recurring requests with a stable billing number', () => {
    expect(buildDokuRecurringPaymentRequest('CREDIT_CARD', input)).toEqual({
      path: '/credit-card/charge',
      body: {
        customer: { id: 'user-01' },
        order: {
          invoice_number: 'TH-PM-renewal-01',
          amount: 99000,
          currency: 'IDR',
        },
        payment: { type: 'RECURRING' },
        card: { token: 'token-01' },
        billing: {
          amount_variability: 'FIXED',
          billing_number: 'billing-01',
          number_of_payments: 1,
          payment_frequency: 'MONTHLY',
        },
      },
    });
  });
});
