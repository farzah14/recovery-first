export const SESSION_LOOKBACK_DAYS = 3;
export const SESSION_LOOKAHEAD_DAYS = 31;

export function shiftIsoLocalDate(localDate: string, days: number): string {
  const date = new Date(`${localDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isoWeekday(localDate: string): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const day = new Date(`${localDate}T12:00:00.000Z`).getUTCDay();
  return (day === 0 ? 7 : day) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function partsAt(instant: Date, timezone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
}

export function zonedLocalDateTimeToUtc(
  localDate: string,
  localTime: string,
  timezone: string,
): string {
  const [year = Number.NaN, month = Number.NaN, day = Number.NaN] = localDate
    .split('-')
    .map(Number);
  const [hour = Number.NaN, minute = Number.NaN, second = Number.NaN] = localTime
    .split(':')
    .map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = target;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = partsAt(new Date(guess), timezone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    const adjustment = target - actualAsUtc;
    guess += adjustment;
    if (adjustment === 0) return new Date(guess).toISOString();
  }

  throw new Error('local_datetime_cannot_be_resolved');
}
