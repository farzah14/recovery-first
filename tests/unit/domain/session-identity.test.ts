import { describe, expect, it } from 'vitest';

import { buildSessionIdentity, isValidIanaTimezone } from '@/domain/habits/session-identity';

describe('session identity', () => {
  it('creates the same identity for the same occurrence', () => {
    const input = {
      habitId: '11111111-1111-4111-8111-111111111111',
      habitVersionId: '22222222-2222-4222-8222-222222222222',
      scheduledLocalDate: '2026-08-01',
      scheduledLocalTime: '07:30',
    } as const;

    expect(buildSessionIdentity(input)).toBe(buildSessionIdentity(input));
  });

  it('distinguishes timed and all-day sessions', () => {
    const base = {
      habitId: '11111111-1111-4111-8111-111111111111',
      habitVersionId: '22222222-2222-4222-8222-222222222222',
      scheduledLocalDate: '2026-08-01',
    } as const;

    expect(buildSessionIdentity({ ...base, scheduledLocalTime: null })).not.toBe(
      buildSessionIdentity({ ...base, scheduledLocalTime: '07:30' }),
    );
  });

  it('validates IANA timezone names', () => {
    expect(isValidIanaTimezone('Asia/Jakarta')).toBe(true);
    expect(isValidIanaTimezone('Not/A_Timezone')).toBe(false);
  });
});
