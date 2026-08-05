import { createServerClient } from '@supabase/ssr';
import { test as base, type Page } from '@playwright/test';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:55421';
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const e2eEmail = process.env.E2E_AUTH_EMAIL ?? 'seed-user@example.invalid';
const e2ePassword = process.env.E2E_AUTH_PASSWORD ?? 'local-development-only';

type AuthenticatedFixtures = {
  authPage: Page;
};

export const test = base.extend<AuthenticatedFixtures>({
  authPage: async ({ context, page }, provide) => {
    if (!supabasePublishableKey) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required for authenticated browser tests',
      );
    }

    const cookieJar = new Map<string, string>();
    const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
      cookies: {
        getAll: () =>
          Array.from(cookieJar, ([name, value]) => ({
            name,
            value,
          })),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => {
            if (value) {
              cookieJar.set(name, value);
            } else {
              cookieJar.delete(name);
            }
          });
        },
      },
    });

    const { error } = await supabase.auth.signInWithPassword({
      email: e2eEmail,
      password: e2ePassword,
    });

    if (error) {
      throw new Error(`Supabase E2E sign-in failed: ${error.message}`);
    }

    await context.addCookies(
      Array.from(cookieJar, ([name, value]) => ({
        name,
        value,
        domain: '127.0.0.1',
        path: '/',
      })),
    );

    await provide(page);
  },
});

export { expect } from '@playwright/test';
