import { GET as getLiveness } from '@/app/api/health/live/route';

vi.mock('@/lib/env/server-env', () => ({
  serverEnv: {
    APP_ENVIRONMENT: 'local',
    NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3000',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  },
}));

describe('health routes', () => {
  it('returns a no-store liveness response without sensitive details', async () => {
    const response = getLiveness();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('returns readiness when required configuration is present', async () => {
    const { GET: getReadiness } = await import('@/app/api/health/ready/route');
    const response = getReadiness();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ready' });
  });
});
