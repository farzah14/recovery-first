import { describe, expect, it } from 'vitest';

import {
  isSupportedTimezone,
  isValidQuietHoursPair,
  normalizeHabitInput,
  normalizeProfileInput,
  ONBOARDING_STEPS,
  WEEK_START_OPTIONS,
} from '@/domain/onboarding/profile-onboarding';

describe('onboarding domain rules', () => {
  it('defines the ordered onboarding steps', () => {
    expect(ONBOARDING_STEPS).toEqual(['consent', 'profile', 'first-habit']);
  });

  it('recognizes supported timezones and rejects unknown ones', () => {
    expect(isSupportedTimezone('Asia/Jakarta')).toBe(true);
    expect(isSupportedTimezone('UTC')).toBe(true);
    expect(isSupportedTimezone('Mars/Olympus')).toBe(false);
  });

  it('normalizes profile input into the persisted profile shape', () => {
    const result = normalizeProfileInput(
      {
        displayName: '  Ada  ',
        timezone: 'Asia/Jakarta',
        weekStart: 1,
        quietHoursStart: '21:00',
        quietHoursEnd: '07:00',
      },
      new Date('2026-08-13T12:00:00.000Z'),
    );

    expect(result.display_name).toBe('Ada');
    expect(result.timezone).toBe('Asia/Jakarta');
    expect(result.week_start).toBe(1);
    expect(result.quiet_hours_start).toBe('21:00');
    expect(result.quiet_hours_end).toBe('07:00');
    expect(result.terms_accepted_at).toBe('2026-08-13T12:00:00.000Z');
  });

  it('keeps every week start option within the database 1–7 contract', () => {
    for (const option of WEEK_START_OPTIONS) {
      expect(option.value).toBeGreaterThanOrEqual(1);
      expect(option.value).toBeLessThanOrEqual(7);
    }
  });

  it('maps Sunday to 7 so the profiles week_start check accepts it', () => {
    const result = normalizeProfileInput({
      displayName: 'Ada',
      timezone: 'UTC',
      weekStart: 7,
      quietHoursStart: null,
      quietHoursEnd: null,
    });

    expect(result.week_start).toBe(7);
  });

  it('preserves a valid week start day', () => {
    const result = normalizeProfileInput({
      displayName: 'Ada',
      timezone: 'UTC',
      weekStart: 6,
      quietHoursStart: null,
      quietHoursEnd: null,
    });

    expect(result.week_start).toBe(6);
  });

  it('defaults to Monday for an invalid week start day', () => {
    const result = normalizeProfileInput({
      displayName: 'Ada',
      timezone: 'UTC',
      weekStart: 3,
      quietHoursStart: null,
      quietHoursEnd: null,
    });

    expect(result.week_start).toBe(1);
  });

  it('falls back to UTC for unknown timezones', () => {
    const result = normalizeProfileInput({
      displayName: 'Ada',
      timezone: 'Mars/Olympus',
      weekStart: 1,
      quietHoursStart: null,
      quietHoursEnd: null,
    });

    expect(result.timezone).toBe('UTC');
  });

  it('drops quiet hours unless both values are present', () => {
    const result = normalizeProfileInput({
      displayName: 'Ada',
      timezone: 'UTC',
      weekStart: 1,
      quietHoursStart: '21:00',
      quietHoursEnd: null,
    });

    expect(result.quiet_hours_start).toBeNull();
    expect(result.quiet_hours_end).toBeNull();
  });

  it('rejects a quiet hours pair where start is not before end', () => {
    expect(isValidQuietHoursPair('07:00', '21:00')).toBe(true);
    expect(isValidQuietHoursPair('21:00', '07:00')).toBe(false);
    expect(isValidQuietHoursPair(null, null)).toBe(true);
  });

  it('normalizes habit input with default targets and timing context', () => {
    const result = normalizeHabitInput({
      name: '  Morning meditation  ',
      category: 'Mindfulness',
      normalTarget: '',
      minimumTarget: '',
      icon: '',
      startDate: '2026-08-13',
      fromTime: '08:00',
      untilTime: '09:00',
      timingContext: '',
    });

    expect(result.name).toBe('Morning meditation');
    expect(result.normalTarget).toBe('Normal version');
    expect(result.minimumTarget).toBe('Minimum version');
    expect(result.icon).toBe('meditation');
    expect(result.startDate).toBe('2026-08-13');
    expect(result.timingContext).toBe('08:00 AM - 09:00 AM');
  });
});
