'use client';

import type { AccountState } from '@/components/account/account-state';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';
import { createSupabaseProductRepository } from '@/lib/repositories/signed-in/supabase-product-repository';

function hasConfiguredSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return false;

  try {
    const parsed = new URL(url);
    const isLocalLoopback =
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
    return (parsed.protocol === 'https:' || isLocalLoopback) && publishableKey.length > 0;
  } catch {
    return false;
  }
}

export function createBrowserProductRepository(
  account: Pick<AccountState, 'accountId' | 'planTier' | 'timezone' | 'weekStart'>,
): ProductRepository | null {
  const owner = getBrowserProductOwner(account);
  if (!owner || !hasConfiguredSupabase()) return null;

  return createSupabaseProductRepository({
    client: createSupabaseBrowserClient(),
    owner,
  });
}

export function getBrowserProductOwner(
  account: Pick<AccountState, 'accountId' | 'planTier' | 'timezone' | 'weekStart'>,
): ProductOwner | null {
  if (!account.accountId) return null;
  return {
    ownerId: account.accountId,
    identityMode: 'account',
    planTier: account.planTier,
    timezone: account.timezone ?? 'UTC',
    weekStart: account.weekStart ?? 1,
  };
}
