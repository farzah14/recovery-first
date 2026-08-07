import type { BasicHabitTemplate } from '@/features/templates/catalog';
import type { HabitFormValues } from '@/features/habits/forms/habit-form-types';

export function createHabitFormDefaults(input: {
  timezone: string;
  startLocalDate: string;
  template?: BasicHabitTemplate;
}): HabitFormValues {
  const template = input.template;
  return {
    creationRoute: template ? 'template' : 'custom',
    templateId: template?.id ?? null,
    category: template?.category ?? 'other',
    title: template?.title ?? '',
    normalAction: template?.normalTarget.action ?? '',
    normalQuantity: template?.normalTarget.quantity ?? null,
    normalUnit: template?.normalTarget.unit ?? null,
    minimumAction: template?.minimumTarget.action ?? '',
    minimumQuantity: template?.minimumTarget.quantity ?? null,
    minimumUnit: template?.minimumTarget.unit ?? null,
    recurrenceKind:
      template?.recurrence.kind === 'daily'
        ? 'daily'
        : template?.recurrence.kind === 'weekdays'
          ? 'weekdays'
          : template?.recurrence.kind === 'times_per_week'
            ? 'times_per_week'
            : 'daily',
    weekdays:
      template?.recurrence.kind === 'weekdays'
        ? [...template.recurrence.weekdays]
        : template?.recurrence.kind === 'times_per_week'
          ? [...template.recurrence.placement]
          : [],
    timesPerWeek: template?.recurrence.kind === 'times_per_week' ? template.recurrence.count : null,
    cueType: template?.cue.type ?? 'none',
    cueValue: template?.cue.value ?? null,
    timezone: input.timezone,
    reminderEnabled: false,
    reminderLocalTime: null,
    startLocalDate: input.startLocalDate,
    activate: true,
  };
}
