import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { HabitDetail } from '@/features/habits/components/habit-detail';
import type { HabitDetailRead } from '@/lib/repositories/product-repository';

const detail: HabitDetailRead = {
  habit: {
    id: 'habit-1',
    title: 'Read before bed',
    lifecycleState: 'active',
    currentVersionId: 'version-2',
    updatedAt: '2026-08-03T00:00:00.000Z',
  },
  currentVersion: {
    id: 'version-2',
    versionNumber: 2,
    normalTarget: {
      action: 'Read 20 minutes',
      quantity: 20,
      unit: 'minutes',
      estimatedMinutes: 20,
    },
    minimumTarget: { action: 'Read one page', quantity: 1, unit: 'page', estimatedMinutes: 3 },
    recurrence: { kind: 'daily' },
    cue: { type: 'after_activity', value: 'After dinner' },
    createdAt: '2026-08-03T00:00:00.000Z',
  },
  versions: [
    {
      id: 'version-2',
      versionNumber: 2,
      createdAt: '2026-08-03T00:00:00.000Z',
      source: 'redesign',
    },
    {
      id: 'version-1',
      versionNumber: 1,
      createdAt: '2026-08-01T00:00:00.000Z',
      source: 'creation',
    },
  ],
  sessions: [
    {
      id: 'session-full',
      habitId: 'habit-1',
      habitVersionId: 'version-2',
      title: 'Read before bed',
      normalTarget: {
        action: 'Read 20 minutes',
        quantity: 20,
        unit: 'minutes',
        estimatedMinutes: 20,
      },
      minimumTarget: { action: 'Read one page', quantity: 1, unit: 'page', estimatedMinutes: 3 },
      cue: { type: 'after_activity', value: 'After dinner' },
      scheduledLocalDate: '2026-08-03',
      scheduledLocalTime: null,
      timezoneSnapshot: 'Asia/Jakarta',
      status: 'full',
      revision: 1,
      synchronizationState: 'local_only',
    },
    {
      id: 'session-minimum',
      habitId: 'habit-1',
      habitVersionId: 'version-2',
      title: 'Read before bed',
      normalTarget: {
        action: 'Read 20 minutes',
        quantity: 20,
        unit: 'minutes',
        estimatedMinutes: 20,
      },
      minimumTarget: { action: 'Read one page', quantity: 1, unit: 'page', estimatedMinutes: 3 },
      cue: { type: 'after_activity', value: 'After dinner' },
      scheduledLocalDate: '2026-08-02',
      scheduledLocalTime: null,
      timezoneSnapshot: 'Asia/Jakarta',
      status: 'minimum',
      revision: 1,
      synchronizationState: 'local_only',
    },
    {
      id: 'session-manual',
      habitId: 'habit-1',
      habitVersionId: 'version-1',
      title: 'Read before bed',
      normalTarget: {
        action: 'Read 20 minutes',
        quantity: 20,
        unit: 'minutes',
        estimatedMinutes: 20,
      },
      minimumTarget: { action: 'Read one page', quantity: 1, unit: 'page', estimatedMinutes: 3 },
      cue: { type: 'after_activity', value: 'After dinner' },
      scheduledLocalDate: '2026-08-01',
      scheduledLocalTime: null,
      timezoneSnapshot: 'Asia/Jakarta',
      status: 'manual_skipped',
      revision: 1,
      synchronizationState: 'local_only',
    },
    {
      id: 'session-automatic',
      habitId: 'habit-1',
      habitVersionId: 'version-1',
      title: 'Read before bed',
      normalTarget: {
        action: 'Read 20 minutes',
        quantity: 20,
        unit: 'minutes',
        estimatedMinutes: 20,
      },
      minimumTarget: { action: 'Read one page', quantity: 1, unit: 'page', estimatedMinutes: 3 },
      cue: { type: 'after_activity', value: 'After dinner' },
      scheduledLocalDate: '2026-07-31',
      scheduledLocalTime: null,
      timezoneSnapshot: 'Asia/Jakarta',
      status: 'automatic_skipped',
      revision: 1,
      synchronizationState: 'local_only',
    },
    {
      id: 'session-unrecorded',
      habitId: 'habit-1',
      habitVersionId: 'version-1',
      title: 'Read before bed',
      normalTarget: {
        action: 'Read 20 minutes',
        quantity: 20,
        unit: 'minutes',
        estimatedMinutes: 20,
      },
      minimumTarget: { action: 'Read one page', quantity: 1, unit: 'page', estimatedMinutes: 3 },
      cue: { type: 'after_activity', value: 'After dinner' },
      scheduledLocalDate: '2026-07-30',
      scheduledLocalTime: null,
      timezoneSnapshot: 'Asia/Jakarta',
      status: 'unrecorded',
      revision: 1,
      synchronizationState: 'local_only',
    },
  ],
};

describe('HabitDetail', () => {
  it('exposes read-only tabs, descending versions, and visible history labels', async () => {
    const user = userEvent.setup();
    render(<HabitDetail detail={detail} />);

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Insights' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Versions' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'History' }));
    for (const label of ['Full', 'Minimum', 'Manual Skipped', 'Automatic Skipped', 'Unrecorded']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Versions' }));
    const versionRows = screen.getAllByRole('listitem');
    expect(versionRows[0]).toHaveTextContent('Version 2');
    expect(versionRows[1]).toHaveTextContent('Version 1');

    await user.click(screen.getByRole('tab', { name: 'Insights' }));
    expect(screen.getByText(/unavailable for now/i)).toBeInTheDocument();
  });
});
