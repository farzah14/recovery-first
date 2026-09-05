import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { readVerifiedAccountTier } from '@/lib/auth/verified-account-tier';

describe('readVerifiedAccountTier', () => {
  it('returns the tier resolved by the authenticated entitlement RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'premium', error: null });
    const client = { rpc } as unknown as Parameters<typeof readVerifiedAccountTier>[0];

    await expect(readVerifiedAccountTier(client)).resolves.toEqual({
      planTier: 'premium',
      entitlementStatus: 'resolved',
    });
    expect(rpc).toHaveBeenCalledWith('effective_plan_tier');
  });

  it('falls back to Free and reports unavailable when the RPC fails', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'database unavailable' },
    });
    const client = { rpc } as unknown as Parameters<typeof readVerifiedAccountTier>[0];

    await expect(readVerifiedAccountTier(client)).resolves.toEqual({
      planTier: 'free',
      entitlementStatus: 'unavailable',
    });
  });

  it('falls back to Free and reports unavailable when the RPC rejects', async () => {
    const rpc = vi.fn().mockRejectedValue(new Error('network unavailable'));
    const client = { rpc } as unknown as Parameters<typeof readVerifiedAccountTier>[0];

    await expect(readVerifiedAccountTier(client)).resolves.toEqual({
      planTier: 'free',
      entitlementStatus: 'unavailable',
    });
  });
});
