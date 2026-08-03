import { describe, expect, it } from 'vitest';

import { SupabaseProductRepository } from '@/lib/repositories/signed-in/supabase-product-repository';

describe('signed-in repository integration boundary', () => {
  it('requires an explicit authenticated user identity', () => {
    expect(() => new SupabaseProductRepository({} as never, '')).toThrow(/user/i);
  });
});
