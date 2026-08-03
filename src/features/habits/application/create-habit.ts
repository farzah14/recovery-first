import { habitFormSchema } from '@/features/habits/forms/habit-form-schema';
import { mapHabitFormToCreateCommand } from '@/features/habits/mappers/habit-form-mapper';
import { ProductRepositoryError } from '@/lib/repositories/repository-errors';
import type {
  ProductOwner,
  ProductRepository,
} from '@/lib/repositories/product-repository';

export async function createHabit(input: {
  repository: ProductRepository;
  values: unknown;
  identity: ProductOwner;
  ids: { commandId: string; habitId: string; habitVersionId: string };
  now: string;
}) {
  const values = habitFormSchema.parse(input.values);
  const command = mapHabitFormToCreateCommand(values, {
    ...input.ids,
    owner: input.identity,
    now: input.now,
  });
  try {
    const result = await input.repository.createHabit(command);
    await input.repository.deleteHabitDraft(command.owner, 'new-habit');
    return { kind: 'created' as const, result };
  } catch (error) {
    if (error instanceof ProductRepositoryError && error.code === 'active_limit_reached') {
      return { kind: 'active_limit' as const, limit: 3 };
    }
    throw error;
  }
}
