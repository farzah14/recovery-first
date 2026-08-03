import { describe, expect, it } from 'vitest';

import {
  matchesDatePreset,
  matchesDateRange,
  normalizeCreatedDate,
  type DateFilterPreset,
} from '@/domain/habits/habit-filters';

const NOW = new Date(2026, 7, 3);

describe('normalizeCreatedDate', () => {
  it('returns ISO dates unchanged', () => {
    expect(normalizeCreatedDate('2024-01-05')).toBe('2024-01-05');
    expect(normalizeCreatedDate('2026-08-03')).toBe('2026-08-03');
  });

  it('parses seed-style month names to ISO dates', () => {
    expect(normalizeCreatedDate('Oct 12, 2023')).toBe('2023-10-12');
    expect(normalizeCreatedDate('Jan 05, 2024')).toBe('2024-01-05');
    expect(normalizeCreatedDate('Nov 20, 2023')).toBe('2023-11-20');
  });

  it('returns null for unparseable or empty values', () => {
    expect(normalizeCreatedDate('')).toBeNull();
    expect(normalizeCreatedDate('someday soon')).toBeNull();
    expect(normalizeCreatedDate('2024-13-99')).toBeNull();
  });
});

describe('matchesDatePreset', () => {
  it('matches every habit for the all preset', () => {
    expect(matchesDatePreset('2023-10-12', 'all', {}, NOW)).toBe(true);
    expect(matchesDatePreset('garbage', 'all', {}, NOW)).toBe(true);
  });

  it('matches only habits created today for the today preset', () => {
    expect(matchesDatePreset('2026-08-03', 'today', {}, NOW)).toBe(true);
    expect(matchesDatePreset('2026-08-02', 'today', {}, NOW)).toBe(false);
    expect(matchesDatePreset('Oct 12, 2023', 'today', {}, NOW)).toBe(false);
  });

  it('matches habits created within the last 7 days', () => {
    expect(matchesDatePreset('2026-07-28', 'last7', {}, NOW)).toBe(true);
    expect(matchesDatePreset('2026-08-03', 'last7', {}, NOW)).toBe(true);
    expect(matchesDatePreset('2026-07-27', 'last7', {}, NOW)).toBe(false);
  });

  it('matches habits created within the last 30 days', () => {
    expect(matchesDatePreset('2026-07-05', 'last30', {}, NOW)).toBe(true);
    expect(matchesDatePreset('2026-07-04', 'last30', {}, NOW)).toBe(false);
  });

  it('matches habits created in the current month', () => {
    expect(matchesDatePreset('2026-08-15', 'thisMonth', {}, NOW)).toBe(true);
    expect(matchesDatePreset('2026-07-15', 'thisMonth', {}, NOW)).toBe(false);
    expect(matchesDatePreset('2025-08-01', 'thisMonth', {}, NOW)).toBe(false);
    expect(matchesDatePreset('2026-08-03', 'thisMonth', {}, NOW)).toBe(true);
  });

  it('matches habits inside a custom range and converts seed dates', () => {
    const range = { from: '2023-01-01', to: '2023-12-31' };
    expect(matchesDatePreset('Oct 12, 2023', 'custom', range, NOW)).toBe(true);
    expect(matchesDatePreset('2023-12-31', 'custom', range, NOW)).toBe(true);
    expect(matchesDatePreset('2024-01-05', 'custom', range, NOW)).toBe(false);
  });

  it('excludes habits without a parseable date for specific presets', () => {
    const presets: Exclude<DateFilterPreset, 'all'>[] = [
      'today',
      'last7',
      'last30',
      'thisMonth',
      'custom',
    ];
    for (const preset of presets) {
      expect(matchesDatePreset('not-a-date', preset, {}, NOW)).toBe(false);
    }
  });
});

describe('matchesDateRange', () => {
  it('matches everything when no bounds are provided', () => {
    expect(matchesDateRange('2023-10-12')).toBe(true);
    expect(matchesDateRange('Oct 12, 2023')).toBe(true);
  });

  it('respects a lower bound only', () => {
    expect(matchesDateRange('2026-03-15', '2026-01-01')).toBe(true);
    expect(matchesDateRange('2025-12-31', '2026-01-01')).toBe(false);
  });

  it('respects an upper bound only', () => {
    expect(matchesDateRange('2026-03-15', undefined, '2026-06-30')).toBe(true);
    expect(matchesDateRange('2026-07-01', undefined, '2026-06-30')).toBe(false);
  });

  it('respects both bounds inclusively', () => {
    expect(matchesDateRange('2026-01-01', '2026-01-01', '2026-06-30')).toBe(true);
    expect(matchesDateRange('2026-06-30', '2026-01-01', '2026-06-30')).toBe(true);
    expect(matchesDateRange('2026-07-01', '2026-01-01', '2026-06-30')).toBe(false);
  });
});
