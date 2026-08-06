export type TimeOfDayBucket = 'morning' | 'afternoon' | 'evening' | 'night';

export type TimeFilterValue = 'all' | TimeOfDayBucket;

export interface HabitScheduleSource {
  fromTime?: string;
  schedule?: string;
}

const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
const hour24Pattern = /^(\d{1,2}):(\d{2})$/;

function toHour24(hour: number, meridian: string | undefined): number {
  if (meridian) {
    const isPm = meridian.toUpperCase() === 'PM';
    if (isPm && hour < 12) return hour + 12;
    if (!isPm && hour === 12) return 0;
    return hour;
  }
  return hour;
}

export function extractStartHour(habit: HabitScheduleSource): number | null {
  if (habit.fromTime) {
    const match = habit.fromTime.trim().match(hour24Pattern);
    if (match) {
      const hour = Number.parseInt(match[1] ?? '', 10);
      if (Number.isInteger(hour) && hour >= 0 && hour <= 23) return hour;
    }
  }

  if (habit.schedule) {
    const match = habit.schedule.trim().match(timePattern);
    if (match) {
      const hour = Number.parseInt(match[1] ?? '', 10);
      if (Number.isInteger(hour) && hour >= 1 && hour <= 12) {
        return toHour24(hour, match[3]);
      }
    }
  }

  return null;
}

export function timeOfDayBucket(hour: number): TimeOfDayBucket | null {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 16) return 'afternoon';
  if (hour >= 17 && hour <= 20) return 'evening';
  return 'night';
}

export function matchesTimeBucket(habit: HabitScheduleSource, bucket: TimeFilterValue): boolean {
  if (bucket === 'all') return true;
  const hour = extractStartHour(habit);
  if (hour === null) return false;
  return timeOfDayBucket(hour) === bucket;
}

export type DateFilterPreset =
  'all' | 'today' | 'tomorrow' | 'last7' | 'last30' | 'thisMonth' | 'custom';

export interface DateRange {
  from?: string;
  to?: string;
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const monthNamePattern = /^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/;

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeCreatedDate(value: string): string | null {
  const trimmed = value.trim();
  if (isoDatePattern.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map((part) => Number.parseInt(part, 10));
    if (
      month === undefined ||
      day === undefined ||
      year === undefined ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }
    return trimmed;
  }

  const match = trimmed.match(monthNamePattern);
  if (match) {
    const month = MONTH_INDEX[match[1]?.toLowerCase() ?? ''];
    const day = Number.parseInt(match[2] ?? '', 10);
    const year = Number.parseInt(match[3] ?? '', 10);
    if (month === undefined || !Number.isInteger(day) || !Number.isInteger(year)) return null;
    return toDateString(new Date(year, month, day));
  }

  return null;
}

export function matchesDateRange(createdDate: string, from?: string, to?: string): boolean {
  const normalized = normalizeCreatedDate(createdDate);
  if (!normalized) return false;
  if (from && normalized < from) return false;
  if (to && normalized > to) return false;
  return true;
}

export function matchesDatePreset(
  createdDate: string,
  preset: DateFilterPreset,
  range: DateRange,
  now: Date,
): boolean {
  if (preset === 'all') return true;

  const normalized = normalizeCreatedDate(createdDate);
  if (!normalized) return false;

  const today = toDateString(now);

  if (preset === 'today') return normalized === today;

  if (preset === 'tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return normalized === toDateString(tomorrow);
  }

  if (preset === 'last7') {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return normalized >= toDateString(start) && normalized <= today;
  }

  if (preset === 'last30') {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    return normalized >= toDateString(start) && normalized <= today;
  }

  if (preset === 'thisMonth') {
    return normalized.slice(0, 7) === today.slice(0, 7);
  }

  if (preset === 'custom') {
    return matchesDateRange(normalized, range.from, range.to);
  }

  return false;
}
