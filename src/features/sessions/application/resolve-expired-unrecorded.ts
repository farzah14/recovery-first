import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

export async function resolveExpiredUnrecorded(input: {
  repository: ProductRepository;
  owner: ProductOwner;
  now: string;
}): Promise<number> {
  return input.repository.resolveExpiredUnrecorded(input.owner, input.now);
}
