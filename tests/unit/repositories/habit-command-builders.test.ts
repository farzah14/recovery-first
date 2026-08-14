import { describe, expect, it } from 'vitest';

import type { ProductOwner } from '@/lib/repositories/product-repository';
import {
  buildCreateHabitCommand,
  buildHabitVersionCommand,
  type HabitFormInput,
} from '@/lib/repositories/habit-command-builders';

const owner: ProductOwner = {
  ownerId: '15000000-0000-4000-8000-000000000001',
  identityMode: 'account',
  planTier: 'free',
  timezone: 'Asia/Jakarta',
  weekStart: 1,
};

const form: HabitFormInput = {
  name: 'Morning Grounding',
  category: 'Mindfulness',
  normalTarget: '10 minutes meditation',
  minimumTarget: '2 minutes breathing',
  icon: 'meditation',
  startDate: '2026-08-07',
  fromTime: '08:00',
  untilTime: '09:00',
  timingContext: '08:00 AM - 09:00 AM',
};

describe('habit command builders', () => {
  it('maps the create dialog into a complete Supabase command', () => {
    const command = buildCreateHabitCommand(form, owner, {
      habitId: '25000000-0000-4000-8000-000000000001',
      habitVersionId: '35000000-0000-4000-8000-000000000001',
      commandId: '45000000-0000-4000-8000-000000000001',
      now: '2026-08-06T00:00:00.000Z',
    });

    expect(command).toMatchObject({
      title: 'Morning Grounding',
      category: 'Mindfulness',
      startLocalDate: '2026-08-07',
      activate: true,
      presentation: {
        description: 'Target: 10 minutes meditation (Min: 2 minutes breathing)',
        icon: 'meditation',
        fromTime: '08:00',
        untilTime: '09:00',
        startLocalDate: '2026-08-07',
      },
    });
    expect(command.normalTarget.label).toBe('10 minutes meditation');
    expect(command.minimumTarget.label).toBe('2 minutes breathing');
    expect(command.recurrence).toEqual({ kind: 'daily' });
  });

  it('maps an edit into a revision-checked immutable version command', () => {
    const command = buildHabitVersionCommand(
      { ...form, name: 'Updated Grounding', normalTarget: '12 minutes meditation' },
      owner,
      {
        habitId: '25000000-0000-4000-8000-000000000001',
        habitVersionId: '37000000-0000-4000-8000-000000000001',
        commandId: '47000000-0000-4000-8000-000000000001',
        expectedRevision: 3,
      },
    );

    expect(command).toMatchObject({
      habitId: '25000000-0000-4000-8000-000000000001',
      expectedRevision: 3,
      title: 'Updated Grounding',
      category: 'Mindfulness',
      source: 'redesign',
      presentation: { description: 'Target: 12 minutes meditation (Min: 2 minutes breathing)' },
    });
  });
});
