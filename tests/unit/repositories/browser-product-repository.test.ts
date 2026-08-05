import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createBrowserProductRepository } from '@/lib/repositories/signed-in/browser-product-repository';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

vi.mock('@/lib/supabase/browser', () => ({
  createSupabaseBrowserClient: vi.fn(() => ({}) as never),
}));

describe('browser product repository factory', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('does not create a repository without an authenticated account or Supabase env', () => {
    expect(createBrowserProductRepository({ planTier: 'free', timezone: 'UTC' })).toBeNull();

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
    expect(createBrowserProductRepository({ planTier: 'free', timezone: 'UTC' })).toBeNull();
  });

  it('creates an account-scoped repository when account and env are available', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');

    const repository = createBrowserProductRepository({
      accountId: '15000000-0000-4000-8000-000000000001',
      planTier: 'lite',
      timezone: 'Asia/Jakarta',
    });

    expect(repository).not.toBeNull();
    expect(createSupabaseBrowserClient).toHaveBeenCalledOnce();
  });

  it('creates a repository for the Supabase local loopback URL used by CI', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:55421');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'local-publishable-key');

    const repository = createBrowserProductRepository({
      accountId: '15000000-0000-4000-8000-000000000001',
      planTier: 'free',
      timezone: 'UTC',
    });

    expect(repository).not.toBeNull();
  });
});
