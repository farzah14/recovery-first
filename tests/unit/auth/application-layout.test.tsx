import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const requireAccount = vi.hoisted(() => vi.fn());
const createSupabaseServerClient = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/require-account', () => ({ requireAccount }));
vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient }));

import ApplicationLayout from '@/app/(app)/app/layout';

describe('ApplicationLayout', () => {
  it('passes the entitlement-resolved tier to the account state provider', async () => {
    requireAccount.mockResolvedValue({ id: 'user-1', email: 'alex@example.com' });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        display_name: 'Alex',
        plan_code: 'free',
        timezone: 'UTC',
        onboarding_completed_at: '2026-09-05T00:00:00.000Z',
      },
      error: null,
    });
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      maybeSingle,
    };
    const rpc = vi.fn().mockResolvedValue({ data: 'premium', error: null });
    createSupabaseServerClient.mockResolvedValue({
      from: vi.fn(() => builder),
      rpc,
    });

    const element = await ApplicationLayout({ children: 'content' });
    const account = (element.props as { account: { planTier: string; entitlementStatus: string } })
      .account;

    expect(account).toMatchObject({ planTier: 'premium', entitlementStatus: 'resolved' });
    expect(rpc).toHaveBeenCalledWith('effective_plan_tier');
  });
});
