import type { RecurrenceRule } from '@/domain/habits/recurrence';
import type { HabitCue, HabitTarget } from '@/lib/repositories/product-repository';

export type BasicHabitTemplate = {
  id: string;
  title: string;
  category: 'movement' | 'mindfulness' | 'learning' | 'sleep' | 'planning';
  description: string;
  normalTarget: HabitTarget;
  minimumTarget: HabitTarget;
  recurrence: RecurrenceRule;
  cue: HabitCue;
};

const everyDay: RecurrenceRule = { kind: 'daily' };

export const basicHabitTemplates: readonly BasicHabitTemplate[] = [
  {
    id: 'daily-walk',
    title: 'Daily walk',
    category: 'movement',
    description: 'Build regular movement with a smaller option for difficult days.',
    normalTarget: { action: 'Walk', quantity: 20, unit: 'minutes', estimatedMinutes: 20 },
    minimumTarget: { action: 'Walk outside', quantity: 5, unit: 'minutes', estimatedMinutes: 5 },
    recurrence: everyDay,
    cue: { type: 'after_activity', value: 'After lunch' },
  },
  {
    id: 'stretch',
    title: 'Stretch',
    category: 'movement',
    description: 'Maintain mobility with a brief continuity option.',
    normalTarget: { action: 'Stretch', quantity: 10, unit: 'minutes', estimatedMinutes: 10 },
    minimumTarget: { action: 'Do one stretch', quantity: 2, unit: 'minutes', estimatedMinutes: 2 },
    recurrence: everyDay,
    cue: { type: 'after_activity', value: 'After waking up' },
  },
  {
    id: 'mindful-breathing',
    title: 'Mindful breathing',
    category: 'mindfulness',
    description: 'Practice calm attention without requiring a long session.',
    normalTarget: {
      action: 'Practice mindful breathing',
      quantity: 10,
      unit: 'minutes',
      estimatedMinutes: 10,
    },
    minimumTarget: {
      action: 'Take ten mindful breaths',
      quantity: 10,
      unit: 'breaths',
      estimatedMinutes: 2,
    },
    recurrence: everyDay,
    cue: { type: 'time', value: '20:00' },
  },
  {
    id: 'read',
    title: 'Read',
    category: 'learning',
    description: 'Keep reading momentum with a one-page Minimum.',
    normalTarget: { action: 'Read', quantity: 20, unit: 'minutes', estimatedMinutes: 20 },
    minimumTarget: { action: 'Read one page', quantity: 1, unit: 'page', estimatedMinutes: 3 },
    recurrence: everyDay,
    cue: { type: 'after_activity', value: 'After dinner' },
  },
  {
    id: 'wind-down',
    title: 'Evening wind-down',
    category: 'sleep',
    description: 'Create a predictable transition toward sleep.',
    normalTarget: {
      action: 'Follow wind-down routine',
      quantity: 30,
      unit: 'minutes',
      estimatedMinutes: 30,
    },
    minimumTarget: {
      action: 'Dim lights and put phone away',
      quantity: 5,
      unit: 'minutes',
      estimatedMinutes: 5,
    },
    recurrence: everyDay,
    cue: { type: 'time', value: '21:30' },
  },
  {
    id: 'plan-tomorrow',
    title: 'Plan tomorrow',
    category: 'planning',
    description: 'Reduce morning friction with a small planning ritual.',
    normalTarget: {
      action: 'Plan tomorrow',
      quantity: 10,
      unit: 'minutes',
      estimatedMinutes: 10,
    },
    minimumTarget: {
      action: 'Write the top priority',
      quantity: 1,
      unit: 'priority',
      estimatedMinutes: 2,
    },
    recurrence: everyDay,
    cue: { type: 'after_activity', value: 'Before ending work' },
  },
] as const;

export function findHabitTemplates(query: string): readonly BasicHabitTemplate[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return basicHabitTemplates;

  return basicHabitTemplates.filter((template) =>
    [template.title, template.category, template.description]
      .join(' ')
      .toLowerCase()
      .includes(normalized),
  );
}
