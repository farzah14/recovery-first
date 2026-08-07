import { createClient } from '@supabase/supabase-js';
import { createChunks, stringToBase64URL } from '@supabase/ssr';
import type { BrowserContext } from '@playwright/test';

const seedEmail = 'seed-user@example.invalid';
const seedPassword = 'local-development-only';
const seedUserId = '13000000-0000-4000-8000-000000000001';

function getStorageKey(url: string): string {
  const projectRef = new URL(url).hostname.split('.')[0];
  if (!projectRef)
    throw new Error('Supabase URL must include a project reference in its hostname.');
  return `sb-${projectRef}-auth-token`;
}

export function hasAuthenticatedE2EConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function signInSeedUser(context: BrowserContext): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publishableKey || !serviceRoleKey) {
    throw new Error(
      'Authenticated E2E requires local Supabase URL, publishable key, and service-role key.',
    );
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { error: updateError } = await admin.auth.admin.updateUserById(seedUserId, {
    password: seedPassword,
    email_confirm: true,
  });
  if (updateError) throw new Error(`Local seed-user fixture setup failed: ${updateError.message}`);

  const client = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: seedEmail,
    password: seedPassword,
  });
  if (error || !data.session) {
    throw new Error(`Local seed-user sign-in failed: ${error?.message ?? 'session missing'}`);
  }

  const storageKey = getStorageKey(url);
  const encoded = `base64-${stringToBase64URL(JSON.stringify(data.session))}`;
  const expires = Math.floor(Date.now() / 1000) + data.session.expires_in;
  await context.addCookies(
    createChunks(storageKey, encoded).map(({ name, value }) => ({
      name,
      value,
      domain: '127.0.0.1',
      path: '/',
      expires,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
    })),
  );
}
