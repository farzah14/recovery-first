import type { EntitlementStatus } from '@/domain/subscriptions/entitlement';

type BillingTransitionInput = Readonly<{
  currentStatus: EntitlementStatus;
  currentOccurredAt: Date;
  currentRevision: number;
  alreadyProcessed: boolean;
  eventStatus: EntitlementStatus;
  eventOccurredAt: Date;
}>;

export type BillingTransitionDecision =
  | { kind: 'duplicate' }
  | { kind: 'stale' }
  | { kind: 'apply'; nextStatus: EntitlementStatus; nextRevision: number };

export function decideBillingTransition(input: BillingTransitionInput): BillingTransitionDecision {
  if (input.alreadyProcessed) {
    return { kind: 'duplicate' };
  }

  if (input.eventOccurredAt.getTime() < input.currentOccurredAt.getTime()) {
    return { kind: 'stale' };
  }

  return {
    kind: 'apply',
    nextStatus: input.eventStatus,
    nextRevision: input.currentRevision + 1,
  };
}
