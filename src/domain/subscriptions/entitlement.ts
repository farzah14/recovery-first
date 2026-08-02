export const entitlementStatuses = [
  'trial_active',
  'active',
  'grace_period',
  'past_due',
  'cancelled',
  'expired',
  'refunded',
  'revoked',
] as const;

export type EntitlementStatus = (typeof entitlementStatuses)[number];

const paidTierAccessStatuses: ReadonlySet<EntitlementStatus> = new Set([
  'trial_active',
  'active',
  'grace_period',
  'past_due',
  'cancelled',
]);

export function grantsPaidTierAccess(status: EntitlementStatus): boolean {
  return paidTierAccessStatuses.has(status);
}

export function grantsPremiumAccess(status: EntitlementStatus): boolean {
  return status === 'trial_active' || status === 'active' || status === 'grace_period';
}
