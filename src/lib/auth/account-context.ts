import type { PlanTier } from '@/domain/shared/plan-tier';
import type { WeekStartDay } from '@/lib/dates/local-week';

export type { WeekStartDay } from '@/lib/dates/local-week';

export type AccountContext = {
  accountId: string;
  displayName: string;
  planTier: PlanTier;
  timezone: string;
  weekStart: WeekStartDay;
};

type AuthUser = {
  id: string;
  email: string | null;
};

type Profile = {
  display_name: string | null;
  plan_code: PlanTier;
  timezone: string;
  week_start?: number | null;
};

function normalizeWeekStart(value: number | null | undefined): WeekStartDay {
  return value !== null &&
    value !== undefined &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 7
    ? (value as WeekStartDay)
    : 1;
}

export function buildAccountContext(user: AuthUser, profile: Profile | null): AccountContext {
  const fallbackName = user.email?.split('@')[0]?.trim() || 'Account';
  return {
    accountId: user.id,
    displayName: profile?.display_name?.trim() || fallbackName,
    planTier: profile?.plan_code ?? 'free',
    timezone: profile?.timezone || 'UTC',
    weekStart: normalizeWeekStart(profile?.week_start),
  };
}
