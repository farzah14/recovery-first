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
  const [year = NaN, month = NaN, day = NaN] = localDate.split('-').map(Number);
  const [hour = NaN, minute = NaN, second = 0] = localTime.split(':').map(Number);
  if (
    ![year, month, day, hour, minute, second].every(Number.isFinite) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    throw new Error('invalid_local_datetime');
  }

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
