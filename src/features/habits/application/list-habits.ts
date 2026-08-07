import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

export function listHabits(input: { repository: ProductRepository; owner: ProductOwner }) {
  return input.repository.listHabits(input.owner);
}
