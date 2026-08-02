import { describe, expect, it } from 'vitest';

import { decideBillingTransition } from '@/domain/billing/transition-policy';

const base = {
  currentStatus: 'active' as const,
  currentOccurredAt: new Date('2026-08-01T00:00:00.000Z'),
  currentRevision: 4,
};

describe('billing transition policy', () => {
  it('ignores duplicate provider events', () => {
    expect(
      decideBillingTransition({
        ...base,
        alreadyProcessed: true,
        eventStatus: 'cancelled',
        eventOccurredAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
    ).toEqual({ kind: 'duplicate' });
  });

  it('ignores an event older than the stored provider occurrence time', () => {
    expect(
      decideBillingTransition({
        ...base,
        alreadyProcessed: false,
        eventStatus: 'past_due',
        eventOccurredAt: new Date('2026-07-31T23:59:59.000Z'),
      }),
    ).toEqual({ kind: 'stale' });
  });

  it('applies a newer event exactly once with the next revision', () => {
    expect(
      decideBillingTransition({
        ...base,
        alreadyProcessed: false,
        eventStatus: 'cancelled',
        eventOccurredAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
    ).toEqual({ kind: 'apply', nextStatus: 'cancelled', nextRevision: 5 });
  });
});
