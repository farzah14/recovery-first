import { describe, expect, it } from 'vitest';

import {
  mapReminderRegistration,
  normalizeRecommendation,
  summarizeSessionOutcomes,
} from '@/server/account/account-surface-mappers';

describe('account surface mappers', () => {
  it('aggregates persisted outcomes into weekly and insight rates', () => {
    expect(
      summarizeSessionOutcomes([
        { status: 'full' },
        { status: 'minimum' },
        { status: 'manual_skipped' },
        { status: 'unrecorded' },
      ]),
    ).toEqual({
      resolvedSessions: 3,
      successfulSessions: 2,
      minimumSessions: 1,
      fullSessions: 1,
      fullTargetRate: 33.33,
      nonZeroRate: 66.67,
    });
  });

  it('returns null rates when no sessions are resolved', () => {
    expect(summarizeSessionOutcomes([{ status: 'unrecorded' }])).toMatchObject({
      resolvedSessions: 0,
      fullTargetRate: null,
      nonZeroRate: null,
    });
  });

  it('normalizes only readable persisted recommendation text', () => {
    expect(
      normalizeRecommendation({
        explanation_key: 'recommendation.reduce_target.repeated_too_difficult',
        evidence: { summary: 'Evening sessions are often skipped.' },
      }),
    ).toBe('Evening sessions are often skipped.');
    expect(
      normalizeRecommendation({ explanation_key: 'recommendation.unknown', evidence: {} }),
    ).toBeNull();
  });

  it('maps Web Push registration independently from reminder enablement', () => {
    expect(mapReminderRegistration('web_push', true)).toBe('registered');
    expect(mapReminderRegistration('web_push', false)).toBe('needs_permission');
    expect(mapReminderRegistration('email', false)).toBe('not_applicable');
  });
});
