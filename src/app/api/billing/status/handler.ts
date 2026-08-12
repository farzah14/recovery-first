import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { SubscriptionSnapshot } from '@/features/subscriptions/subscription-query';

const attemptSchema = z.string().uuid();

type StatusRouteDependencies = Readonly<{
  getUser: () => Promise<{ id: string } | null>;
  readSnapshot: (userId: string, attemptId: string) => Promise<SubscriptionSnapshot | null>;
}>;

function response(body: Record<string, unknown>, status: number): Response {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function boundedSnapshot(snapshot: SubscriptionSnapshot): SubscriptionSnapshot {
  return {
    status: snapshot.status,
    planCode: snapshot.planCode,
    premium: snapshot.premium,
    validUntil: snapshot.validUntil,
    cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
    checkoutAttemptStatus: snapshot.checkoutAttemptStatus,
    revision: snapshot.revision,
  };
}

export async function handleBillingStatusRequest(
  request: Request,
  dependencies: StatusRouteDependencies,
): Promise<Response> {
  const attempt = attemptSchema.safeParse(new URL(request.url).searchParams.get('attempt'));
  if (!attempt.success) {
    return response({ error: 'attempt_invalid' }, 400);
  }

  const user = await dependencies.getUser();
  if (!user) {
    return response({ error: 'authentication_required' }, 401);
  }

  try {
    const snapshot = await dependencies.readSnapshot(user.id, attempt.data);
    if (!snapshot) {
      return response({ error: 'checkout_attempt_not_found' }, 404);
    }

    return response(boundedSnapshot(snapshot), 200);
  } catch {
    return response({ error: 'billing_status_unavailable' }, 503);
  }
}
