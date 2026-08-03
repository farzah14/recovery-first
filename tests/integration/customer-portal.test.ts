import { describe, expect, it, vi } from 'vitest';

import { createSubscriptionManagementService } from '@/features/subscriptions/subscription-management-service';

describe('customer portal management', () => {
  it('returns a safe unavailable state when the account has no provider identity', async () => {
    const createPortal = vi.fn();
    const service = createSubscriptionManagementService({
      readProviderIdentity: async () => null,
      createPortal,
    });

    await expect(
      service.createPortalSession('12000000-0000-4000-8000-000000000001'),
    ).resolves.toEqual({
      kind: 'unavailable',
    });
    expect(createPortal).not.toHaveBeenCalled();
  });

  it('creates a temporary HTTPS portal URL without persisting it', async () => {
    const createPortal = vi.fn().mockResolvedValue({ url: 'https://portal.example/temporary' });
    const service = createSubscriptionManagementService({
      readProviderIdentity: async () => ({
        providerCustomerId: 'ctm_01',
        providerSubscriptionId: 'sub_01',
      }),
      createPortal,
    });

    await expect(
      service.createPortalSession('12000000-0000-4000-8000-000000000001'),
    ).resolves.toEqual({
      kind: 'ready',
      url: 'https://portal.example/temporary',
    });
    expect(createPortal).toHaveBeenCalledWith({
      providerCustomerId: 'ctm_01',
      providerSubscriptionId: 'sub_01',
    });
  });

  it('rejects non-HTTPS provider URLs', async () => {
    const service = createSubscriptionManagementService({
      readProviderIdentity: async () => ({
        providerCustomerId: 'ctm_01',
        providerSubscriptionId: 'sub_01',
      }),
      createPortal: async () => ({ url: 'javascript:alert(1)' }),
    });

    await expect(
      service.createPortalSession('12000000-0000-4000-8000-000000000001'),
    ).rejects.toThrow('Portal URL invalid');
  });

  it('requests a fresh temporary URL for each portal opening', async () => {
    const createPortal = vi
      .fn()
      .mockResolvedValueOnce({ url: 'https://portal.example/temporary-1' })
      .mockResolvedValueOnce({ url: 'https://portal.example/temporary-2' });
    const service = createSubscriptionManagementService({
      readProviderIdentity: async () => ({
        providerCustomerId: 'ctm_01',
        providerSubscriptionId: 'sub_01',
      }),
      createPortal,
    });

    await expect(
      service.createPortalSession('12000000-0000-4000-8000-000000000001'),
    ).resolves.toEqual({ kind: 'ready', url: 'https://portal.example/temporary-1' });
    await expect(
      service.createPortalSession('12000000-0000-4000-8000-000000000001'),
    ).resolves.toEqual({ kind: 'ready', url: 'https://portal.example/temporary-2' });
    expect(createPortal).toHaveBeenCalledTimes(2);
  });
});
