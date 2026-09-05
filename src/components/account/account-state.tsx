'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { PlanTier } from '@/domain/shared/plan-tier';
import type { WeekStartDay } from '@/lib/dates/local-week';

export type AccountState = {
  accountId?: string;
  displayName: string;
  planTier: PlanTier;
  timezone?: string;
  weekStart?: WeekStartDay;
  entitlementStatus?:
    'resolved' | 'loading' | 'unavailable' | 'downgrade_required' | 'legacy_recovery';
};

const defaultAccountState: AccountState = {
  displayName: 'Account',
  planTier: 'free',
  timezone: 'UTC',
  weekStart: 1,
  entitlementStatus: 'resolved',
};

const planTierLabels: Readonly<Record<PlanTier, string>> = {
  free: 'Free',
  lite: 'Lite',
  premium: 'Premium',
};

const AccountStateContext = createContext<AccountState>(defaultAccountState);

export function AccountStateProvider({
  account,
  children,
}: {
  account: AccountState;
  children: ReactNode;
}): React.JSX.Element {
  return <AccountStateContext.Provider value={account}>{children}</AccountStateContext.Provider>;
}

export function useAccountState(): AccountState {
  return useContext(AccountStateContext);
}

export function planTierLabel(planTier: PlanTier): string {
  return planTierLabels[planTier];
}

export function AccountTierSummary(): React.JSX.Element {
  const account = useAccountState();
  const label = planTierLabel(account.planTier);

  return (
    <>
      <span>{account.displayName}</span>
      <span aria-hidden="true"> — </span>
      <span>{label} Plan</span>
    </>
  );
}

export function AccountTierNotice(): React.JSX.Element | null {
  const status = useAccountState().entitlementStatus ?? 'resolved';
  const messages = {
    loading: 'Checking your plan status…',
    unavailable: 'Plan status is temporarily unavailable. We will retry shortly.',
    downgrade_required: 'Choose a plan to keep active habits above your current limit.',
    legacy_recovery: 'Legacy browser data is available for explicit recovery or export.',
    resolved: '',
  } as const;
  const message = messages[status];

  return message ? (
    <p aria-live="polite" className="text-xs text-[var(--color-text-muted)]">
      {message}
    </p>
  ) : null;
}
