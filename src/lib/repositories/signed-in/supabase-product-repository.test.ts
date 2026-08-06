import { describe, expect, it, vi } from 'vitest';

import { SupabaseProductRepository } from '@/lib/repositories/signed-in/supabase-product-repository';
import type { ProductOwner } from '@/lib/repositories/product-repository';
import type { SupabaseProductRepositoryClient } from '@/lib/repositories/signed-in/supabase-product-repository';

const owner: ProductOwner = {
  ownerId: '00000000-0000-4000-8000-000000000001',
  identityMode: 'account',
  planTier: 'free',
  timezone: 'Asia/Jakarta',
};

describe('SupabaseProductRepository', () => {
  function query(result: { data: unknown; error: null }): unknown {
    const builder: Record<string, unknown> = {};
    for (const method of ['select', 'eq', 'in', 'is', 'order', 'maybeSingle']) {
      builder[method] = vi.fn(() => builder);
    }
    builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject);
    return builder;
  }

  it('calls the authoritative check-in RPC with the expected revision and command ID', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        checkInId: 'check-in-1',
        sessionId: 'session-1',
        sessionRevision: 3,
        sessionStatus: 'minimum',
      },
      error: null,
    });
    const client = { rpc } as unknown as SupabaseProductRepositoryClient;
    const repository = new SupabaseProductRepository(client, owner.ownerId);

    await expect(
      repository.recordCheckIn({
        commandId: 'command-1',
        owner,
        sessionId: 'session-1',
        outcome: 'minimum',
        frictionCode: null,
        frictionNote: null,
        expectedSessionRevision: 2,
        clientRecordedAt: '2026-08-03T12:00:00.000Z',
      }),
    ).resolves.toMatchObject({
      checkInId: 'check-in-1',
      sessionId: 'session-1',
      outcome: 'minimum',
      sessionRevision: 3,
      synchronizationState: 'synced',
    });

    expect(rpc).toHaveBeenCalledWith(
      'record_check_in',
      expect.objectContaining({
        p_command_id: 'command-1',
        p_session_id: 'session-1',
        p_expected_session_revision: 2,
        p_outcome: 'minimum',
        p_recorded_local_at: '2026-08-03T12:00:00.000Z',
      }),
    );
  });

  it('maps database revision errors to the repository contract', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '40001', message: 'revision_conflict' },
    });
    const client = { rpc } as unknown as SupabaseProductRepositoryClient;
    const repository = new SupabaseProductRepository(client, owner.ownerId);

    await expect(
      repository.recordCheckIn({
        commandId: 'command-2',
        owner,
        sessionId: 'session-1',
        outcome: 'full',
        frictionCode: null,
        frictionNote: null,
        expectedSessionRevision: 2,
        clientRecordedAt: '2026-08-03T12:00:00.000Z',
      }),
    ).rejects.toMatchObject({ code: 'stale_revision' });
  });

  it('calls the dedicated same-day edit RPC with both current revisions', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        checkInId: 'check-in-1',
        sessionId: 'session-1',
        checkInRevision: 2,
        sessionRevision: 4,
        sessionStatus: 'minimum',
      },
      error: null,
    });
    const client = { rpc } as unknown as SupabaseProductRepositoryClient;
    const repository = new SupabaseProductRepository(client, owner.ownerId);

    await expect(
      repository.editCheckIn({
        commandId: 'edit-command-1',
        owner,
        currentCheckInId: 'check-in-1',
        sessionId: 'session-1',
        outcome: 'minimum',
        frictionCode: null,
        frictionNote: null,
        expectedSessionRevision: 3,
        expectedCheckInRevision: 1,
        clientRecordedAt: '2026-08-03T15:00:00.000Z',
      }),
    ).resolves.toMatchObject({
      checkInId: 'check-in-1',
      sessionId: 'session-1',
      outcome: 'minimum',
      sessionRevision: 4,
      synchronizationState: 'synced',
    });

    expect(rpc).toHaveBeenCalledWith(
      'edit_same_day_check_in',
      expect.objectContaining({
        p_command_id: 'edit-command-1',
        p_check_in_id: 'check-in-1',
        p_session_id: 'session-1',
        p_expected_session_revision: 3,
        p_expected_check_in_revision: 1,
        p_outcome: 'minimum',
        p_recorded_local_at: '2026-08-03T15:00:00.000Z',
      }),
    );
  });

  it('maps same-day cutoff and stale check-in revision errors', async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'P0001', message: 'same_day_edit_closed' },
      })
      .mockResolvedValueOnce({
        data: null,
        error: { code: '40001', message: 'revision_conflict' },
      });
    const client = { rpc } as unknown as SupabaseProductRepositoryClient;
    const repository = new SupabaseProductRepository(client, owner.ownerId);
    const command = {
      commandId: 'edit-command-closed',
      owner,
      currentCheckInId: 'check-in-1',
      sessionId: 'session-1',
      outcome: 'full' as const,
      frictionCode: null,
      frictionNote: null,
      expectedSessionRevision: 3,
      expectedCheckInRevision: 1,
      clientRecordedAt: '2026-08-04T01:00:00.000Z',
    };

    await expect(repository.editCheckIn(command)).rejects.toMatchObject({
      code: 'same_day_edit_closed',
    });
    await expect(
      repository.editCheckIn({
        ...command,
        commandId: 'edit-command-stale',
      }),
    ).rejects.toMatchObject({ code: 'stale_revision' });
  });

  it('reads Today sessions from the security-invoker view and joins their immutable version', async () => {
    const from = vi.fn((table: string) => {
      if (table === 'today_session_view') {
        return query({
          data: [
            {
              session_id: 'session-1',
              habit_id: 'habit-1',
              habit_title: 'Read',
              habit_version_id: 'version-1',
              lifecycle_state: 'active',
              revision: 2,
              scheduled_local_date: '2026-08-03',
              scheduled_local_time: null,
              status: 'unrecorded',
              timezone_snapshot: 'Asia/Jakarta',
              user_id: owner.ownerId,
            },
          ],
          error: null,
        });
      }
      if (table === 'habit_versions') {
        return query({
          data: [
            {
              id: 'version-1',
              habit_id: 'habit-1',
              user_id: owner.ownerId,
              version_number: 1,
              normal_target: { action: 'Read 20 minutes' },
              minimum_target: { action: 'Read one page' },
              schedule_rule: { kind: 'daily' },
              cue: { type: 'none', value: null },
              recovery_structure: {},
              source: 'creation',
              parent_version_id: null,
              effective_from_session_id: null,
              created_at: '2026-08-01T00:00:00.000Z',
            },
          ],
          error: null,
        });
      }
      if (table === 'check_ins') {
        return query({
          data: [
            {
              id: 'check-in-1',
              session_id: 'session-1',
              user_id: owner.ownerId,
              outcome: 'minimum',
              friction_code: null,
              friction_note: null,
              recorded_at: '2026-08-03T12:00:00.000Z',
              recorded_local_at: '2026-08-03T19:00:00.000Z',
              timezone_snapshot: 'Asia/Jakarta',
              revision: 1,
              created_at: '2026-08-03T12:00:00.000Z',
              updated_at: '2026-08-03T12:00:00.000Z',
            },
          ],
          error: null,
        });
      }
      return query({
        data: [{ habit_id: 'habit-1', lifecycle_state: 'active' }],
        error: null,
      });
    });
    const client = { from, rpc: vi.fn() } as unknown as SupabaseProductRepositoryClient;
    const repository = new SupabaseProductRepository(client, owner.ownerId);

    await expect(repository.getToday(owner, '2026-08-03')).resolves.toMatchObject({
      sessions: [
        {
          id: 'session-1',
          title: 'Read',
          normalTarget: { action: 'Read 20 minutes' },
          status: 'unrecorded',
          currentCheckInId: 'check-in-1',
          currentCheckInRevision: 1,
        },
      ],
      activeHabitCount: 1,
    });
    expect(from).toHaveBeenCalledWith('today_session_view');
  });

  it('rejects a guest owner at the signed-in boundary', async () => {
    const client = { rpc: vi.fn() } as unknown as SupabaseProductRepositoryClient;
    const repository = new SupabaseProductRepository(client, owner.ownerId);

    await expect(
      repository.recordCheckIn({
        commandId: 'command-3',
        owner: { ...owner, identityMode: 'guest' },
        sessionId: 'session-1',
        outcome: 'full',
        frictionCode: null,
        frictionNote: null,
        expectedSessionRevision: 1,
        clientRecordedAt: '2026-08-03T12:00:00.000Z',
      }),
    ).rejects.toMatchObject({ code: 'repository_unavailable' });
  });
});
