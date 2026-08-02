import { access } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const requiredRouteFiles = [
  'next.config.ts',
  'src/app/layout.tsx',
  'src/app/(public)/page.tsx',
  'src/app/(app)/app/page.tsx',
  'src/app/(app)/app/layout.tsx',
  'src/app/auth/callback/route.ts',
  'src/app/error.tsx',
  'src/app/global-error.tsx',
  'src/app/not-found.tsx',
] as const;

describe('foundation route inventory', () => {
  it.each(requiredRouteFiles)('contains %s', async (file) => {
    await expect(access(file)).resolves.toBeUndefined();
  });
});
