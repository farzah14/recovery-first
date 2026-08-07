import type { PlanTier } from '@/domain/shared/plan-tier';

export type AccountContext = {
  accountId: string;
  displayName: string;
  planTier: PlanTier;
  timezone: string;
};

type AuthUser = {
  id: string;
  email: string | null;
};

type Profile = {
  display_name: string | null;
  plan_code: PlanTier;
  timezone: string;
};

export function buildAccountContext(user: AuthUser, profile: Profile | null): AccountContext {
  const fallbackName = user.email?.split('@')[0]?.trim() || 'Account';
  return {
    accountId: user.id,
    displayName: profile?.display_name?.trim() || fallbackName,
    planTier: profile?.plan_code ?? 'free',
    timezone: profile?.timezone || 'UTC',
  };
}
