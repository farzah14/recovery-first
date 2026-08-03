import 'fake-indexeddb/auto';

import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { HabitList } from '@/features/habits/components/habit-list';
import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import { DexieProductRepository } from '@/lib/repositories/guest/dexie-product-repository';
import type { HabitListItem, ProductOwner } from '@/lib/repositories/product-repository';

const owner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

const habits: HabitListItem[] = [
  {
    id: 'habit-new',
    title: 'Read',
    lifecycleState: 'active',
    currentVersionId: 'version-new',
    updatedAt: '2026-08-03T00:00:00.000Z',
  },
  {
    id: 'habit-old',
    title: 'Walk',
    lifecycleState: 'paused',
    currentVersionId: 'version-old',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
];

let database: RecoveryFirstDatabase | null = null;

afterEach(async () => {
  if (database) {
    await database.delete();
    database = null;
  }
});

describe('habit list', () => {
  it('returns owner-scoped non-deleted habits ordered by most recently updated', async () => {
    database = new RecoveryFirstDatabase(`habit-list-${crypto.randomUUID()}`);
    const repository = new DexieProductRepository(database);
    await database.habits.bulkPut([
      {
        id: 'habit-old',
        ownerType: 'guest',
        ownerId: owner.ownerId,
        title: 'Walk',
        lifecycleState: 'paused',
        currentVersionId: null,
        revision: 1,
        synchronizationState: 'local_only',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-02T00:00:00.000Z',
        deletedAt: null,
      },
      {
        id: 'habit-new',
        ownerType: 'guest',
        ownerId: owner.ownerId,
        title: 'Read',
        lifecycleState: 'active',
        currentVersionId: null,
        revision: 1,
        synchronizationState: 'local_only',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-03T00:00:00.000Z',
        deletedAt: null,
      },
      {
        id: 'habit-deleted',
        ownerType: 'guest',
        ownerId: owner.ownerId,
        title: 'Deleted',
        lifecycleState: 'trash',
        currentVersionId: null,
        revision: 1,
        synchronizationState: 'local_only',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-04T00:00:00.000Z',
        deletedAt: '2026-08-04T00:00:00.000Z',
      },
      {
        id: 'other-owner',
        ownerType: 'guest',
        ownerId: 'guest-other',
        title: 'Other',
        lifecycleState: 'active',
        currentVersionId: null,
        revision: 1,
        synchronizationState: 'local_only',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-05T00:00:00.000Z',
        deletedAt: null,
      },
    ]);

    await expect(repository.listHabits(owner)).resolves.toEqual([
      expect.objectContaining({ id: 'habit-new', title: 'Read' }),
      expect.objectContaining({ id: 'habit-old', title: 'Walk' }),
    ]);
  });

  it('shows the Guest active limit and habit cards', () => {
    render(<HabitList habits={habits} activeHabitCount={1} activeHabitLimit={3} />);

    expect(screen.getByText('3 active habits maximum')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Read' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Walk' })).toBeInTheDocument();
  });

  it('reads one owner-scoped detail with version, session, and current check-in state', async () => {
    database = new RecoveryFirstDatabase(`habit-detail-read-${crypto.randomUUID()}`);
    const repository = new DexieProductRepository(database);
    await database.habits.put({
      id: 'habit-1',
      ownerType: 'guest',
      ownerId: owner.ownerId,
      title: 'Read',
      lifecycleState: 'active',
      currentVersionId: 'version-1',
      revision: 1,
      synchronizationState: 'local_only',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-03T00:00:00.000Z',
      deletedAt: null,
    });
    await database.habitVersions.put({
      id: 'version-1',
      habitId: 'habit-1',
      ownerType: 'guest',
      ownerId: owner.ownerId,
      versionNumber: 1,
      normalTarget: { action: 'Read 20 minutes', quantity: 20, unit: 'minutes' },
      minimumTarget: { action: 'Read one page', quantity: 1, unit: 'page' },
      scheduleRule: { kind: 'daily' },
      cue: { type: 'after_activity', value: 'After dinner' },
      recoveryStructure: {},
      source: 'creation',
      parentVersionId: null,
      createdAt: '2026-08-01T00:00:00.000Z',
    });
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
    await database.checkIns.put({
      id: 'check-in-1',
      ownerType: 'guest',
      ownerId: owner.ownerId,
      sessionId: 'session-1',
      outcome: 'minimum',
      frictionCode: null,
      frictionNote: null,
      recordedLocalAt: '2026-08-03T12:00:00.000Z',
      timezoneSnapshot: owner.timezone,
      revision: 1,
      synchronizationState: 'local_only',
      replacedAt: null,
      replacedById: null,
    });

    const detail = await repository.getHabitDetail(owner, 'habit-1');
    expect(detail?.currentVersion.normalTarget.action).toBe('Read 20 minutes');
    expect(detail?.sessions[0]?.status).toBe('minimum');
    await expect(repository.getHabitDetail({ ...owner, ownerId: 'guest-other' }, 'habit-1')).resolves.toBeNull();
  });
});
