import { evaluateReadiness } from '@/lib/health/readiness';
import { serverEnv } from '@/lib/env/server-env';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  const readiness = evaluateReadiness({
    appEnvironment: serverEnv.APP_ENVIRONMENT,
    appUrl: serverEnv.NEXT_PUBLIC_APP_URL,
    supabaseUrl: serverEnv.NEXT_PUBLIC_SUPABASE_URL,
  });

  return Response.json(readiness, {
    status: readiness.status === 'ready' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
