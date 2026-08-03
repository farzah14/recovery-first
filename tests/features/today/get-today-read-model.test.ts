import { describe, expect, it, vi } from 'vitest';

import { getTodayReadModel } from '@/features/today/application/get-today-read-model';
import { orderTodaySessions } from '@/features/today/today-ordering';
import type { TodayRepositoryRead } from '@/lib/repositories/product-repository';
import type { ProductOwner, ProductRepository, SessionSummary } from '@/lib/repositories/product-repository';

const owner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

function session(
  id: string,
  status: SessionSummary['status'],
  scheduledLocalTime: string | null,
  title = 'Habit',
): SessionSummary {
  return {
    id,
    habitId: `habit-${id}`,
    habitVersionId: `version-${id}`,
    title,
    normalTarget: { action: 'Normal action', quantity: null, unit: null, estimatedMinutes: null },
    minimumTarget: { action: 'Minimum action', quantity: null, unit: null, estimatedMinutes: null },
    cue: { type: 'none', value: null },
    scheduledLocalDate: '2026-08-03',
    scheduledLocalTime,
    timezoneSnapshot: 'Asia/Jakarta',
    status,
    revision: 1,
    synchronizationState: 'local_only',
  };
}

function repository(read: TodayRepositoryRead): ProductRepository {
  return { getToday: vi.fn(async () => read) } as unknown as ProductRepository;
}

describe('Today read model', () => {
  it('orders unresolved attention and unrecorded sessions before recorded sessions', () => {
    const ordered = orderTodaySessions([
      session('full', 'full', '08:00'),
      session('timed-unrecorded', 'unrecorded', '10:00'),
      session('attention', 'unrecorded', null, 'Needs attention'),
      session('minimum', 'minimum', '07:00'),
    ]);

    expect(ordered.map((item) => item.id)).toEqual(['timed-unrecorded', 'attention', 'minimum', 'full']);
  });

  it('counts Full and Minimum as successful and identifies all-recorded', async () => {
    const model = await getTodayReadModel({
      repository: repository({
        localDate: '2026-08-03',
        sessions: [session('full', 'full', '08:00'), session('minimum', 'minimum', '09:00')],
        activeHabitCount: 1,
        activeHabitLimit: 3,
      }),
      owner,
      localDate: '2026-08-03',
    });

    expect(model.successfulCount).toBe(2);
    expect(model.minimumCount).toBe(1);
    expect(model.remainingCount).toBe(0);
    expect(model.emptyState).toBe('all_recorded');
  });

  it.each([
    ['no habits', 0, [], 'no_habits'],
    ['no eligible sessions', 1, [], 'no_eligible_sessions'],
    ['unrecorded sessions', 1, [session('unrecorded', 'unrecorded', '10:00')], 'none'],
  ] as const)('keeps %s distinct', async (_label, activeHabitCount, sessions, emptyState) => {
    const model = await getTodayReadModel({
      repository: repository({ localDate: '2026-08-03', sessions: [...sessions], activeHabitCount, activeHabitLimit: 3 }),
      owner,
      localDate: '2026-08-03',
    });
    expect(model.emptyState).toBe(emptyState);
  });

  it('keeps Automatic Skipped as a historical status rather than a remaining user action', async () => {
    const model = await getTodayReadModel({
      repository: repository({
        localDate: '2026-08-03',
        sessions: [session('automatic', 'automatic_skipped', null)],
        activeHabitCount: 1,
        activeHabitLimit: 3,
      }),
      owner,
      localDate: '2026-08-03',
    });

    expect(model.sessions[0]?.status).toBe('automatic_skipped');
    expect(model.remainingCount).toBe(0);
    expect(model.emptyState).toBe('all_recorded');
  });
});
