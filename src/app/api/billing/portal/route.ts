import { handlePortalRequest } from './handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  const { createProductionPortalService } = await import('@/server/billing/create-portal-session');
  return handlePortalRequest(request, createProductionPortalService());
}
