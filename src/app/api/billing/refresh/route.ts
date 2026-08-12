import { handleRefreshRequest } from './handler';

import type { SubscriptionSnapshot } from '@/features/subscriptions/subscription-query';
import {
  createBillingRateLimiter,
  type BillingRateLimiter,
} from '@/server/billing/request-rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RefreshService = Readonly<{
  refresh: (userId: string) => Promise<Readonly<{ kind: string; eventId?: string }>>;
  readSnapshot: (userId: string) => Promise<SubscriptionSnapshot>;
}>;

const productionRateLimiter: BillingRateLimiter = createBillingRateLimiter({
  maxRequests: 5,
  windowMs: 60_000,
});

export async function POST(request: Request): Promise<Response> {
  const { getAuthenticatedUser } = await import('@/lib/supabase/server');
  const { createProductionEntitlementRefreshService } =
    await import('@/server/billing/reconcile-subscription');
  const { createProductionSubscriptionQuery } = await import('@/server/billing/subscription-query');
  const refreshService = createProductionEntitlementRefreshService();
  const query = createProductionSubscriptionQuery();
  const service: RefreshService = {
    refresh: refreshService.refresh,
    readSnapshot: query.readCurrentSnapshot,
  };

  return handleRefreshRequest(request, {
    getUser: getAuthenticatedUser,
    refresh: service.refresh,
    readSnapshot: service.readSnapshot,
    isAllowed: productionRateLimiter.isAllowed,
  });
}
