import { describe, expect, it } from 'vitest';

import { frictionFormSchema } from '@/features/check-ins/forms/friction-form-schema';

describe('frictionFormSchema', () => {
  it('accepts no friction, controlled reasons, and a private note', () => {
    expect(frictionFormSchema.parse({ frictionCode: null, frictionNote: null })).toEqual({
      frictionCode: null,
      frictionNote: null,
    });
    expect(
      frictionFormSchema.parse({ frictionCode: 'no_time', frictionNote: 'Meeting ran late' }),
    ).toEqual({
      frictionCode: 'no_time',
      frictionNote: 'Meeting ran late',
    });
  });

  it('rejects unknown friction codes and oversized notes', () => {
    expect(() =>
      frictionFormSchema.parse({ frictionCode: 'secret_reason', frictionNote: null }),
    ).toThrow();
    expect(() =>
      frictionFormSchema.parse({ frictionCode: 'other', frictionNote: 'x'.repeat(241) }),
    ).toThrow();
  });
});
