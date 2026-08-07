import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveExpiredUnrecorded } from '@/features/sessions/application/resolve-expired-unrecorded';
import { nextManualSkipCounter } from '@/domain/check-ins/metrics';
import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import { DexieProductRepository } from '@/lib/repositories/guest/dexie-product-repository';
import type { ProductOwner } from '@/lib/repositories/product-repository';

const owner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

describe('resolveExpiredUnrecorded', () => {
  let database: RecoveryFirstDatabase;
  let repository: DexieProductRepository;

  beforeEach(async () => {
    database = new RecoveryFirstDatabase(`resolve-expired-${crypto.randomUUID()}`);
    repository = new DexieProductRepository(database);
    await database.sessions.bulkAdd([
      {
        id: 'session-open',
        ownerType: 'guest',
        ownerId: owner.ownerId,
        habitId: 'habit-1',
        habitVersionId: 'version-1',
        scheduledLocalDate: '2026-08-03',
        scheduledLocalTime: null,
        timezoneSnapshot: owner.timezone,
        eligibleAt: '2026-08-03T00:00:00.000Z',
        resolutionDueAt: '2026-08-04T00:00:00.000Z',
        status: 'unrecorded',
        revision: 1,
        synchronizationState: 'local_only',
      },
      {
        id: 'session-expired',
        ownerType: 'guest',
        ownerId: owner.ownerId,
        habitId: 'habit-1',
        habitVersionId: 'version-1',
        scheduledLocalDate: '2026-08-02',
        scheduledLocalTime: null,
        timezoneSnapshot: owner.timezone,
        eligibleAt: '2026-08-02T00:00:00.000Z',
        resolutionDueAt: '2026-08-03T00:00:00.000Z',
        status: 'unrecorded',
        revision: 4,
        synchronizationState: 'pending',
      },
      {
        id: 'session-full',
        ownerType: 'guest',
        ownerId: owner.ownerId,
        habitId: 'habit-1',
        habitVersionId: 'version-1',
        scheduledLocalDate: '2026-08-01',
        scheduledLocalTime: null,
        timezoneSnapshot: owner.timezone,
        eligibleAt: '2026-08-01T00:00:00.000Z',
        resolutionDueAt: '2026-08-02T00:00:00.000Z',
        status: 'full',
        revision: 2,
        synchronizationState: 'synchronized',
      },
      {
        id: 'session-manual',
        ownerType: 'guest',
        ownerId: owner.ownerId,
        habitId: 'habit-1',
        habitVersionId: 'version-1',
        scheduledLocalDate: '2026-07-31',
        scheduledLocalTime: null,
        timezoneSnapshot: owner.timezone,
        eligibleAt: '2026-07-31T00:00:00.000Z',
        resolutionDueAt: '2026-08-01T00:00:00.000Z',
        status: 'manual_skipped',
        revision: 3,
        synchronizationState: 'local_only',
      },
    ]);
  });

  afterEach(async () => {
    await database.delete();
  });

  it('keeps open sessions unrecorded and converts only expired sessions without a check-in row', async () => {
    expect(
      await resolveExpiredUnrecorded({ repository, owner, now: '2026-08-02T23:59:59.000Z' }),
    ).toBe(0);
    expect(await database.sessions.get('session-open')).toMatchObject({
      status: 'unrecorded',
      revision: 1,
    });

    expect(
      await resolveExpiredUnrecorded({ repository, owner, now: '2026-08-04T00:00:00.000Z' }),
    ).toBe(1);
    expect(await database.sessions.get('session-expired')).toMatchObject({
      status: 'automatic_skipped',
      revision: 5,
    });
    expect(await database.checkIns.count()).toBe(0);
    expect(nextManualSkipCounter(2, 'automatic_skipped')).toBe(2);
  });

  it('does not reclassify resolved sessions and is idempotent on rerun', async () => {
    expect(await repository.resolveExpiredUnrecorded(owner, '2026-08-04T00:00:00.000Z')).toBe(1);
    expect(await repository.resolveExpiredUnrecorded(owner, '2026-08-04T00:00:00.000Z')).toBe(0);
    expect(await database.sessions.get('session-full')).toMatchObject({
      status: 'full',
      revision: 2,
    });
    expect(await database.sessions.get('session-manual')).toMatchObject({
      status: 'manual_skipped',
      revision: 3,
    });
  });
});
