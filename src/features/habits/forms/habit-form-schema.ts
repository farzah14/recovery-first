import { z } from 'zod';

const weekdaySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);

export const habitFormSchema = z
  .object({
    creationRoute: z.enum(['template', 'custom']),
    templateId: z.string().nullable(),
    category: z.string().trim().min(1).max(40),
    title: z.string().trim().min(1).max(80),
    normalAction: z.string().trim().min(1).max(160),
    normalQuantity: z.number().positive().nullable(),
    normalUnit: z.string().trim().max(30).nullable(),
    minimumAction: z.string().trim().min(1).max(160),
    minimumQuantity: z.number().positive().nullable(),
    minimumUnit: z.string().trim().max(30).nullable(),
    recurrenceKind: z.enum(['daily', 'weekdays', 'times_per_week']),
    weekdays: z.array(weekdaySchema),
    timesPerWeek: z.number().int().min(1).max(7).nullable(),
    cueType: z.enum(['time', 'after_activity', 'location', 'none']),
    cueValue: z.string().trim().max(120).nullable(),
    timezone: z.string().trim().min(1),
    reminderEnabled: z.boolean(),
    reminderLocalTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
    startLocalDate: z.string().date(),
    activate: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.normalAction.toLowerCase() === value.minimumAction.toLowerCase()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minimumAction'],
        message: 'Minimum must describe a smaller valid action.',
      });
    }
    if (value.recurrenceKind === 'weekdays' && value.weekdays.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['weekdays'],
        message: 'Choose at least one weekday.',
      });
    }
    if (value.recurrenceKind === 'times_per_week') {
      if (value.timesPerWeek === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timesPerWeek'],
          message: 'Choose how many sessions occur each week.',
        });
      } else if (value.weekdays.length !== value.timesPerWeek) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['weekdays'],
          message: 'Choose one placement day for each weekly session.',
        });
      }
    }
    if (value.reminderEnabled && value.reminderLocalTime === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reminderLocalTime'],
        message: 'Choose a reminder time.',
      });
    }
  });
