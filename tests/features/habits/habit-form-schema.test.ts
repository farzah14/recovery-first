import { describe, expect, it } from 'vitest';

import { habitFormSchema } from '@/features/habits/forms/habit-form-schema';
import type { HabitFormValues } from '@/features/habits/forms/habit-form-types';
import { mapHabitFormToCreateCommand } from '@/features/habits/mappers/habit-form-mapper';

const validForm: HabitFormValues = {
  creationRoute: 'custom' as const,
  templateId: null,
  category: 'movement',
  title: 'Walk after lunch',
  normalAction: 'Walk for 20 minutes',
  normalQuantity: 20,
  normalUnit: 'minutes',
  minimumAction: 'Walk for 5 minutes',
  minimumQuantity: 5,
  minimumUnit: 'minutes',
  recurrenceKind: 'weekdays' as const,
  weekdays: [1, 2, 3, 4, 5],
  timesPerWeek: null,
  cueType: 'after_activity' as const,
  cueValue: 'After lunch',
  timezone: 'Asia/Jakarta',
  reminderEnabled: false,
  reminderLocalTime: null,
  startLocalDate: '2026-07-30',
  activate: true,
};

describe('habitFormSchema', () => {
  it('requires distinct non-empty Normal and Minimum actions', () => {
    expect(habitFormSchema.safeParse(validForm).success).toBe(true);
    expect(
      habitFormSchema.safeParse({ ...validForm, minimumAction: validForm.normalAction }).success,
    ).toBe(false);
  });

  it('requires weekdays for selected-weekday recurrence', () => {
    expect(habitFormSchema.safeParse({ ...validForm, weekdays: [] }).success).toBe(false);
  });

  it('maps validated form values to a stable create command', () => {
    const command = mapHabitFormToCreateCommand(validForm, {
      commandId: '00000000-0000-4000-8000-000000000401',
      habitId: '00000000-0000-4000-8000-000000000402',
      habitVersionId: '00000000-0000-4000-8000-000000000403',
      owner: {
        ownerId: 'guest-installation-1',
        identityMode: 'guest',
        planTier: 'guest',
        timezone: 'Asia/Jakarta',
      },
      now: '2026-07-29T13:00:00.000Z',
    });
    expect(command.normalTarget.action).toBe('Walk for 20 minutes');
    expect(command.minimumTarget.action).toBe('Walk for 5 minutes');
    expect(command.owner.planTier).toBe('guest');
  });
});
