import { z } from 'zod';

import { frictionReasons } from '@/domain/check-ins/check-in';

export const frictionFormSchema = z.object({
  frictionCode: z.enum(frictionReasons).nullable(),
  frictionNote: z.string().trim().max(240).nullable(),
});
