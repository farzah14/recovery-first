export const habitLifecycleStates = [
  'draft',
  'starting',
  'building',
  'active',
  'stable',
  'at_risk',
  'recovery',
  'rebuilding',
  'needs_review',
  'paused',
  'stopped',
  'completed',
  'archived',
  'trash',
  'decision_required',
] as const;

export type HabitLifecycleState = (typeof habitLifecycleStates)[number];

const slotConsumingStates = new Set<HabitLifecycleState>([
  'starting',
  'building',
  'active',
  'stable',
  'at_risk',
  'recovery',
  'rebuilding',
  'needs_review',
]);

const allowedTransitions: Readonly<Record<HabitLifecycleState, readonly HabitLifecycleState[]>> = {
  draft: ['starting', 'trash'],
  starting: ['building', 'paused', 'trash'],
  building: ['active', 'recovery', 'paused', 'trash'],
  active: ['stable', 'recovery', 'paused', 'stopped', 'completed', 'trash'],
  stable: ['at_risk', 'recovery', 'paused', 'stopped', 'completed', 'trash'],
  at_risk: ['recovery', 'paused', 'stopped', 'trash'],
  recovery: ['rebuilding', 'needs_review', 'paused', 'trash'],
  rebuilding: ['building', 'active', 'recovery', 'paused', 'trash'],
  needs_review: ['rebuilding', 'paused', 'stopped', 'trash'],
  paused: ['rebuilding', 'stopped', 'trash'],
  stopped: ['archived', 'rebuilding', 'trash'],
  completed: ['archived', 'rebuilding', 'trash'],
  archived: ['rebuilding', 'trash'],
  trash: ['rebuilding'],
  decision_required: ['draft', 'paused', 'rebuilding', 'trash'],
};

export function isSlotConsumingHabitState(state: HabitLifecycleState): boolean {
  return slotConsumingStates.has(state);
}

export function canTransitionHabit(from: HabitLifecycleState, to: HabitLifecycleState): boolean {
  return allowedTransitions[from].includes(to);
}
