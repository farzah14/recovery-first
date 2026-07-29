import { evaluateReadiness } from '@/lib/health/readiness';

describe('evaluateReadiness', () => {
  it('returns ready when required configuration is present', () => {
    expect(
      evaluateReadiness({
        appEnvironment: 'local',
        appUrl: 'http://127.0.0.1:3000',
        supabaseUrl: 'http://127.0.0.1:54321',
      }),
    ).toEqual({ status: 'ready' });
  });

  it('returns not_ready with non-sensitive missing keys', () => {
    expect(
      evaluateReadiness({
        appEnvironment: '',
        appUrl: 'http://127.0.0.1:3000',
        supabaseUrl: '',
      }),
    ).toEqual({
      status: 'not_ready',
      missing: ['APP_ENVIRONMENT', 'NEXT_PUBLIC_SUPABASE_URL'],
    });
  });
});
