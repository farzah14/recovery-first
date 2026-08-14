export type LocalWeekRange = {
  todayDate: string;
  startDate: string;
  endDate: string;
  dates: string[];
};

function parseLocalDate(localDate: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
    throw new Error('invalid_local_date');
  }

  const date = new Date(`${localDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error('invalid_local_date');
  }
  return date;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getLocalDateForTimezone(timezone: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  } catch {
    return formatDate(now);
  }
}

export function getLocalWeekRange(localDate: string, weekStart = 1): LocalWeekRange {
  const date = parseLocalDate(localDate);
  const firstDayOffset = (date.getUTCDay() + 7 - weekStart) % 7;
  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - firstDayOffset);

  const dates = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(day.getUTCDate() + index);
    return formatDate(day);
  });

  return {
    todayDate: localDate,
    startDate: dates[0] ?? localDate,
    endDate: dates[6] ?? localDate,
    dates,
  };
}
