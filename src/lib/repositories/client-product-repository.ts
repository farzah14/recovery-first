'use client';

import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import { DexieProductRepository } from '@/lib/repositories/guest/dexie-product-repository';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';
import { SupabaseProductRepository } from '@/lib/repositories/signed-in/supabase-product-repository';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export type ClientProductRepositoryHandle = {
  repository: ProductRepository;
  dispose: () => void;
};

/**
 * Selects the persistence boundary from the already-authenticated owner.
 * Account records are always read and written through Supabase; Dexie is kept
 * only for the historical Guest browser-local flow and its migration tests.
 */
export function createClientProductRepository(owner: ProductOwner): ClientProductRepositoryHandle {
  if (owner.identityMode === 'account') {
    return {
      repository: new SupabaseProductRepository(createSupabaseBrowserClient(), owner.ownerId),
      dispose: () => undefined,
    };
  }

  const database = new RecoveryFirstDatabase();
  return {
    repository: new DexieProductRepository(database),
    dispose: () => void database.close(),
  };
}
