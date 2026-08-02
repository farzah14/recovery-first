import { isSuccessfulOutcome, type CheckInOutcome } from '@/domain/check-ins/check-in';

export type ConsistencyMetric = {
  successful: number;
  resolved: number;
  percentage: number | null;
};

export function calculateConsistency(outcomes: readonly CheckInOutcome[]): ConsistencyMetric {
  const resolvedOutcomes = outcomes.filter(
    (outcome) => outcome !== 'excused' && outcome !== 'unrecorded',
  );
  const successful = resolvedOutcomes.filter(isSuccessfulOutcome).length;
  const resolved = resolvedOutcomes.length;

  return {
    successful,
    resolved,
    percentage: resolved === 0 ? null : Number(((successful / resolved) * 100).toFixed(2)),
  };
}

export function calculateContinuity(outcomesOldestToNewest: readonly CheckInOutcome[]): number {
  let continuity = 0;

  for (let index = outcomesOldestToNewest.length - 1; index >= 0; index -= 1) {
    const outcome = outcomesOldestToNewest[index];
    if (outcome === 'full' || outcome === 'minimum') {
      continuity += 1;
      continue;
    }
    if (outcome === 'excused' || outcome === 'unrecorded') continue;
    break;
  }

  return continuity;
}

export function nextManualSkipCounter(currentCount: number, outcome: CheckInOutcome): number {
  if (!Number.isInteger(currentCount) || currentCount < 0) {
    throw new RangeError('currentCount must be a non-negative integer');
  }

  if (outcome === 'full' || outcome === 'minimum') return 0;
  if (outcome === 'manual_skipped') return currentCount + 1;
  return currentCount;
}
