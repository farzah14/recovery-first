import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { AuthenticatedAccount } from '@/lib/auth/require-account';
import { requireAccount } from '@/lib/auth/require-account';
import type { ProductOwner } from '@/lib/repositories/product-repository';
import type { Database } from '@/lib/supabase/database.types';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type AccountContextClient = Pick<SupabaseClient<Database>, 'from'>;

type EntitlementRow = Database['public']['Views']['subscription_status_view']['Row'];
type EntitlementProjection = Pick<
  EntitlementRow,
  'product_code' | 'status' | 'valid_from' | 'valid_until'
>;

const activeEntitlementStatuses = new Set(['trial_active', 'active', 'grace_period']);

function hasCurrentEntitlement(row: EntitlementProjection, now: number): boolean {
  if (!row.product_code || !row.status || !activeEntitlementStatuses.has(row.status)) return false;
  const validFrom = row.valid_from ? Date.parse(row.valid_from) : Number.NEGATIVE_INFINITY;
  const validUntil = row.valid_until ? Date.parse(row.valid_until) : Number.POSITIVE_INFINITY;
  return validFrom <= now && now < validUntil;
}

function planTierFromEntitlements(
  rows: EntitlementProjection[],
  now = Date.now(),
): Database['public']['Enums']['plan_tier'] {
  const currentProducts = rows
    .filter((row) => hasCurrentEntitlement(row, now))
    .map((row) => row.product_code ?? '');
  if (
    currentProducts.some(
      (product) =>
        product === 'premium' || product === 'premium_monthly' || product === 'premium_annual',
    )
  ) {
    return 'premium';
  }
  if (
    currentProducts.some(
      (product) => product === 'lite' || product === 'lite_monthly' || product === 'lite_annual',
    )
  ) {
    return 'lite';
  }
  return 'free';
}

export type AuthenticatedAccountContext = {
  id: string;
  email: string | null;
  displayName: string;
  planTier: Database['public']['Enums']['plan_tier'];
  timezone: string;
  owner: ProductOwner;
};

export type AccountContextDependencies = {
  getUser?: () => Promise<AuthenticatedAccount | null>;
  createClient?: () => Promise<AccountContextClient>;
};

export async function getAccountContext(
  dependencies: AccountContextDependencies = {},
): Promise<AuthenticatedAccountContext> {
  const account = await requireAccount(
    dependencies.getUser ? { getUser: dependencies.getUser } : {},
  );
  const client = await (dependencies.createClient ?? createSupabaseServerClient)();
  const [{ data: profile, error: profileError }, { data: entitlements, error: entitlementError }] =
    await Promise.all([
      client
        .from('profiles')
        .select('id,display_name,timezone,plan_code')
        .eq('id', account.id)
        .maybeSingle(),
      client
        .from('subscription_status_view')
        .select('product_code,status,valid_from,valid_until')
        .eq('user_id', account.id),
    ]);

  if (profileError || entitlementError || !profile) {
    throw new Error('account_profile_unavailable');
  }

  const planTier = planTierFromEntitlements(entitlements ?? []);
  const displayName = profile.display_name?.trim() || account.email?.split('@')[0] || 'Account';
  const owner: ProductOwner = {
    ownerId: account.id,
    identityMode: 'account',
    planTier,
    timezone: profile.timezone,
  };

  return {
    id: account.id,
    email: account.email,
    displayName,
    planTier,
    timezone: profile.timezone,
    owner,
  };
}
