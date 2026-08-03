import type { SessionSummary } from '@/lib/repositories/product-repository';

const statusPriority: Record<SessionSummary['status'], number> = {
  unrecorded: 0,
  manual_skipped: 2,
  automatic_skipped: 3,
  minimum: 4,
  full: 5,
  excused: 6,
};

export function orderTodaySessions(sessions: SessionSummary[]): SessionSummary[] {
  return [...sessions].sort((left, right) => {
    const byStatus = statusPriority[left.status] - statusPriority[right.status];
    if (byStatus !== 0) return byStatus;
    const leftTime = left.scheduledLocalTime ?? '99:99';
    const rightTime = right.scheduledLocalTime ?? '99:99';
    return leftTime.localeCompare(rightTime) || left.title.localeCompare(right.title);
  });
}
