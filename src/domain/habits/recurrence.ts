export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type RecurrenceRule =
  | { kind: 'daily' }
  | { kind: 'weekdays'; weekdays: IsoWeekday[] }
  | {
      kind: 'times_per_week';
      count: number;
      placement: IsoWeekday[];
    }
  | { kind: 'finite_dates'; dates: string[] };

export type RecurrenceValidation =
  | { valid: true }
  | {
      valid: false;
      reason:
        | 'empty_weekdays'
        | 'invalid_weekday'
        | 'duplicate_weekday'
        | 'invalid_weekly_count'
        | 'placement_count_mismatch'
        | 'invalid_local_date'
        | 'duplicate_local_date';
    };

const localDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function hasDuplicates<T>(values: readonly T[]): boolean {
  return new Set(values).size !== values.length;
}

export function validateRecurrenceRule(rule: RecurrenceRule): RecurrenceValidation {
  if (rule.kind === 'daily') return { valid: true };

  if (rule.kind === 'weekdays') {
    if (rule.weekdays.length === 0) return { valid: false, reason: 'empty_weekdays' };
    if (rule.weekdays.some((day) => day < 1 || day > 7)) {
      return { valid: false, reason: 'invalid_weekday' };
    }
    if (hasDuplicates(rule.weekdays)) {
      return { valid: false, reason: 'duplicate_weekday' };
    }
    return { valid: true };
  }

  if (rule.kind === 'times_per_week') {
    if (!Number.isInteger(rule.count) || rule.count < 1 || rule.count > 7) {
      return { valid: false, reason: 'invalid_weekly_count' };
    }
    if (rule.placement.length !== rule.count) {
      return { valid: false, reason: 'placement_count_mismatch' };
    }
    if (rule.placement.some((day) => day < 1 || day > 7)) {
      return { valid: false, reason: 'invalid_weekday' };
    }
    if (hasDuplicates(rule.placement)) {
      return { valid: false, reason: 'duplicate_weekday' };
    }
    return { valid: true };
  }

  if (rule.dates.some((date) => !localDatePattern.test(date))) {
    return { valid: false, reason: 'invalid_local_date' };
  }
  if (hasDuplicates(rule.dates)) {
    return { valid: false, reason: 'duplicate_local_date' };
  }
  return { valid: true };
}
