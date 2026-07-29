import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const requiredKeys = [
  'APP_ENVIRONMENT',
  'APP_DEFAULT_LOCALE',
  'APP_DEFAULT_TIMEZONE',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'FEATURE_ANALYTICS',
  'FEATURE_PREMIUM',
  'FEATURE_WEB_PUSH',
];

export async function checkEnvironmentExample(path = '.env.example') {
  const source = await readFile(path, 'utf8');
  const keys = new Set(
    source
      .split(/\r?\n/)
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => line.split('=', 1)[0]),
  );

  const missing = requiredKeys.filter((key) => !keys.has(key));

  if (missing.length > 0) {
    throw new Error(`Missing .env.example keys: ${missing.join(', ')}`);
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await checkEnvironmentExample(process.argv[2]);
  process.stdout.write('.env.example contains all required foundation keys.\n');
}
