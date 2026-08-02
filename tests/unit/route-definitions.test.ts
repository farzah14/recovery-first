import { describe, expect, it } from 'vitest';

import {
  applicationNavigation,
  publicNavigation,
  routes,
} from '@/lib/navigation/route-definitions';

const unique = <T>(values: readonly T[]): boolean => new Set(values).size === values.length;

describe('route definitions', () => {
  it('defines unique public and application paths', () => {
    const paths = Object.values(routes);
    expect(unique(paths)).toBe(true);
  });

  it('exposes the required public navigation model', () => {
    expect(publicNavigation.map((item) => item.label)).toEqual([
      'Features',
      'How It Works',
      'Pricing',
      'Help',
    ]);
  });

  it('keeps desktop and mobile application destinations in one model', () => {
    expect(applicationNavigation.map((item) => item.label)).toEqual([
      'Today',
      'Habits',
      'Review',
      'Insights',
      'Reminders',
      'Settings',
    ]);
    expect(
      applicationNavigation.filter((item) => item.mobilePrimary).map((item) => item.label),
    ).toEqual(['Today', 'Habits', 'Review', 'Insights']);
  });
});
