'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { ProductRepository } from '@/lib/repositories/product-repository';

const ProductRepositoryContext = createContext<ProductRepository | null>(null);

export function ProductRepositoryProvider({
  repository,
  children,
}: {
  repository: ProductRepository;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <ProductRepositoryContext.Provider value={repository}>
      {children}
    </ProductRepositoryContext.Provider>
  );
}

export function useProductRepository(): ProductRepository {
  const repository = useContext(ProductRepositoryContext);
  if (!repository) {
    throw new Error('product_repository_provider_missing');
  }
  return repository;
}
