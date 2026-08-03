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
