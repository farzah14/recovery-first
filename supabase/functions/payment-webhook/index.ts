type EdgeRuntime = Readonly<{
  env: Readonly<{ get: (name: string) => string | undefined }>;
  serve: (handler: (request: Request) => Response | Promise<Response>) => void;
}>;

const edgeRuntime = (globalThis as typeof globalThis & { Deno?: EdgeRuntime }).Deno;

function resolveForwardUrl(): string | null {
  const configuredUrl = edgeRuntime?.env.get('BILLING_WEBHOOK_FORWARD_URL');
  if (!configuredUrl) {
    return null;
  }

  try {
    const url = new URL(configuredUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function handlePaymentWebhook(request: Request): Promise<Response> {
  const signature = request.headers.get('paddle-signature') ?? '';
  if (signature.trim() === '') {
    return Response.json({ error: 'webhook_signature_required' }, { status: 400 });
  }

  const forwardUrl = resolveForwardUrl();
  if (!forwardUrl) {
    return Response.json({ error: 'webhook_forwarding_unavailable' }, { status: 503 });
  }

  const rawBody = await request.text();
  return fetch(forwardUrl, {
    method: 'POST',
    headers: {
      'content-type': request.headers.get('content-type') ?? 'application/json',
      'paddle-signature': signature,
    },
    body: rawBody,
  });
}

if (edgeRuntime?.serve) {
  edgeRuntime.serve(handlePaymentWebhook);
}
