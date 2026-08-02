import { describe, expect, it } from 'vitest';

import { validateRecurrenceRule, type RecurrenceRule } from '@/domain/habits/recurrence';

describe('recurrence validation', () => {
  it.each<RecurrenceRule>([
    { kind: 'daily' },
    { kind: 'weekdays', weekdays: [1, 3, 5] },
    { kind: 'times_per_week', count: 3, placement: [1, 3, 6] },
    { kind: 'finite_dates', dates: ['2026-08-01', '2026-08-03'] },
  ])('accepts a supported rule %#', (rule) => {
    expect(validateRecurrenceRule(rule)).toEqual({ valid: true });
  });

  it('rejects duplicate weekdays', () => {
    expect(validateRecurrenceRule({ kind: 'weekdays', weekdays: [1, 1] })).toEqual({
      valid: false,
      reason: 'duplicate_weekday',
    });
  });

  it('rejects mismatched times-per-week placement', () => {
    expect(
      validateRecurrenceRule({
        kind: 'times_per_week',
        count: 3,
        placement: [1, 3],
      }),
    ).toEqual({ valid: false, reason: 'placement_count_mismatch' });
  });
});
