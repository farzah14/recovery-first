import { describe, expect, it } from 'vitest';

import { buildAccountContext } from '@/lib/auth/account-context';

describe('buildAccountContext', () => {
  it('prefers the persisted profile name, plan, and week start', () => {
    expect(
      buildAccountContext(
        { id: 'user-1', email: 'alex@example.com' },
        {
          display_name: 'Zah Febri',
          plan_code: 'lite',
          timezone: 'Asia/Jakarta',
          week_start: 7,
        },
      ),
    ).toEqual({
      accountId: 'user-1',
      displayName: 'Zah Febri',
      planTier: 'lite',
      timezone: 'Asia/Jakarta',
      weekStart: 7,
    });
  });

  it('falls back to the email local part when the profile is incomplete', () => {
    expect(
      buildAccountContext(
        { id: 'user-2', email: 'alex@example.com' },
        { display_name: null, plan_code: 'free', timezone: 'UTC', week_start: null },
      ),
    ).toMatchObject({
      accountId: 'user-2',
      displayName: 'alex',
      planTier: 'free',
      timezone: 'UTC',
      weekStart: 1,
    });
  });
});
