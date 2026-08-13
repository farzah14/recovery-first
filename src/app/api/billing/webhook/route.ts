import { handleWebhookRequest } from './handler';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const { createProductionWebhookProcessor } = await import('@/server/billing/webhook-runtime');
  return handleWebhookRequest(request, createProductionWebhookProcessor());
}
