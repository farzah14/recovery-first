import { NextResponse } from 'next/server';

import { getDokuBillingConfig } from '@/server/billing/billing-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    const config = getDokuBillingConfig();
    return NextResponse.json(
      { currency: config.currency, amounts: config.amounts },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'billing_pricing_unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
