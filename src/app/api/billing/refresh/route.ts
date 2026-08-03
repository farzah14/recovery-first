import { NextResponse } from 'next/server';

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

type RefreshRequestDependencies = Readonly<{
  getUser: () => Promise<{ id: string; email: string | null } | null>;
  refresh: (userId: string) => Promise<Readonly<{ kind: string; eventId?: string }>>;
  readSnapshot: (userId: string) => Promise<SubscriptionSnapshot>;
  isAllowed: (key: string) => boolean;
}>;

function response(body: Record<string, unknown>, status: number): Response {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function handleRefreshRequest(
  request: Request,
  dependencies: RefreshRequestDependencies,
): Promise<Response> {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return response({ error: 'refresh_origin_invalid' }, 403);
  }

  const user = await dependencies.getUser();
  if (!user) {
    return response({ error: 'authentication_required' }, 401);
  }

  if (!dependencies.isAllowed(user.id)) {
    return response({ error: 'refresh_rate_limited' }, 429);
  }

  try {
    await dependencies.refresh(user.id);
    return response(await dependencies.readSnapshot(user.id), 200);
  } catch {
    return response({ error: 'refresh_unavailable' }, 503);
  }
}

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
