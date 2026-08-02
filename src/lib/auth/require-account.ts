import { redirect as nextRedirect } from 'next/navigation';

export type AuthenticatedAccount = {
  id: string;
  email: string | null;
};

type RequireAccountOptions = {
  getUser?: () => Promise<AuthenticatedAccount | null>;
  redirect?: (destination: string) => never;
  returnTo?: string;
};

export function safeReturnPath(value: string | undefined): string {
  if (value && value.startsWith('/app/') && !value.startsWith('//')) {
    return value;
  }

  if (value === '/app') {
    return value;
  }

  return '/app';
}

export function buildSignInPath(returnTo: string | undefined): string {
  return `/auth/sign-in?returnTo=${encodeURIComponent(safeReturnPath(returnTo))}`;
}

export async function requireAccount({
  getUser,
  redirect = nextRedirect,
  returnTo = '/app',
}: RequireAccountOptions = {}): Promise<AuthenticatedAccount> {
  const resolveUser =
    getUser ??
    (async () => {
      const { getAuthenticatedUser } = await import('@/lib/supabase/server');
      return getAuthenticatedUser();
    });
  const user = await resolveUser();

  if (!user) {
    redirect(buildSignInPath(returnTo));
    throw new Error('account_redirect_failed');
  }

  return user;
}
