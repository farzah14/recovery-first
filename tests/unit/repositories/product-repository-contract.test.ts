import { describe, expectTypeOf, it } from 'vitest';

import type {
  CreateHabitCommand,
  ProductRepository,
  RecordCheckInRepositoryCommand,
} from '@/lib/repositories/product-repository';

describe('account ProductRepository contract', () => {
  it('requires stable command identifiers for habit and check-in mutations', () => {
    expectTypeOf<CreateHabitCommand>().toHaveProperty('commandId');
    expectTypeOf<RecordCheckInRepositoryCommand>().toHaveProperty('commandId');
    expectTypeOf<RecordCheckInRepositoryCommand>().toHaveProperty('expectedSessionRevision');
  });

  it('keeps account reads and writes behind one interface', () => {
    expectTypeOf<ProductRepository>().toHaveProperty('createHabit');
    expectTypeOf<ProductRepository>().toHaveProperty('ensureSessionHorizon');
    expectTypeOf<ProductRepository>().toHaveProperty('getToday');
    expectTypeOf<ProductRepository>().toHaveProperty('recordCheckIn');
    expectTypeOf<ProductRepository>().toHaveProperty('editCheckIn');
  });
});
