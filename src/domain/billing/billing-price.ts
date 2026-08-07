export type BillingPriceMap = Readonly<{
  lite_monthly: number;
  lite_annual: number;
  premium_monthly: number;
  premium_annual: number;
}>;

export function formatBillingPrice(amount: number | undefined): string {
  if (amount === undefined) {
    return 'IDR price unavailable';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
