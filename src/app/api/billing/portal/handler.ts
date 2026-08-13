import { NextResponse } from 'next/server';

type PortalService = Readonly<{
  createPortalSession: () => Promise<{ kind: 'unavailable' } | { kind: 'ready'; url: string }>;
}>;

function response(body: Record<string, unknown>, status: number): Response {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

export async function handlePortalRequest(
  request: Request,
  service: PortalService,
): Promise<Response> {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return response({ error: 'portal_origin_invalid' }, 403);
  }

  try {
    const result = await service.createPortalSession();
    if (result.kind === 'unavailable') {
      return response({ error: 'portal_unavailable' }, 404);
    }

    const portalUrl = new URL(result.url);
    if (portalUrl.protocol !== 'https:') {
      throw new Error('portal_url_invalid');
    }

    return response({ url: portalUrl.toString() }, 200);
  } catch (error) {
    if (error instanceof Error && error.message === 'authenticated_account_required') {
      return response({ error: 'authentication_required' }, 401);
    }

    return response({ error: 'portal_unavailable' }, 503);
  }
}
