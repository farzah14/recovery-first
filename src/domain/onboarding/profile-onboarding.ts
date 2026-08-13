export const ONBOARDING_STEPS = ['consent', 'profile', 'first-habit'] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'America/Mexico_City',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Warsaw',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Lagos',
  'Africa/Johannesburg',
  'Africa/Nairobi',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Asia/Kolkata',
  'Asia/Karachi',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Taipei',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Asia/Manila',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
] as const;

export const WEEK_START_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 6, label: 'Saturday' },
] as const;

export type OnboardingProfileInput = {
  displayName: string;
  timezone: string;
  weekStart: number;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
};

export type OnboardingHabitInput = {
  name: string;
  category: string;
  normalTarget: string;
  minimumTarget: string;
  icon: string;
  startDate: string;
  fromTime: string;
  untilTime: string;
  timingContext: string;
};

export type OnboardingProfileResult = {
  display_name: string;
  timezone: string;
  week_start: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  terms_accepted_at: string;
};

export function isSupportedTimezone(value: string): boolean {
  return (TIMEZONE_OPTIONS as readonly string[]).includes(value);
}

export function normalizeProfileInput(
  input: OnboardingProfileInput,
  now = new Date(),
): OnboardingProfileResult {
  const displayName = input.displayName.trim().slice(0, 80);
  const timezone = isSupportedTimezone(input.timezone) ? input.timezone : 'UTC';
  const weekStart = WEEK_START_OPTIONS.some((option) => option.value === input.weekStart)
    ? input.weekStart
    : 1;
  const hasQuietHours = Boolean(input.quietHoursStart && input.quietHoursEnd);
  const quietHoursStart = hasQuietHours ? input.quietHoursStart : null;
  const quietHoursEnd = hasQuietHours ? input.quietHoursEnd : null;

  return {
    display_name: displayName || input.displayName.trim() || 'Account',
    timezone,
    week_start: weekStart,
    quiet_hours_start: quietHoursStart,
    quiet_hours_end: quietHoursEnd,
    terms_accepted_at: now.toISOString(),
  };
}

export function normalizeHabitInput(input: OnboardingHabitInput): OnboardingHabitInput {
  const normalTarget = input.normalTarget.trim() || 'Normal version';
  const minimumTarget = input.minimumTarget.trim() || 'Minimum version';
  const name = input.name.trim();
  const fromTime = input.fromTime || '08:00';
  const untilTime = input.untilTime || '09:00';
  const timingContext =
    input.timingContext.trim() || `${formatTime12(fromTime)} - ${formatTime12(untilTime)}`;

  return {
    name,
    category: input.category.trim(),
    normalTarget,
    minimumTarget,
    icon: input.icon || 'meditation',
    startDate: input.startDate || new Date().toISOString().slice(0, 10),
    fromTime,
    untilTime,
    timingContext,
  };
}

function formatTime12(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  let h = Number.parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const formattedH = h < 10 ? `0${h}` : `${h}`;
  return `${formattedH}:${m} ${ampm}`;
}

export function isValidQuietHoursPair(start: string | null, end: string | null): boolean {
  if (!start || !end) return true;
  return start < end;
}
