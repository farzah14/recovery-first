import 'fake-indexeddb/auto';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { editCheckIn } from '@/features/check-ins/application/edit-check-in';
import { HabitHistory } from '@/features/habits/components/habit-history';
import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import { DexieProductRepository } from '@/lib/repositories/guest/dexie-product-repository';
import type {
  ProductOwner,
  ProductRepository,
  RecordCheckInResult,
} from '@/lib/repositories/product-repository';

const owner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

describe('editCheckIn application service', () => {
  it('validates optional friction and delegates the immutable edit command', async () => {
    const recordCheckIn = vi.fn(
      async () =>
        ({
          checkInId: 'new-check-in',
          sessionId: 'session-1',
          outcome: 'manual_skipped' as const,
          sessionRevision: 3,
          synchronizationState: 'local_only' as const,
        }) satisfies RecordCheckInResult,
    );
    const repository = { editCheckIn: recordCheckIn } as unknown as ProductRepository;
    await expect(
      editCheckIn({
        repository,
        owner,
        commandId: 'edit-command-1',
        currentCheckInId: 'check-in-1',
        sessionId: 'session-1',
        outcome: 'manual_skipped',
        friction: { frictionCode: null, frictionNote: null },
        expectedSessionRevision: 2,
        expectedCheckInRevision: 1,
        now: '2026-08-03T15:00:00.000Z',
      }),
    ).resolves.toMatchObject({ outcome: 'manual_skipped' });
    expect(recordCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({ frictionCode: null, frictionNote: null }),
    );
  });
});

describe('same-day edit entry points', () => {
  it('explains preserved history and exposes the optional skipped friction form', async () => {
    const user = userEvent.setup();
    render(
      createElement(HabitHistory, {
        currentLocalDate: '2026-08-03',
        onEdit: vi.fn(),
        sessions: [
          {
            id: 'session-1',
            habitId: 'habit-1',
            habitVersionId: 'version-1',
            title: 'Read before bed',
            normalTarget: {
              action: 'Read 20 minutes',
              quantity: 20,
              unit: 'minutes',
              estimatedMinutes: 20,
            },
            minimumTarget: {
              action: 'Read one page',
              quantity: 1,
              unit: 'page',
              estimatedMinutes: 3,
            },
            cue: { type: 'none', value: null },
            scheduledLocalDate: '2026-08-03',
            scheduledLocalTime: null,
            timezoneSnapshot: 'Asia/Jakarta',
            status: 'full',
            revision: 2,
            synchronizationState: 'local_only',
          },
        ],
      }),
    );

    expect(screen.getByText(/prior history remains preserved/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/Edit today's check-in/i);
    await user.click(screen.getByRole('button', { name: 'Skipped' }));
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });
});

describe('DexieProductRepository.editCheckIn', () => {
  let database: RecoveryFirstDatabase;
  let repository: DexieProductRepository;

  beforeEach(async () => {
    database = new RecoveryFirstDatabase(`edit-check-in-${crypto.randomUUID()}`);
    repository = new DexieProductRepository(database);
    await database.sessions.put({
      id: 'session-1',
      ownerType: 'guest',
      ownerId: owner.ownerId,
      habitId: 'habit-1',
      habitVersionId: 'version-1',
      scheduledLocalDate: '2026-08-03',
      scheduledLocalTime: null,
      timezoneSnapshot: owner.timezone,
      eligibleAt: '2026-08-03T00:00:00.000Z',
      resolutionDueAt: '2026-08-06T00:00:00.000Z',
      status: 'full',
      revision: 2,
      synchronizationState: 'local_only',
    });
    await database.checkIns.put({
      id: 'check-in-1',
      ownerType: 'guest',
      ownerId: owner.ownerId,
      sessionId: 'session-1',
      outcome: 'full',
      frictionCode: null,
      frictionNote: null,
      recordedLocalAt: '2026-08-03T12:00:00.000Z',
      timezoneSnapshot: owner.timezone,
      revision: 1,
      synchronizationState: 'local_only',
      replacedAt: null,
      replacedById: null,
    });
  });

  afterEach(async () => {
    await database.delete();
  });

  it('preserves Full history while projecting the latest Minimum outcome', async () => {
    const result = await repository.editCheckIn({
      commandId: 'edit-command-1',
      owner,
      currentCheckInId: 'check-in-1',
      sessionId: 'session-1',
      outcome: 'minimum',
      frictionCode: null,
      frictionNote: null,
      expectedSessionRevision: 2,
      expectedCheckInRevision: 1,
      clientRecordedAt: '2026-08-03T15:00:00.000Z',
    });

    expect(result.outcome).toBe('minimum');
    expect(await database.checkIns.count()).toBe(2);
    expect(await database.checkIns.get('check-in-1')).toMatchObject({
      replacedById: result.checkInId,
    });
    expect(await database.sessions.get('session-1')).toMatchObject({
      status: 'minimum',
      revision: 3,
    });
  });

  it('rejects stale revisions and edits after the owner-local same-day cutoff', async () => {
    await expect(
      repository.editCheckIn({
        commandId: 'edit-stale',
        owner,
        currentCheckInId: 'check-in-1',
        sessionId: 'session-1',
        outcome: 'minimum',
        frictionCode: null,
        frictionNote: null,
        expectedSessionRevision: 1,
        expectedCheckInRevision: 1,
        clientRecordedAt: '2026-08-03T15:00:00.000Z',
      }),
    ).rejects.toMatchObject({ code: 'stale_revision' });

    await expect(
      repository.editCheckIn({
        commandId: 'edit-closed',
        owner,
        currentCheckInId: 'check-in-1',
        sessionId: 'session-1',
        outcome: 'manual_skipped',
        frictionCode: null,
        frictionNote: null,
        expectedSessionRevision: 2,
        expectedCheckInRevision: 1,
        clientRecordedAt: '2026-08-04T01:00:00.000Z',
      }),
    ).rejects.toMatchObject({ code: 'same_day_edit_closed' });
  });
});
