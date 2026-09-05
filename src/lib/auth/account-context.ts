import type { PlanTier } from '@/domain/shared/plan-tier';

export type AccountContext = {
  accountId: string;
  displayName: string;
  planTier: PlanTier;
  timezone: string;
  entitlementStatus: 'resolved' | 'unavailable';
};

type AuthUser = {
  id: string;
  email: string | null;
};

type Profile = {
  display_name: string | null;
  timezone: string;
};

export type AccountContextOptions = {
  planTier?: PlanTier;
  entitlementStatus?: AccountContext['entitlementStatus'];
};

export function buildAccountContext(
  user: AuthUser,
  profile: Profile | null,
  options: AccountContextOptions = {},
): AccountContext {
  const fallbackName = user.email?.split('@')[0]?.trim() || 'Account';
  return {
    accountId: user.id,
    displayName: profile?.display_name?.trim() || fallbackName,
    planTier: options.planTier ?? 'free',
    timezone: profile?.timezone || 'UTC',
    entitlementStatus: options.entitlementStatus ?? 'resolved',
  };
}
