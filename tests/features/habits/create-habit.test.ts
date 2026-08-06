import { describe, expect, it, vi } from 'vitest';

import { createHabit } from '@/features/habits/application/create-habit';
import { ProductRepositoryError } from '@/lib/repositories/repository-errors';
import type {
  CreateHabitCommand,
  CreateHabitResult,
  ProductOwner,
  ProductRepository,
} from '@/lib/repositories/product-repository';

const owner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

const validValues = {
  creationRoute: 'custom' as const,
  templateId: null,
  category: 'movement',
  title: 'Walk after lunch',
  normalAction: 'Walk for 20 minutes',
  normalQuantity: 20,
  normalUnit: 'minutes',
  minimumAction: 'Walk for 5 minutes',
  minimumQuantity: 5,
  minimumUnit: 'minutes',
  recurrenceKind: 'weekdays' as const,
  weekdays: [1, 2, 3, 4, 5] as const,
  timesPerWeek: null,
  cueType: 'after_activity' as const,
  cueValue: 'After lunch',
  timezone: 'Asia/Jakarta',
  reminderEnabled: false,
  reminderLocalTime: null,
  startLocalDate: '2026-07-30',
  activate: true,
};

const ids = {
  commandId: '00000000-0000-4000-8000-000000000701',
  habitId: '00000000-0000-4000-8000-000000000702',
  habitVersionId: '00000000-0000-4000-8000-000000000703',
};

function createRepositorySpy(options: { activeLimit?: boolean } = {}): ProductRepository {
  return {
    createHabit: vi.fn(async (command: CreateHabitCommand): Promise<CreateHabitResult> => {
      if (options.activeLimit) {
        throw new ProductRepositoryError('active_limit_reached');
      }
      return {
        habitId: command.habitId,
        habitVersionId: command.habitVersionId,
        lifecycleState: command.activate ? 'starting' : 'draft',
        activeCount: command.activate ? 1 : 0,
        firstEligibleSessionId: null,
      };
    }),
    saveHabitDraft: vi.fn(async () => undefined),
    getHabitDraft: vi.fn(async () => null),
    deleteHabitDraft: vi.fn(async () => undefined),
    listHabits: vi.fn(async () => []),
    getHabitDetail: vi.fn(async () => null),
    ensureSessionHorizon: vi.fn(async () => 0),
    resolveExpiredUnrecorded: vi.fn(async () => 0),
    getToday: vi.fn(async () => ({
      localDate: '2026-07-30',
      sessions: [],
      activeHabitCount: 0,
      activeHabitLimit: 3,
    })),
    recordCheckIn: vi.fn(),
    editCheckIn: vi.fn(),
  };
}

describe('createHabit', () => {
  it('validates form input before calling the repository', async () => {
    const repository = createRepositorySpy();
    await expect(
      createHabit({
        repository,
        values: { ...validValues, minimumAction: validValues.normalAction },
        identity: owner,
        ids,
        now: '2026-07-29T13:00:00.000Z',
      }),
    ).rejects.toMatchObject({ name: 'ZodError' });
    expect(repository.createHabit).not.toHaveBeenCalled();
  });

  it('returns an active-limit result without deleting an existing habit', async () => {
    const repository = createRepositorySpy({ activeLimit: true });
    await expect(
      createHabit({
        repository,
        values: validValues,
        identity: owner,
        ids,
        now: '2026-07-29T13:00:00.000Z',
      }),
    ).resolves.toEqual({ kind: 'active_limit', limit: 3 });
    expect(repository.deleteHabitDraft).not.toHaveBeenCalled();
  });

  it('uses the authenticated plan limit when the account repository rejects activation', async () => {
    const repository = createRepositorySpy({ activeLimit: true });
    await expect(
      createHabit({
        repository,
        values: validValues,
        identity: {
          ownerId: '00000000-0000-4000-8000-000000000704',
          identityMode: 'account',
          planTier: 'lite',
          timezone: 'Asia/Jakarta',
        },
        ids,
        now: '2026-07-29T13:00:00.000Z',
      }),
    ).resolves.toEqual({ kind: 'active_limit', limit: 10 });
  });
});
