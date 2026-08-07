import type { SessionSummary } from '@/lib/repositories/product-repository';

export type TodayEmptyState = 'none' | 'no_habits' | 'no_eligible_sessions' | 'all_recorded';

export type TodayReadModel = {
  localDate: string;
  sessions: SessionSummary[];
  activeHabitCount: number;
  activeHabitLimit: number;
  successfulCount: number;
  minimumCount: number;
  remainingCount: number;
  emptyState: TodayEmptyState;
};
