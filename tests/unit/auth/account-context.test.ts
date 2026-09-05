import { describe, expect, it } from 'vitest';

import { buildAccountContext } from '@/lib/auth/account-context';

describe('buildAccountContext', () => {
  it('prefers the persisted profile name and plan', () => {
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
        { display_name: null, plan_code: 'free', timezone: 'UTC', week_start: 1 },
      ),
    ).toMatchObject({
      accountId: 'user-2',
      displayName: 'alex',
      planTier: 'free',
      timezone: 'UTC',
      weekStart: 1,
    });
  });

  it('normalizes unsupported profile week starts to Monday', () => {
    expect(
      buildAccountContext(
        { id: 'user-3', email: 'alex@example.com' },
        { display_name: null, plan_code: 'free', timezone: 'UTC', week_start: 8 },
      ).weekStart,
    ).toBe(1);
  });

  it('normalizes non-integer profile week starts to Monday', () => {
    expect(
      buildAccountContext(
        { id: 'user-5', email: 'alex@example.com' },
        { display_name: null, plan_code: 'free', timezone: 'UTC', week_start: 1.5 },
      ).weekStart,
    ).toBe(1);
  });

  it('defaults week start to Monday when no profile exists', () => {
    expect(buildAccountContext({ id: 'user-4', email: 'alex@example.com' }, null).weekStart).toBe(
      1,
    );
  });
});
