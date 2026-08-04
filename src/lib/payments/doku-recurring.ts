export type DokuRecurringMethod = 'DIRECT_DEBIT_BRI' | 'EMONEY_OVO' | 'CREDIT_CARD';

type DokuRecurringInput = Readonly<{
  invoiceNumber: string;
  customerId: string;
  amount: number;
  currency: 'IDR';
  tokenId: string;
  billingNumber: string;
  interval: 'monthly' | 'annual';
}>;

type DokuRecurringRequest = Readonly<{
  path: string;
  body: Readonly<Record<string, unknown>>;
}>;

export function buildDokuRecurringPaymentRequest(
  method: DokuRecurringMethod,
  input: DokuRecurringInput,
): DokuRecurringRequest {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new Error('DOKU recurring amount is invalid');
  }

  if (method === 'DIRECT_DEBIT_BRI' || method === 'EMONEY_OVO') {
    return {
      path: '/direct-debit/core/v1/debit/payment-host-to-host',
      body: {
        partnerReferenceNo: input.invoiceNumber,
        amount: { value: `${input.amount.toFixed(2)}`, currency: input.currency },
        additionalInfo: {
          channel: method === 'DIRECT_DEBIT_BRI' ? 'DIRECT_DEBIT_BRI_SNAP' : 'OVO',
          paymentType: 'RECURRING',
          tokenId: input.tokenId,
        },
      },
    };
  }

  return {
    path: '/credit-card/charge',
    body: {
      customer: { id: input.customerId },
      order: {
        invoice_number: input.invoiceNumber,
        amount: input.amount,
        currency: input.currency,
      },
      payment: { type: 'RECURRING' },
      card: { token: input.tokenId },
      billing: {
        amount_variability: 'FIXED',
        billing_number: input.billingNumber,
        number_of_payments: 1,
        payment_frequency: input.interval === 'monthly' ? 'MONTHLY' : 'ANNUAL',
      },
    },
  };
}
