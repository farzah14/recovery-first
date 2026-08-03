import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TodaySessionCard } from '@/features/today/components/today-session-card';
import type { SessionSummary } from '@/lib/repositories/product-repository';

const baseSession: SessionSummary = {
  id: 'session-1',
  habitId: 'habit-1',
  habitVersionId: 'version-1',
  title: 'Read before bed',
  normalTarget: { action: 'Read 20 minutes', quantity: 20, unit: 'minutes', estimatedMinutes: 20 },
  minimumTarget: { action: 'Read one page', quantity: 1, unit: 'page', estimatedMinutes: 3 },
  cue: { type: 'after_activity', value: 'After dinner' },
  scheduledLocalDate: '2026-08-03',
  scheduledLocalTime: '21:00',
  timezoneSnapshot: 'Asia/Jakarta',
  status: 'unrecorded',
  revision: 1,
  synchronizationState: 'local_only',
};

describe('TodaySessionCard', () => {
  it('exposes Full, Minimum, and Skipped actions without hover-only behavior', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<TodaySessionCard session={baseSession} onAction={onAction} />);

    expect(screen.getByRole('heading', { name: 'Read before bed' })).toBeInTheDocument();
    expect(screen.getByText('Read 20 minutes')).toBeInTheDocument();
    expect(screen.getByText('Read one page')).toBeInTheDocument();
    expect(screen.getByText('After dinner')).toBeInTheDocument();
    for (const label of ['Full', 'Minimum', 'Skipped']) expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Minimum' }));
    expect(onAction).toHaveBeenCalledWith('minimum', baseSession);
  });

  it('uses positive Minimum wording, offers Edit for a same-day recorded card, and labels sync state', () => {
    render(
      <TodaySessionCard
        session={{ ...baseSession, status: 'minimum', synchronizationState: 'pending' }}
        onAction={vi.fn()}
        isSameDay
      />,
    );

    expect(screen.getByText('Minimum')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Full' })).not.toBeInTheDocument();
  });

  it('shows paused and Recovery labels with text', () => {
    render(
      <TodaySessionCard
        session={baseSession}
        onAction={vi.fn()}
        habitState="paused"
        isRecovery
      />,
    );

    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByText('Recovery')).toBeInTheDocument();
  });
});
