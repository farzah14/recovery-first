import { describe, expect, it } from 'vitest';

import { zonedLocalDateTimeToUtc } from '@/lib/dates/zoned-time';

describe('zonedLocalDateTimeToUtc', () => {
  it('converts a Jakarta scheduled time to its UTC instant', () => {
    expect(zonedLocalDateTimeToUtc('2026-09-04', '08:00:00', 'Asia/Jakarta')).toBe(
      '2026-09-04T01:00:00.000Z',
    );
  });

  it('converts a local three-day deadline at the end of day', () => {
    expect(zonedLocalDateTimeToUtc('2026-09-07', '23:59:59', 'Asia/Jakarta')).toBe(
      '2026-09-07T16:59:59.000Z',
    );
  });

  it('uses the post-fallback Pacific offset', () => {
    expect(zonedLocalDateTimeToUtc('2026-11-01', '08:00:00', 'America/Los_Angeles')).toBe(
      '2026-11-01T16:00:00.000Z',
    );
  });
});
