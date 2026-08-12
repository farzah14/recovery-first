import { handleBillingStatusRequest } from './handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const { getAuthenticatedUser } = await import('@/lib/supabase/server');
  const { createProductionSubscriptionQuery } = await import('@/server/billing/subscription-query');
  const query = createProductionSubscriptionQuery();

  return handleBillingStatusRequest(request, {
    getUser: getAuthenticatedUser,
    readSnapshot: query.readSnapshot,
  });
}
