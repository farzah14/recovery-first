import { describe, expect, it } from 'vitest';

import { getLocalDateForTimezone, getLocalWeekRange } from '@/lib/dates/local-week';

describe('getLocalDateForTimezone', () => {
  it('formats the date in the owner timezone instead of the browser UTC date', () => {
    expect(getLocalDateForTimezone('Asia/Jakarta', new Date('2026-08-06T23:00:00.000Z'))).toBe(
      '2026-08-07',
    );
  });
});

describe('getLocalWeekRange', () => {
  it('returns the Monday-to-Sunday window containing the local date', () => {
    expect(getLocalWeekRange('2026-08-06')).toEqual({
      todayDate: '2026-08-06',
      startDate: '2026-08-03',
      endDate: '2026-08-09',
      dates: [
        '2026-08-03',
        '2026-08-04',
        '2026-08-05',
        '2026-08-06',
        '2026-08-07',
        '2026-08-08',
        '2026-08-09',
      ],
    });
  });

  it('handles Sunday as the final day of the same week', () => {
    expect(getLocalWeekRange('2026-08-09')).toMatchObject({
      todayDate: '2026-08-09',
      startDate: '2026-08-03',
      endDate: '2026-08-09',
    });
  });
});

describe('getLocalWeekRange with a custom week start', () => {
  it('returns the Sunday-to-Saturday window when the week starts on Sunday', () => {
    expect(getLocalWeekRange('2026-08-06', 7)).toEqual({
      todayDate: '2026-08-06',
      startDate: '2026-08-02',
      endDate: '2026-08-08',
      dates: [
        '2026-08-02',
        '2026-08-03',
        '2026-08-04',
        '2026-08-05',
        '2026-08-06',
        '2026-08-07',
        '2026-08-08',
      ],
    });
  });

  it('treats the week start day as the first day of the window', () => {
    expect(getLocalWeekRange('2026-08-09', 7)).toMatchObject({
      todayDate: '2026-08-09',
      startDate: '2026-08-09',
      endDate: '2026-08-15',
    });
  });

  it('treats Saturday as the last day when the week starts on Sunday', () => {
    expect(getLocalWeekRange('2026-08-08', 7)).toMatchObject({
      startDate: '2026-08-02',
      endDate: '2026-08-08',
    });
  });

  it('keeps the Monday default when weekStart is omitted', () => {
    expect(getLocalWeekRange('2026-08-06')).toMatchObject({
      startDate: '2026-08-03',
      endDate: '2026-08-09',
    });
  });
});
