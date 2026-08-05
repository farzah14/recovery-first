import { describe, expect, it } from 'vitest';

import {
  decodeHabitVersionPayload,
  encodeHabitVersionPayload,
  mapSessionStatusToOutcome,
} from '@/lib/repositories/habit-payload';

describe('habit Supabase payload contract', () => {
  it('round-trips habit presentation and scheduling metadata', () => {
    const encoded = encodeHabitVersionPayload({
      description: 'A short grounding practice.',
      icon: 'meditation',
      fromTime: '08:00',
      untilTime: '09:00',
      timingContext: '08:00 AM - 09:00 AM',
      startLocalDate: '2026-08-06',
      recurrence: { kind: 'daily' },
      cue: { type: 'time', value: '08:00' },
    });

    expect(decodeHabitVersionPayload(encoded)).toEqual({
      description: 'A short grounding practice.',
      icon: 'meditation',
      fromTime: '08:00',
      untilTime: '09:00',
      timingContext: '08:00 AM - 09:00 AM',
      startLocalDate: '2026-08-06',
      recurrence: { kind: 'daily' },
      cue: { type: 'time', value: '08:00' },
    });
  });

  it('maps database session statuses to the UI outcome vocabulary', () => {
    expect(mapSessionStatusToOutcome('full')).toBe('full');
    expect(mapSessionStatusToOutcome('minimum')).toBe('minimum');
    expect(mapSessionStatusToOutcome('manual_skipped')).toBe('skipped');
    expect(mapSessionStatusToOutcome('automatic_skipped')).toBe('skipped');
    expect(mapSessionStatusToOutcome('unrecorded')).toBe('unrecorded');
  });
});
