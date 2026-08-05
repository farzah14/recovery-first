import { describe, expect, it } from 'vitest';

import { mapSessionToTodayHabit } from '@/features/today/today-repository-mappers';

describe('today repository mappers', () => {
  it('maps a persisted session into the dashboard vocabulary', () => {
    expect(
      mapSessionToTodayHabit({
        id: '55000000-0000-4000-8000-000000000001',
        habitId: '25000000-0000-4000-8000-000000000001',
        habitVersionId: '35000000-0000-4000-8000-000000000001',
        title: 'Morning Grounding',
        category: 'Mindfulness',
        icon: 'meditation',
        timingContext: '08:00 AM - 09:00 AM',
        habitRevision: 3,
        currentVersionId: '35000000-0000-4000-8000-000000000001',
        normalTarget: {
          action: 'ground',
          quantity: null,
          unit: null,
          estimatedMinutes: null,
          label: '10 minutes grounding',
        },
        minimumTarget: {
          action: 'ground',
          quantity: null,
          unit: null,
          estimatedMinutes: null,
          label: '2 minutes grounding',
        },
        cue: { type: 'time', value: '08:00' },
        scheduledLocalDate: '2026-08-06',
        scheduledLocalTime: '08:00',
        timezoneSnapshot: 'Asia/Jakarta',
        status: 'minimum',
        revision: 2,
        synchronizationState: 'synced',
      }),
    ).toEqual({
      id: '55000000-0000-4000-8000-000000000001',
      habitId: '25000000-0000-4000-8000-000000000001',
      habitVersionId: '35000000-0000-4000-8000-000000000001',
      name: 'Morning Grounding',
      category: 'Mindfulness',
      timingContext: '08:00 AM - 09:00 AM',
      habitRevision: 3,
      currentVersionId: '35000000-0000-4000-8000-000000000001',
      minimumSummary: 'Minimum 2 minutes grounding',
      fullSummary: 'Full 10 minutes grounding',
      outcome: 'minimum',
      icon: 'meditation',
      sessionRevision: 2,
    });
  });
});
