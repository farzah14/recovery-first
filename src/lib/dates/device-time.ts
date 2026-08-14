export function detectDeviceTimezone(): string {
  if (typeof Intl === 'undefined') return 'UTC';
  try {
    const timezone = new Intl.DateTimeFormat('en-US').resolvedOptions().timeZone;
    return typeof timezone === 'string' && timezone.length > 0 ? timezone : 'UTC';
  } catch {
    return 'UTC';
  }
}

export function detectWeekStart(): number {
  if (typeof Intl === 'undefined' || typeof navigator === 'undefined') return 1;
  try {
    const locale = new Intl.Locale(navigator.language) as Intl.Locale & {
      weekInfo?: { firstDay?: number };
    };
    const firstDay = locale.weekInfo?.firstDay;
    return typeof firstDay === 'number' && firstDay >= 1 && firstDay <= 7 ? firstDay : 1;
  } catch {
    return 1;
  }
}
