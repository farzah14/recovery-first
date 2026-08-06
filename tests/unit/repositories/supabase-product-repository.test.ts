import { describe, expect, it } from 'vitest';

import type { ProductOwner } from '@/lib/repositories/product-repository';
import { createSupabaseProductRepository } from '@/lib/repositories/signed-in/supabase-product-repository';

const owner: ProductOwner = {
  ownerId: '15000000-0000-4000-8000-000000000001',
  identityMode: 'account',
  planTier: 'free',
  timezone: 'Asia/Jakarta',
};

function createFakeClient({
  tableRows = {},
  rpcRows = {},
}: {
  tableRows?: Record<string, unknown>;
  rpcRows?: Record<string, unknown>;
} = {}) {
  const calls: Array<{ kind: 'from' | 'rpc'; name: string; args?: unknown }> = [];
  const client = {
    from(table: string) {
      calls.push({ kind: 'from', name: table });
      const sourceRows = Array.isArray(tableRows[table])
        ? (tableRows[table] as Array<Record<string, unknown>>)
        : [];
      const filters: Array<(row: Record<string, unknown>) => boolean> = [];
      const builder: Record<string, unknown> = {};
      builder.select = () => builder;
      builder.eq = (column: string, value: unknown) => {
        filters.push((row) => row[column] === value);
        return builder;
      };
      builder.is = (column: string, value: unknown) => {
        filters.push((row) => (value === null ? row[column] == null : row[column] === value));
        return builder;
      };
      builder.in = (column: string, values: unknown[]) => {
        filters.push((row) => values.includes(row[column]));
        return builder;
      };
      builder.gte = () => builder;
      builder.lte = () => builder;
      builder.order = () => builder;
      builder.then = (
        resolve: (value: { data: Array<Record<string, unknown>>; error: null }) => unknown,
      ) =>
        Promise.resolve({
          data: sourceRows.filter((row) => filters.every((filter) => filter(row))),
          error: null,
        }).then(resolve);
      return builder;
    },
    async rpc(name: string, args: unknown) {
      calls.push({ kind: 'rpc', name, args });
      return { data: rpcRows[name] ?? {}, error: null };
    },
  } as unknown as Parameters<typeof createSupabaseProductRepository>[0]['client'];

  return { client, calls };
}

describe('SupabaseProductRepository', () => {
  it('creates a habit through the atomic Supabase command', async () => {
    const { client, calls } = createFakeClient({
      rpcRows: {
        create_habit: {
          habitId: '25000000-0000-4000-8000-000000000001',
          habitVersionId: '35000000-0000-4000-8000-000000000001',
          lifecycleState: 'starting',
          activeCount: 1,
        },
      },
    });
    const repository = createSupabaseProductRepository({ client, owner });

    const result = await repository.createHabit({
      commandId: '45000000-0000-4000-8000-000000000001',
      habitId: '25000000-0000-4000-8000-000000000001',
      habitVersionId: '35000000-0000-4000-8000-000000000001',
      owner,
      title: 'Daily Grounding',
      category: 'Mindfulness',
      normalTarget: { action: 'meditate', quantity: 10, unit: 'minutes', estimatedMinutes: 10 },
      minimumTarget: { action: 'meditate', quantity: 2, unit: 'minutes', estimatedMinutes: 2 },
      recurrence: { kind: 'daily' },
      cue: { type: 'time', value: '08:00' },
      presentation: {
        description: 'A short grounding practice.',
        icon: 'meditation',
        fromTime: '08:00',
        untilTime: '09:00',
        timingContext: '08:00 AM - 09:00 AM',
        startLocalDate: '2026-08-06',
      },
      reminderIntent: { enabled: false, localTime: null },
      startLocalDate: '2026-08-06',
      activate: true,
      clientCreatedAt: '2026-08-06T00:00:00.000Z',
    });

    expect(result).toMatchObject({ habitId: '25000000-0000-4000-8000-000000000001' });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ kind: 'rpc', name: 'create_habit' });
    expect(calls[0]?.args).toMatchObject({
      p_habit_id: '25000000-0000-4000-8000-000000000001',
      p_category: 'Mindfulness',
      p_version_id: '35000000-0000-4000-8000-000000000001',
      p_command_id: '45000000-0000-4000-8000-000000000001',
    });
  });

  it('reads only the authenticated owner habits', async () => {
    const { client, calls } = createFakeClient({
      tableRows: {
        habits: [
          {
            id: '25000000-0000-4000-8000-000000000001',
            user_id: owner.ownerId,
            title: 'Daily Grounding',
            category: 'Mindfulness',
            lifecycle_state: 'starting',
            current_version_id: '35000000-0000-4000-8000-000000000001',
            revision: 2,
            created_at: '2026-08-06T00:00:00.000Z',
            updated_at: '2026-08-06T00:00:00.000Z',
          },
        ],
      },
    });
    const repository = createSupabaseProductRepository({ client, owner });

    const habits = await repository.listHabits(owner);

    expect(habits).toHaveLength(1);
    expect(habits[0]).toMatchObject({ title: 'Daily Grounding', lifecycleState: 'starting' });
    expect(calls[0]).toMatchObject({ kind: 'from', name: 'habits' });
  });

  it('records a skipped UI action as a manual_skipped database outcome', async () => {
    const { client, calls } = createFakeClient({
      rpcRows: {
        record_check_in: {
          checkInId: '65000000-0000-4000-8000-000000000001',
          sessionId: '55000000-0000-4000-8000-000000000001',
          sessionRevision: 2,
          outcome: 'manual_skipped',
        },
      },
    });
    const repository = createSupabaseProductRepository({ client, owner });

    await repository.recordCheckIn({
      commandId: '45000000-0000-4000-8000-000000000002',
      owner,
      sessionId: '55000000-0000-4000-8000-000000000001',
      outcome: 'manual_skipped',
      frictionCode: 'too_tired',
      frictionNote: null,
      expectedSessionRevision: 1,
      clientRecordedAt: '2026-08-06T01:00:00.000Z',
    });

    expect(calls[0]).toMatchObject({ kind: 'rpc', name: 'record_check_in' });
    expect(calls[0]?.args).toMatchObject({
      p_outcome: 'manual_skipped',
      p_expected_session_revision: 1,
      p_friction_code: 'too_tired',
    });
  });

  it('redesigns a habit with a new immutable version and presentation metadata', async () => {
    const { client, calls } = createFakeClient({
      rpcRows: {
        redesign_habit: {
          habitId: '25000000-0000-4000-8000-000000000001',
          habitVersionId: '37000000-0000-4000-8000-000000000001',
          habitRevision: 4,
        },
      },
    });
    const repository = createSupabaseProductRepository({ client, owner });

    await repository.updateHabitVersion({
      commandId: '47000000-0000-4000-8000-000000000001',
      habitId: '25000000-0000-4000-8000-000000000001',
      habitVersionId: '37000000-0000-4000-8000-000000000001',
      owner,
      title: 'Updated Grounding',
      category: 'Mindfulness',
      expectedRevision: 3,
      normalTarget: {
        action: 'ground',
        quantity: null,
        unit: null,
        estimatedMinutes: null,
        label: '20 minutes grounding',
      },
      minimumTarget: {
        action: 'ground',
        quantity: null,
        unit: null,
        estimatedMinutes: null,
        label: '3 minutes grounding',
      },
      recurrence: { kind: 'daily' },
      cue: { type: 'time', value: '09:00' },
      presentation: {
        description: 'Updated grounding practice.',
        icon: 'exercise',
        fromTime: '09:00',
        untilTime: '10:00',
        timingContext: '09:00 AM - 10:00 AM',
        startLocalDate: '2026-08-07',
      },
      source: 'redesign',
    });

    expect(calls[0]).toMatchObject({ kind: 'rpc', name: 'redesign_habit' });
    expect(calls[0]?.args).toMatchObject({
      p_category: 'Mindfulness',
      p_expected_revision: 3,
      p_metadata: expect.objectContaining({ description: 'Updated grounding practice.' }),
    });
  });

  it('changes lifecycle through the owner-scoped lifecycle command', async () => {
    const { client, calls } = createFakeClient({
      rpcRows: { set_habit_lifecycle: { habitId: '25000000-0000-4000-8000-000000000001' } },
    });
    const repository = createSupabaseProductRepository({ client, owner });

    await repository.setHabitLifecycle({
      commandId: '48000000-0000-4000-8000-000000000001',
      owner,
      habitId: '25000000-0000-4000-8000-000000000001',
      expectedRevision: 2,
      nextState: 'paused',
    });

    expect(calls[0]).toMatchObject({ kind: 'rpc', name: 'set_habit_lifecycle' });
    expect(calls[0]?.args).toMatchObject({ p_next_state: 'paused', p_expected_revision: 2 });
  });

  it('hydrates Today from persisted sessions and immutable version metadata', async () => {
    const { client } = createFakeClient({
      tableRows: {
        habits: [
          {
            id: '25000000-0000-4000-8000-000000000001',
            user_id: owner.ownerId,
            title: 'Morning Grounding',
            category: 'Mindfulness',
            lifecycle_state: 'starting',
            current_version_id: '35000000-0000-4000-8000-000000000001',
            revision: 3,
            created_at: '2026-08-06T00:00:00.000Z',
            updated_at: '2026-08-06T00:00:00.000Z',
            deleted_at: null,
          },
        ],
        habit_versions: [
          {
            id: '35000000-0000-4000-8000-000000000001',
            habit_id: '25000000-0000-4000-8000-000000000001',
            version_number: 1,
            normal_target: { action: 'ground', label: '10 minutes grounding' },
            minimum_target: { action: 'ground', label: '2 minutes grounding' },
            schedule_rule: { kind: 'daily', fromTime: '08:00', untilTime: '09:00' },
            cue: { type: 'time', value: '08:00' },
            metadata: {
              description: 'Grounding',
              icon: 'meditation',
              fromTime: '08:00',
              untilTime: '09:00',
              timingContext: '08:00 AM - 09:00 AM',
              startLocalDate: '2026-08-06',
              recurrence: { kind: 'daily' },
              cue: { type: 'time', value: '08:00' },
            },
            created_at: '2026-08-06T00:00:00.000Z',
            source: 'creation',
          },
        ],
        today_session_view: [
          {
            session_id: '55000000-0000-4000-8000-000000000001',
            user_id: owner.ownerId,
            habit_id: '25000000-0000-4000-8000-000000000001',
            habit_title: 'Morning Grounding',
            habit_version_id: '35000000-0000-4000-8000-000000000001',
            scheduled_local_date: '2026-08-06',
            scheduled_local_time: '08:00',
            timezone_snapshot: 'Asia/Jakarta',
            status: 'unrecorded',
            revision: 1,
          },
        ],
      },
    });
    const repository = createSupabaseProductRepository({ client, owner });

    const today = await repository.getToday(owner, '2026-08-06');

    expect(today.sessions[0]).toMatchObject({
      id: '55000000-0000-4000-8000-000000000001',
      title: 'Morning Grounding',
      category: 'Mindfulness',
      icon: 'meditation',
      timingContext: '08:00 AM - 09:00 AM',
      habitRevision: 3,
      status: 'unrecorded',
    });
  });

  it('aggregates the authenticated owner sessions into a Monday-to-Sunday overview', async () => {
    const { client, calls } = createFakeClient({
      tableRows: {
        habits: [
          {
            id: '25000000-0000-4000-8000-000000000001',
            lifecycle_state: 'active',
            deleted_at: null,
            user_id: owner.ownerId,
          },
          {
            id: '25000000-0000-4000-8000-000000000002',
            lifecycle_state: 'active',
            deleted_at: null,
            user_id: owner.ownerId,
          },
        ],
        sessions: [
          {
            habit_id: '25000000-0000-4000-8000-000000000001',
            scheduled_local_date: '2026-08-03',
            status: 'full',
            user_id: owner.ownerId,
          },
          {
            habit_id: '25000000-0000-4000-8000-000000000002',
            scheduled_local_date: '2026-08-03',
            status: 'unrecorded',
            user_id: owner.ownerId,
          },
          {
            habit_id: '25000000-0000-4000-8000-000000000001',
            scheduled_local_date: '2026-08-04',
            status: 'minimum',
            user_id: owner.ownerId,
          },
          {
            habit_id: '25000000-0000-4000-8000-000000000002',
            scheduled_local_date: '2026-08-04',
            status: 'manual_skipped',
            user_id: owner.ownerId,
          },
          {
            habit_id: '25000000-0000-4000-8000-000000000001',
            scheduled_local_date: '2026-08-10',
            status: 'full',
            user_id: owner.ownerId,
          },
        ],
      },
    });
    const repository = createSupabaseProductRepository({ client, owner });

    const overview = await repository.getWeeklyOverview(owner, '2026-08-06');

    expect(overview).toEqual({
      todayDate: '2026-08-06',
      startDate: '2026-08-03',
      endDate: '2026-08-09',
      days: [
        { localDate: '2026-08-03', completedCount: 1, totalCount: 2 },
        { localDate: '2026-08-04', completedCount: 1, totalCount: 2 },
        { localDate: '2026-08-05', completedCount: 0, totalCount: 0 },
        { localDate: '2026-08-06', completedCount: 0, totalCount: 0 },
        { localDate: '2026-08-07', completedCount: 0, totalCount: 0 },
        { localDate: '2026-08-08', completedCount: 0, totalCount: 0 },
        { localDate: '2026-08-09', completedCount: 0, totalCount: 0 },
      ],
    });
    expect(calls).toContainEqual({ kind: 'from', name: 'sessions' });
  });

  it('counts sessions only for active, non-deleted habits', async () => {
    const { client } = createFakeClient({
      tableRows: {
        habits: [
          {
            id: '25000000-0000-4000-8000-000000000001',
            lifecycle_state: 'active',
            deleted_at: null,
            user_id: owner.ownerId,
          },
          {
            id: '25000000-0000-4000-8000-000000000002',
            lifecycle_state: 'paused',
            deleted_at: null,
            user_id: owner.ownerId,
          },
          {
            id: '25000000-0000-4000-8000-000000000003',
            lifecycle_state: 'active',
            deleted_at: '2026-08-06T00:00:00.000Z',
            user_id: owner.ownerId,
          },
        ],
        sessions: [
          {
            habit_id: '25000000-0000-4000-8000-000000000001',
            scheduled_local_date: '2026-08-06',
            status: 'full',
            user_id: owner.ownerId,
          },
          {
            habit_id: '25000000-0000-4000-8000-000000000002',
            scheduled_local_date: '2026-08-06',
            status: 'minimum',
            user_id: owner.ownerId,
          },
          {
            habit_id: '25000000-0000-4000-8000-000000000003',
            scheduled_local_date: '2026-08-06',
            status: 'full',
            user_id: owner.ownerId,
          },
        ],
      },
    });
    const repository = createSupabaseProductRepository({ client, owner });

    const overview = await repository.getWeeklyOverview(owner, '2026-08-06');

    expect(overview.days[3]).toMatchObject({
      localDate: '2026-08-06',
      completedCount: 1,
      totalCount: 1,
    });
  });
});
