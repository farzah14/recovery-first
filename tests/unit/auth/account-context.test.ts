import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

import { getAccountContext } from '@/lib/auth/account-context';

describe('getAccountContext', () => {
  it('builds the ProductOwner from the authenticated profile tier and timezone', async () => {
    const from = vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'user-1',
                  display_name: 'Ari',
                  timezone: 'Asia/Jakarta',
                  plan_code: 'free',
                },
                error: null,
              }),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                product_code: 'lite_monthly',
                status: 'active',
                valid_from: '2026-01-01T00:00:00.000Z',
                valid_until: null,
              },
            ],
            error: null,
          }),
        })),
      };
    });

    await expect(
      getAccountContext({
        getUser: vi.fn().mockResolvedValue({ id: 'user-1', email: 'ari@example.com' }),
        createClient: vi.fn().mockResolvedValue({ from }),
      }),
    ).resolves.toMatchObject({
      id: 'user-1',
      displayName: 'Ari',
      planTier: 'lite',
      timezone: 'Asia/Jakarta',
      owner: {
        ownerId: 'user-1',
        identityMode: 'account',
        planTier: 'lite',
        timezone: 'Asia/Jakarta',
      },
    });
    expect(from).toHaveBeenCalledWith('profiles');
    expect(from).toHaveBeenCalledWith('subscription_status_view');
  });

  it('fails closed when the authenticated profile cannot be read', async () => {
    await expect(
      getAccountContext({
        getUser: vi.fn().mockResolvedValue({ id: 'user-1', email: 'ari@example.com' }),
        createClient: vi.fn().mockResolvedValue({
          from: vi.fn((table: string) =>
            table === 'profiles'
              ? {
                  select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                    })),
                  })),
                }
              : {
                  select: vi.fn(() => ({
                    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                  })),
                },
          ),
        }),
      }),
    ).rejects.toThrow('account_profile_unavailable');
  });
});
