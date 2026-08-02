import { describe, expect, it } from 'vitest';

import { buildSignInPath, requireAccount, safeReturnPath } from '@/lib/auth/require-account';

describe('account route boundary', () => {
  it('accepts only same-origin application return paths', () => {
    expect(safeReturnPath('/app/today')).toBe('/app/today');
    expect(safeReturnPath('https://evil.example/app')).toBe('/app');
    expect(safeReturnPath('//evil.example/app')).toBe('/app');
    expect(safeReturnPath('/pricing')).toBe('/app');
    expect(buildSignInPath('/app/today')).toBe('/auth/sign-in?returnTo=%2Fapp%2Ftoday');
  });

  it('redirects unauthenticated application access to sign-in', async () => {
    await expect(
      requireAccount({
        getUser: async () => null,
        redirect: (destination) => {
          throw new Error(`redirect:${destination}`);
        },
        returnTo: '/app/habits',
      }),
    ).rejects.toThrow('redirect:/auth/sign-in?returnTo=%2Fapp%2Fhabits');
  });

  it('returns the authenticated account without redirecting', async () => {
    await expect(
      requireAccount({
        getUser: async () => ({ id: 'account-1', email: 'person@example.invalid' }),
      }),
    ).resolves.toEqual({ id: 'account-1', email: 'person@example.invalid' });
  });
});
