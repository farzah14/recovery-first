import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ProductOwner } from '@/lib/repositories/product-repository';

const { createSupabaseBrowserClient } = vi.hoisted(() => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    from: vi.fn(),
    rpc: vi.fn(),
  })),
}));

vi.mock('@/lib/supabase/browser', () => ({ createSupabaseBrowserClient }));

import { DexieProductRepository } from '@/lib/repositories/guest/dexie-product-repository';
import { SupabaseProductRepository } from '@/lib/repositories/signed-in/supabase-product-repository';
import { createClientProductRepository } from '@/lib/repositories/client-product-repository';

const accountOwner: ProductOwner = {
  ownerId: '00000000-0000-4000-8000-000000000001',
  identityMode: 'account',
  planTier: 'free',
  timezone: 'Asia/Jakarta',
};

describe('createClientProductRepository', () => {
  const disposers: Array<() => void> = [];

  afterEach(() => {
    while (disposers.length > 0) disposers.pop()?.();
    vi.clearAllMocks();
  });

  it('selects Supabase as the canonical repository for account owners', () => {
    const handle = createClientProductRepository(accountOwner);
    disposers.push(handle.dispose);

    expect(handle.repository).toBeInstanceOf(SupabaseProductRepository);
    expect(createSupabaseBrowserClient).toHaveBeenCalledTimes(1);
  });

  it('keeps the historical Dexie repository isolated to Guest owners', () => {
    const handle = createClientProductRepository({
      ownerId: 'guest-installation-1',
      identityMode: 'guest',
      planTier: 'guest',
      timezone: 'Asia/Jakarta',
    });
    disposers.push(handle.dispose);

    expect(handle.repository).toBeInstanceOf(DexieProductRepository);
    expect(createSupabaseBrowserClient).not.toHaveBeenCalled();
  });
});
