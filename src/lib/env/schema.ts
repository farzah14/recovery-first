import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const emptyStringToUndefined = (value: unknown) => (value === '' ? undefined : value);
const optionalString = z.preprocess(emptyStringToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(emptyStringToUndefined, z.url().optional());

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
  NEXT_PUBLIC_ANALYTICS_KEY: optionalString,
  NEXT_PUBLIC_ANALYTICS_HOST: optionalUrl,
});

const serverSchema = clientSchema
  .extend({
    APP_ENVIRONMENT: z.enum(['local', 'preview', 'staging', 'production']),
    APP_DEFAULT_LOCALE: z.string().min(2),
    APP_DEFAULT_TIMEZONE: z.string().min(1),
    PRODUCTION_APP_URL: optionalUrl,
    FEATURE_ANALYTICS: booleanString,
    FEATURE_PREMIUM: booleanString,
    FEATURE_WEB_PUSH: booleanString,
    SUPABASE_SERVICE_ROLE_KEY: optionalString,
    PAYMENT_PROVIDER_SECRET_KEY: optionalString,
    PAYMENT_WEBHOOK_SECRET: optionalString,
    EMAIL_PROVIDER_API_KEY: optionalString,
    WEB_PUSH_VAPID_PRIVATE_KEY: optionalString,
    WEB_PUSH_VAPID_SUBJECT: optionalString,
    SENTRY_AUTH_TOKEN: optionalString,
    CRON_SHARED_SECRET: optionalString,
    DATA_EXPORT_SIGNING_SECRET: optionalString,
  })
  .superRefine((value, context) => {
    if (
      (value.APP_ENVIRONMENT === 'preview' || value.APP_ENVIRONMENT === 'staging') &&
      value.PRODUCTION_APP_URL !== undefined &&
      value.NEXT_PUBLIC_APP_URL === value.PRODUCTION_APP_URL
    ) {
      context.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_APP_URL'],
        message: 'Preview and staging cannot use the production application URL.',
      });
    }
  });

export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function removeUndefinedValues<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T;
}

export function createClientEnv(source: Record<string, string | undefined>): ClientEnv {
  return removeUndefinedValues(clientSchema.parse(source));
}

export function createServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return removeUndefinedValues(serverSchema.parse(source));
}
