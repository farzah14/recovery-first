import { spawnSync } from 'node:child_process';

const commands = [
  ['pnpm', ['format:check']],
  ['pnpm', ['lint']],
  ['pnpm', ['typecheck']],
  ['pnpm', ['test']],
  ['pnpm', ['check:env-example']],
  ['pnpm', ['check:repository']],
  ['pnpm', ['build']],
];

for (const [command, arguments_] of commands) {
  const result = spawnSync(command, arguments_, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      APP_ENVIRONMENT: process.env.APP_ENVIRONMENT ?? 'local',
      APP_DEFAULT_LOCALE: process.env.APP_DEFAULT_LOCALE ?? 'en-US',
      APP_DEFAULT_TIMEZONE: process.env.APP_DEFAULT_TIMEZONE ?? 'UTC',
      FEATURE_ANALYTICS: process.env.FEATURE_ANALYTICS ?? 'false',
      FEATURE_PREMIUM: process.env.FEATURE_PREMIUM ?? 'false',
      FEATURE_WEB_PUSH: process.env.FEATURE_WEB_PUSH ?? 'false',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://127.0.0.1:3000',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:55421',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'local-build-key',
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
