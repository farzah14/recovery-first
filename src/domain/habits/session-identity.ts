export type SessionIdentityInput = {
  habitId: string;
  habitVersionId: string;
  scheduledLocalDate: string;
  scheduledLocalTime: string | null;
};

export function buildSessionIdentity(input: SessionIdentityInput): string {
  const time = input.scheduledLocalTime ?? 'all-day';
  return [input.habitId, input.habitVersionId, input.scheduledLocalDate, time].join(':');
}

export function isValidIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
