import { afterEach, describe, expect, it, vi } from 'vitest';

import { detectDeviceTimezone, detectWeekStart } from '@/lib/dates/device-time';

function stubIntlDateTimeFormat(timeZone: string | undefined, throws = false): void {
  vi.stubGlobal('Intl', {
    DateTimeFormat: class {
      resolvedOptions(): { timeZone: string | undefined } {
        if (throws) throw new Error('intl unavailable');
        return { timeZone };
      }
    },
  });
}

function stubLocaleWeekStart(firstDay: number | undefined): void {
  vi.stubGlobal('Intl', {
    Locale: class {
      weekInfo = firstDay === undefined ? undefined : { firstDay };
    },
  });
}

describe('detectDeviceTimezone', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the device timezone reported by Intl', () => {
    stubIntlDateTimeFormat('Asia/Jakarta');
    expect(detectDeviceTimezone()).toBe('Asia/Jakarta');
  });

  it('falls back to UTC when Intl reports no timezone', () => {
    stubIntlDateTimeFormat(undefined);
    expect(detectDeviceTimezone()).toBe('UTC');
  });

  it('falls back to UTC when Intl throws', () => {
    stubIntlDateTimeFormat('Asia/Jakarta', true);
    expect(detectDeviceTimezone()).toBe('UTC');
  });

  it('falls back to UTC when Intl is unavailable', () => {
    vi.stubGlobal('Intl', undefined);
    expect(detectDeviceTimezone()).toBe('UTC');
  });
});

describe('detectWeekStart', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the first day of the week from the device locale', () => {
    stubLocaleWeekStart(7);
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(detectWeekStart()).toBe(7);
  });

  it('returns a supported weekday when the locale reports it', () => {
    stubLocaleWeekStart(6);
    vi.stubGlobal('navigator', { language: 'en-GB' });
    expect(detectWeekStart()).toBe(6);
  });

  it('falls back to Monday when weekInfo is missing', () => {
    stubLocaleWeekStart(undefined);
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(detectWeekStart()).toBe(1);
  });

  it('falls back to Monday when navigator or Intl.Locale is unavailable', () => {
    vi.stubGlobal('Intl', undefined);
    vi.stubGlobal('navigator', undefined);
    expect(detectWeekStart()).toBe(1);
  });
});
