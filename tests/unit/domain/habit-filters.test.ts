import { describe, expect, it } from 'vitest';

import {
  extractStartHour,
  matchesTimeBucket,
  timeOfDayBucket,
  type TimeFilterValue,
} from '@/domain/habits/habit-filters';

describe('extractStartHour', () => {
  it('returns the hour from a 24-hour fromTime value', () => {
    expect(extractStartHour({ fromTime: '08:00' })).toBe(8);
  });

  it('parses afternoon and evening fromTime values', () => {
    expect(extractStartHour({ fromTime: '17:30' })).toBe(17);
    expect(extractStartHour({ fromTime: '00:15' })).toBe(0);
  });

  it('parses the schedule window start when no fromTime is present', () => {
    expect(extractStartHour({ schedule: 'Daily (08:00 AM - 09:00 AM)' })).toBe(8);
    expect(extractStartHour({ schedule: 'Weekdays (07:00 PM - 08:00 PM)' })).toBe(19);
  });

  it('parses a bare AM/PM range without parentheses', () => {
    expect(extractStartHour({ schedule: '05:00 AM - 06:00 AM' })).toBe(5);
  });

  it('prefers fromTime over the schedule string', () => {
    expect(extractStartHour({ fromTime: '12:00', schedule: 'Daily (08:00 AM - 09:00 AM)' })).toBe(
      12,
    );
  });

  it('returns null when no parseable time exists', () => {
    expect(extractStartHour({})).toBeNull();
    expect(extractStartHour({ schedule: 'Every evening after dinner' })).toBeNull();
    expect(extractStartHour({ schedule: '' })).toBeNull();
  });
});

describe('timeOfDayBucket', () => {
  it('maps morning hours 05:00-11:59', () => {
    expect(timeOfDayBucket(5)).toBe('morning');
    expect(timeOfDayBucket(8)).toBe('morning');
    expect(timeOfDayBucket(11)).toBe('morning');
  });

  it('maps afternoon hours 12:00-16:59', () => {
    expect(timeOfDayBucket(12)).toBe('afternoon');
    expect(timeOfDayBucket(16)).toBe('afternoon');
  });

  it('maps evening hours 17:00-20:59', () => {
    expect(timeOfDayBucket(17)).toBe('evening');
    expect(timeOfDayBucket(20)).toBe('evening');
  });

  it('maps night hours 21:00-04:59', () => {
    expect(timeOfDayBucket(21)).toBe('night');
    expect(timeOfDayBucket(23)).toBe('night');
    expect(timeOfDayBucket(0)).toBe('night');
    expect(timeOfDayBucket(4)).toBe('night');
  });

  it('returns null for out-of-range or invalid hours', () => {
    expect(timeOfDayBucket(-1)).toBeNull();
    expect(timeOfDayBucket(24)).toBeNull();
    expect(timeOfDayBucket(NaN)).toBeNull();
  });
});

describe('matchesTimeBucket', () => {
  const morningHabit = { schedule: 'Daily (08:00 AM - 09:00 AM)' };
  const eveningHabit = { schedule: 'Weekdays (07:00 PM - 08:00 PM)' };

  it('matches every habit for the all value', () => {
    expect(matchesTimeBucket(morningHabit, 'all')).toBe(true);
    expect(matchesTimeBucket({}, 'all')).toBe(true);
  });

  it('matches habits whose start time falls inside the selected bucket', () => {
    expect(matchesTimeBucket(morningHabit, 'morning')).toBe(true);
    expect(matchesTimeBucket(eveningHabit, 'evening')).toBe(true);
  });

  it('does not match habits outside the selected bucket', () => {
    expect(matchesTimeBucket(morningHabit, 'evening')).toBe(false);
    expect(matchesTimeBucket(eveningHabit, 'morning')).toBe(false);
  });

  it('uses fromTime when it is available', () => {
    expect(matchesTimeBucket({ fromTime: '22:00' }, 'night')).toBe(true);
    expect(matchesTimeBucket({ fromTime: '22:00' }, 'afternoon')).toBe(false);
  });

  it('never matches a habit without a parseable time for a specific bucket', () => {
    const untimed: Parameters<typeof matchesTimeBucket>[0] = {
      schedule: 'Whenever I feel like it',
    };
    const buckets: Exclude<TimeFilterValue, 'all'>[] = ['morning', 'afternoon', 'evening', 'night'];
    for (const bucket of buckets) {
      expect(matchesTimeBucket(untimed, bucket)).toBe(false);
    }
  });
});
