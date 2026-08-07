import { describe, expect, it, vi } from 'vitest';

import { handlePortalRequest } from '@/app/api/billing/portal/route';

describe('portal route', () => {
  it('requires authentication and prevents response caching', async () => {
    const response = await handlePortalRequest(
      new Request('https://tracker.example/api/billing/portal', { method: 'POST' }),
      {
        createPortalSession: vi.fn().mockRejectedValue(new Error('authenticated_account_required')),
      },
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
  });

  it('returns a temporary URL only for a same-origin request', async () => {
    const response = await handlePortalRequest(
      new Request('https://tracker.example/api/billing/portal', {
        method: 'POST',
        headers: { origin: 'https://tracker.example' },
      }),
      {
        createPortalSession: vi
          .fn()
          .mockResolvedValue({ kind: 'ready', url: 'https://portal.example/x' }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: 'https://portal.example/x' });
  });

  it('rejects cross-origin requests before invoking the provider', async () => {
    const createPortalSession = vi.fn();
    const response = await handlePortalRequest(
      new Request('https://tracker.example/api/billing/portal', {
        method: 'POST',
        headers: { origin: 'https://evil.example' },
      }),
      { createPortalSession },
    );

    expect(response.status).toBe(403);
    expect(createPortalSession).not.toHaveBeenCalled();
  });

  it('does not return a non-HTTPS portal URL', async () => {
    const response = await handlePortalRequest(
      new Request('https://tracker.example/api/billing/portal', { method: 'POST' }),
      {
        createPortalSession: vi
          .fn()
          .mockResolvedValue({ kind: 'ready', url: 'http://portal.example/x' }),
      },
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'portal_unavailable' });
  });
});
