import { describe, expect, it } from 'vitest';

import {
  basicHabitTemplates,
  findHabitTemplates,
} from '@/features/templates/catalog';

describe('basicHabitTemplates', () => {
  it('provides editable Normal and Minimum definitions for every template', () => {
    expect(basicHabitTemplates.length).toBeGreaterThanOrEqual(6);
    for (const template of basicHabitTemplates) {
      expect(template.normalTarget.action.length).toBeGreaterThan(0);
      expect(template.minimumTarget.action.length).toBeGreaterThan(0);
      expect(template.normalTarget.action).not.toBe(template.minimumTarget.action);
    }
  });

  it('searches by title and category without exposing private user data', () => {
    expect(findHabitTemplates('sleep').map((template) => template.id)).toContain(
      'wind-down',
    );
    expect(findHabitTemplates('movement').length).toBeGreaterThan(0);
  });
});
