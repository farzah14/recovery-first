import type { z } from 'zod';

import type { habitFormSchema } from '@/features/habits/forms/habit-form-schema';

export type HabitFormValues = z.infer<typeof habitFormSchema>;
