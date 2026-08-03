import type { HabitFormValues } from '@/features/habits/forms/habit-form-types';
import type {
  CreateHabitCommand,
  ProductOwner,
} from '@/lib/repositories/product-repository';

export function mapHabitFormToCreateCommand(
  values: HabitFormValues,
  context: {
    commandId: string;
    habitId: string;
    habitVersionId: string;
    owner: ProductOwner;
    now: string;
  },
): CreateHabitCommand {
  return {
    commandId: context.commandId,
    habitId: context.habitId,
    habitVersionId: context.habitVersionId,
    owner: { ...context.owner, timezone: values.timezone },
    title: values.title,
    category: values.category,
    normalTarget: {
      action: values.normalAction,
      quantity: values.normalQuantity,
      unit: values.normalUnit,
      estimatedMinutes: values.normalUnit === 'minutes' ? values.normalQuantity : null,
    },
    minimumTarget: {
      action: values.minimumAction,
      quantity: values.minimumQuantity,
      unit: values.minimumUnit,
      estimatedMinutes: values.minimumUnit === 'minutes' ? values.minimumQuantity : null,
    },
    recurrence:
      values.recurrenceKind === 'daily'
        ? { kind: 'daily' }
        : values.recurrenceKind === 'weekdays'
          ? { kind: 'weekdays', weekdays: values.weekdays }
          : {
              kind: 'times_per_week',
              count: values.timesPerWeek ?? 1,
              placement: values.weekdays,
            },
    cue: { type: values.cueType, value: values.cueValue },
    reminderIntent: {
      enabled: values.reminderEnabled,
      localTime: values.reminderLocalTime,
    },
    startLocalDate: values.startLocalDate,
    activate: values.activate,
    clientCreatedAt: context.now,
  };
}
