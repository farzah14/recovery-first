export type ActiveLimitResolution =
  | { action: 'pause_existing'; habitId: string }
  | { action: 'keep_draft' }
  | { action: 'create_account' }
  | { action: 'cancel' };

export function activeLimitOptions(planTier: 'guest' | 'free' | 'lite' | 'premium') {
  if (planTier === 'guest') {
    return ['pause_existing', 'create_account', 'keep_draft', 'cancel'] as const;
  }
  if (planTier === 'free') {
    return ['pause_existing', 'keep_draft', 'cancel'] as const;
  }
  return ['pause_existing', 'keep_draft', 'cancel'] as const;
}
