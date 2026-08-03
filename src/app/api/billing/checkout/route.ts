import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const checkoutInputSchema = z.object({
  productCode: z.string().min(1),
  acceptedTerms: z.literal(true),
  idempotencyKey: z.string().uuid(),
});

type CheckoutService = Readonly<{
  createCheckout: (input: z.infer<typeof checkoutInputSchema>) => Promise<{
    attemptId: string;
    providerTransactionId: string;
  }>;
}>;

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function handleCheckoutRequest(
  request: Request,
  service: CheckoutService,
): Promise<Response> {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if ((origin && origin !== requestOrigin) || fetchSite === 'cross-site') {
    return jsonResponse({ error: 'checkout_origin_invalid' }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'checkout_request_invalid' }, 400);
  }

  const parsed = checkoutInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: 'checkout_request_invalid' }, 400);
  }

  try {
    return jsonResponse(await service.createCheckout(parsed.data), 200);
  } catch (error) {
    if (error instanceof Error && error.message === 'authenticated_account_required') {
      return jsonResponse({ error: 'authentication_required' }, 401);
    }

    if (
      error instanceof Error &&
      (error.message === 'Paid subscription already active' ||
        error.message === 'Checkout idempotency key belongs to another product')
    ) {
      return jsonResponse({ error: 'checkout_conflict' }, 409);
    }

    return jsonResponse({ error: 'checkout_creation_failed' }, 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  const { createProductionCheckoutService } = await import('@/server/billing/create-checkout');
  return handleCheckoutRequest(request, createProductionCheckoutService());
}
