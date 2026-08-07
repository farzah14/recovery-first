import { describe, expect, it } from 'vitest';

import {
  calculateSessionHorizon,
  generateSessionsForCommand,
  zonedLocalDateTimeToUtc,
} from '@/features/sessions/application/ensure-session-horizon';
import type { CreateHabitCommand } from '@/lib/repositories/product-repository';

const command: CreateHabitCommand = {
  commandId: '00000000-0000-4000-8000-000000000601',
  habitId: '00000000-0000-4000-8000-000000000602',
  habitVersionId: '00000000-0000-4000-8000-000000000603',
  owner: {
    ownerId: 'guest-1',
    identityMode: 'guest' as const,
    planTier: 'guest' as const,
    timezone: 'Asia/Jakarta',
  },
  title: 'Read',
  category: 'learning',
  normalTarget: {
    action: 'Read 20 minutes',
    quantity: 20,
    unit: 'minutes',
    estimatedMinutes: 20,
  },
  minimumTarget: {
    action: 'Read one page',
    quantity: 1,
    unit: 'page',
    estimatedMinutes: 3,
  },
  recurrence: { kind: 'weekdays', weekdays: [1, 3, 5] },
  cue: { type: 'time' as const, value: '20:00' },
  reminderIntent: { enabled: false, localTime: null },
  startLocalDate: '2026-07-29',
  activate: true,
  clientCreatedAt: '2026-07-29T03:00:00.000Z',
};

describe('session horizon', () => {
  it('covers the prior three days, today, and next thirty-one days', () => {
    expect(calculateSessionHorizon('2026-07-29')).toEqual({
      fromLocalDate: '2026-07-26',
      throughLocalDate: '2026-08-29',
    });
  });

  it('converts local boundaries using the session timezone snapshot', () => {
    expect(zonedLocalDateTimeToUtc('2026-07-29', '00:00:00', 'Asia/Jakarta')).toBe(
      '2026-07-28T17:00:00.000Z',
    );
  });

  it('generates deterministic unique sessions only for eligible weekdays', () => {
    const first = generateSessionsForCommand(command);
    const replay = generateSessionsForCommand(command);
    expect(replay).toEqual(first);
    expect(new Set(first.map((session) => session.id)).size).toBe(first.length);
    expect(first.every((session) => session.habitVersionId === command.habitVersionId)).toBe(true);
  });

  it('uses the earliest matching instant for an ambiguous daylight-saving time', () => {
    expect(zonedLocalDateTimeToUtc('2026-11-01', '01:30:00', 'America/New_York')).toBe(
      '2026-11-01T05:30:00.000Z',
    );
  });

  it('rejects nonexistent daylight-saving times and invalid IANA timezones', () => {
    expect(() => zonedLocalDateTimeToUtc('2026-03-08', '02:30:00', 'America/New_York')).toThrow(
      'local_datetime_cannot_be_resolved',
    );
    expect(() => zonedLocalDateTimeToUtc('2026-07-29', '00:00:00', 'Invalid/Timezone')).toThrow(
      /Invalid time zone/,
    );
  });

  it('generates finite-date recurrence only for the declared dates', () => {
    const finiteCommand = {
      ...command,
      recurrence: { kind: 'finite_dates' as const, dates: ['2026-07-30', '2026-08-04'] },
      cue: { type: 'none' as const, value: null },
    };
    expect(
      generateSessionsForCommand(finiteCommand).map((session) => session.scheduledLocalDate),
    ).toEqual(['2026-07-30', '2026-08-04']);
  });
});
