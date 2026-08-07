import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { recordCheckIn } from '@/features/check-ins/application/record-check-in';
import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import { DexieProductRepository } from '@/lib/repositories/guest/dexie-product-repository';
import type {
  ProductOwner,
  ProductRepository,
  RecordCheckInRepositoryCommand,
} from '@/lib/repositories/product-repository';

const owner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

function repositorySpy(): ProductRepository {
  return {
    recordCheckIn: vi.fn(async (command: RecordCheckInRepositoryCommand) => ({
      checkInId: 'check-in-1',
      sessionId: command.sessionId,
      outcome: command.outcome,
      sessionRevision: command.expectedSessionRevision + 1,
      synchronizationState: 'local_only' as const,
    })),
  } as unknown as ProductRepository;
}

describe('recordCheckIn application service', () => {
  it('uses one repository call and returns a positive Minimum confirmation', async () => {
    const repository = repositorySpy();
    const result = await recordCheckIn({
      repository,
      owner,
      commandId: 'command-minimum-1',
      sessionId: 'session-1',
      outcome: 'minimum',
      friction: { frictionCode: null, frictionNote: null },
      expectedSessionRevision: 1,
      now: '2026-08-03T12:00:00.000Z',
    });

    expect(repository.recordCheckIn).toHaveBeenCalledTimes(1);
    expect(result.confirmation).toContain('kept the habit alive');
    expect(result).not.toHaveProperty('frictionNote');
  });

  it('accepts Skipped with no reason and controlled friction without exposing the note', async () => {
    const repository = repositorySpy();
    const result = await recordCheckIn({
      repository,
      owner,
      commandId: 'command-skip-1',
      sessionId: 'session-1',
      outcome: 'manual_skipped',
      friction: { frictionCode: 'no_time', frictionNote: 'Private context' },
      expectedSessionRevision: 1,
      now: '2026-08-03T12:00:00.000Z',
    });

    expect(result.confirmation).toContain('Skipped recorded');
    expect(result).not.toHaveProperty('frictionNote');
  });
});

describe('DexieProductRepository.recordCheckIn', () => {
  let database: RecoveryFirstDatabase;
  let repository: DexieProductRepository;

  beforeEach(async () => {
    database = new RecoveryFirstDatabase(`check-in-${crypto.randomUUID()}`);
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
      status: 'unrecorded',
      revision: 1,
      synchronizationState: 'local_only',
    });
  });

  afterEach(async () => {
    await database.delete();
  });

  it('replays duplicate commands, prevents a second current check-in, and rejects stale revisions', async () => {
    const command = {
      commandId: 'command-full-1',
      owner,
      sessionId: 'session-1',
      outcome: 'full' as const,
      frictionCode: null,
      frictionNote: null,
      expectedSessionRevision: 1,
      clientRecordedAt: '2026-08-03T12:00:00.000Z',
    };
    const first = await repository.recordCheckIn(command);
    await expect(repository.recordCheckIn(command)).resolves.toEqual(first);
    expect(await database.checkIns.count()).toBe(1);
    await expect(
      repository.recordCheckIn({ ...command, commandId: 'command-stale-1' }),
    ).rejects.toMatchObject({ code: 'stale_revision' });
    await expect(
      repository.recordCheckIn({
        ...command,
        commandId: 'command-second-1',
        expectedSessionRevision: 2,
      }),
    ).rejects.toMatchObject({ code: 'check_in_already_recorded' });
    await expect(database.sessions.get('session-1')).resolves.toMatchObject({
      status: 'full',
      revision: 2,
    });
  });
});
