import { createClientEnv, createServerEnv } from '@/lib/env/schema';

const publicValues = {
  NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3000',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'local-publishable-key',
};

describe('environment schema', () => {
  it('parses the required browser-safe configuration', () => {
    expect(createClientEnv(publicValues)).toEqual(publicValues);
  });

  it('rejects an invalid public application URL', () => {
    expect(() =>
      createClientEnv({ ...publicValues, NEXT_PUBLIC_APP_URL: 'not-a-url' }),
    ).toThrow();
  });

  it('parses shared server configuration', () => {
    expect(
      createServerEnv({
        ...publicValues,
        APP_ENVIRONMENT: 'local',
        APP_DEFAULT_LOCALE: 'en-US',
        APP_DEFAULT_TIMEZONE: 'UTC',
        FEATURE_ANALYTICS: 'false',
        FEATURE_PREMIUM: 'false',
        FEATURE_WEB_PUSH: 'false',
      }),
    ).toMatchObject({
      APP_ENVIRONMENT: 'local',
      APP_DEFAULT_LOCALE: 'en-US',
      APP_DEFAULT_TIMEZONE: 'UTC',
      FEATURE_ANALYTICS: false,
      FEATURE_PREMIUM: false,
      FEATURE_WEB_PUSH: false,
    });
  });

  it('treats blank optional values as absent', () => {
    expect(
      createServerEnv({
        ...publicValues,
        APP_ENVIRONMENT: 'local',
        APP_DEFAULT_LOCALE: 'en-US',
        APP_DEFAULT_TIMEZONE: 'UTC',
        PRODUCTION_APP_URL: '',
        NEXT_PUBLIC_SENTRY_DSN: '',
        NEXT_PUBLIC_ANALYTICS_KEY: '',
        NEXT_PUBLIC_ANALYTICS_HOST: '',
        FEATURE_ANALYTICS: 'false',
        FEATURE_PREMIUM: 'false',
        FEATURE_WEB_PUSH: 'false',
        SUPABASE_SERVICE_ROLE_KEY: '',
      }),
    ).not.toHaveProperty('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('rejects a production application URL in preview', () => {
    expect(() =>
      createServerEnv({
        ...publicValues,
        APP_ENVIRONMENT: 'preview',
        NEXT_PUBLIC_APP_URL: 'https://recovery-first.example.com',
        PRODUCTION_APP_URL: 'https://recovery-first.example.com',
        APP_DEFAULT_LOCALE: 'en-US',
        APP_DEFAULT_TIMEZONE: 'UTC',
        FEATURE_ANALYTICS: 'false',
        FEATURE_PREMIUM: 'false',
        FEATURE_WEB_PUSH: 'false',
      }),
    ).toThrow('Preview and staging cannot use the production application URL.');
  });
});
