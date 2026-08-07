import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

export function getHabitDetail(input: {
  repository: ProductRepository;
  owner: ProductOwner;
  habitId: string;
}) {
  return input.repository.getHabitDetail(input.owner, input.habitId);
}
