import { describe, expect, it } from 'vitest';

import {
  canTransitionHabit,
  isSlotConsumingHabitState,
  type HabitLifecycleState,
} from '@/domain/habits/habit-lifecycle';

describe('habit lifecycle', () => {
  it.each<HabitLifecycleState>([
    'starting',
    'building',
    'active',
    'stable',
    'at_risk',
    'recovery',
    'rebuilding',
    'needs_review',
  ])('treats %s as slot consuming', (state) => {
    expect(isSlotConsumingHabitState(state)).toBe(true);
  });

  it.each<HabitLifecycleState>([
    'draft',
    'paused',
    'stopped',
    'completed',
    'archived',
    'trash',
    'decision_required',
  ])('treats %s as not slot consuming', (state) => {
    expect(isSlotConsumingHabitState(state)).toBe(false);
  });

  it('allows only explicitly approved transitions', () => {
    expect(canTransitionHabit('draft', 'starting')).toBe(true);
    expect(canTransitionHabit('stable', 'recovery')).toBe(true);
    expect(canTransitionHabit('trash', 'rebuilding')).toBe(true);
    expect(canTransitionHabit('draft', 'stable')).toBe(false);
    expect(canTransitionHabit('trash', 'active')).toBe(false);
  });
});
