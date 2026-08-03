import { describe, expect, it, vi } from 'vitest';

import {
  loadHabitDraft,
  saveHabitDraft,
} from '@/features/habits/application/save-habit-draft';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

const owner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

describe('habit draft application service', () => {
  it('saves and restores the current wizard step and partial values', async () => {
    let stored: unknown = null;
    const repository = {
      saveHabitDraft: vi.fn(async (_owner, _id, payload) => {
        stored = payload;
      }),
      getHabitDraft: vi.fn(async () => stored),
    } as unknown as ProductRepository;

    await saveHabitDraft({
      repository,
      owner,
      draftId: 'new-habit',
      draft: { step: 2, values: { title: 'Read', normalAction: 'Read 20 minutes' } },
      now: '2026-07-29T13:00:00.000Z',
    });

    await expect(
      loadHabitDraft({ repository, owner, draftId: 'new-habit' }),
    ).resolves.toEqual({
      step: 2,
      values: { title: 'Read', normalAction: 'Read 20 minutes' },
    });
  });
});
