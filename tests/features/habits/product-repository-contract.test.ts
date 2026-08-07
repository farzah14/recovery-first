import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  CreateHabitCommand,
  ProductRepository,
  RecordCheckInRepositoryCommand,
} from '@/lib/repositories/product-repository';

describe('ProductRepository contract', () => {
  it('loads the repository contract module at runtime', async () => {
    await expect(import('@/lib/repositories/product-repository')).resolves.toBeDefined();
  });

  it('requires stable command identifiers for habit and check-in mutations', () => {
    expectTypeOf<CreateHabitCommand>().toHaveProperty('commandId');
    expectTypeOf<RecordCheckInRepositoryCommand>().toHaveProperty('commandId');
    expectTypeOf<RecordCheckInRepositoryCommand>().toHaveProperty('expectedSessionRevision');
  });

  it('keeps read and write operations behind one account-neutral interface', () => {
    expectTypeOf<ProductRepository>().toHaveProperty('createHabit');
    expectTypeOf<ProductRepository>().toHaveProperty('ensureSessionHorizon');
    expectTypeOf<ProductRepository>().toHaveProperty('getToday');
    expectTypeOf<ProductRepository>().toHaveProperty('recordCheckIn');
    expectTypeOf<ProductRepository>().toHaveProperty('editCheckIn');
  });
});
