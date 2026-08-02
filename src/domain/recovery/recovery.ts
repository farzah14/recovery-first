export const recoveryPlanStatuses = [
  'proposed',
  'active',
  'deferred',
  'succeeded',
  'failed',
  'cancelled',
] as const;

export type RecoveryPlanStatus = (typeof recoveryPlanStatuses)[number];

export type RecoveryEligibility =
  { eligible: true } | { eligible: false; remainingManualSkips: number };

export function evaluateRecoveryEligibility(consecutiveManualSkips: number): RecoveryEligibility {
  if (!Number.isInteger(consecutiveManualSkips) || consecutiveManualSkips < 0) {
    throw new RangeError('consecutiveManualSkips must be a non-negative integer');
  }

  if (consecutiveManualSkips >= 3) return { eligible: true };
  return { eligible: false, remainingManualSkips: 3 - consecutiveManualSkips };
}

export function evaluateRecoveryPlan({
  completedSessions,
  successfulSessions,
  durationSessions,
  successThreshold,
}: {
  completedSessions: number;
  successfulSessions: number;
  durationSessions: number;
  successThreshold: number;
}): 'active' | 'succeeded' | 'failed' {
  if (completedSessions < durationSessions) return 'active';
  return successfulSessions >= successThreshold ? 'succeeded' : 'failed';
}
