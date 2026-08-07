import { orderTodaySessions } from '@/features/today/today-ordering';
import type { TodayReadModel } from '@/features/today/today-types';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

export async function getTodayReadModel(input: {
  repository: ProductRepository;
  owner: ProductOwner;
  localDate: string;
}): Promise<TodayReadModel> {
  const read = await input.repository.getToday(input.owner, input.localDate);
  const sessions = orderTodaySessions(read.sessions);
  const successfulCount = sessions.filter(
    (session) => session.status === 'full' || session.status === 'minimum',
  ).length;
  const minimumCount = sessions.filter((session) => session.status === 'minimum').length;
  const remainingCount = sessions.filter((session) => session.status === 'unrecorded').length;

  const emptyState =
    read.activeHabitCount === 0
      ? 'no_habits'
      : sessions.length === 0
        ? 'no_eligible_sessions'
        : remainingCount === 0
          ? 'all_recorded'
          : 'none';

  return {
    ...read,
    sessions,
    successfulCount,
    minimumCount,
    remainingCount,
    emptyState,
  };
}
