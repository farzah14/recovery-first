export type ReadinessResult =
  | Readonly<{ status: 'ready' }>
  | Readonly<{ status: 'not_ready'; missing: readonly string[] }>;

export function evaluateReadiness({
  appEnvironment,
  appUrl,
  supabaseUrl,
}: Readonly<{
  appEnvironment: string;
  appUrl: string;
  supabaseUrl: string;
}>): ReadinessResult {
  const requiredValues: ReadonlyArray<readonly [string, string]> = [
    ['APP_ENVIRONMENT', appEnvironment],
    ['NEXT_PUBLIC_APP_URL', appUrl],
    ['NEXT_PUBLIC_SUPABASE_URL', supabaseUrl],
  ];
  const missing = requiredValues
    .filter(([, value]) => value.length === 0)
    .map(([key]) => key);

  return missing.length === 0 ? { status: 'ready' } : { status: 'not_ready', missing };
}
