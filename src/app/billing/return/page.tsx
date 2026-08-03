import { BillingProcessingState } from '@/features/subscriptions/components/billing-processing-state';

type BillingReturnPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function BillingReturnPage({
  searchParams,
}: BillingReturnPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const attempt = typeof params.attempt === 'string' ? params.attempt : undefined;

  return <BillingProcessingState attempt={attempt} />;
}
