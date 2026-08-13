import { handleCheckoutRequest } from './handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  const { createProductionCheckoutService } = await import('@/server/billing/create-checkout');
  return handleCheckoutRequest(request, createProductionCheckoutService());
}
