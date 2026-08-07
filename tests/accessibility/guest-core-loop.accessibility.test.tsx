import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ActiveLimitDialog } from '@/features/habits/components/active-limit-dialog';
import { HabitWizard } from '@/features/habits/components/habit-wizard';
import { CheckInActionGroup } from '@/features/check-ins/components/check-in-action-group';
import { FrictionDialog } from '@/features/check-ins/components/friction-dialog';
import { TodaySessionCard } from '@/features/today/components/today-session-card';
import type {
  ProductOwner,
  ProductRepository,
  SessionSummary,
} from '@/lib/repositories/product-repository';

const owner: ProductOwner = {
  ownerId: '00000000-0000-4000-8000-000000000001',
  identityMode: 'account',
  planTier: 'lite',
  timezone: 'Asia/Jakarta',
};

const session: SessionSummary = {
  id: 'session-1',
  habitId: 'habit-1',
  habitVersionId: 'version-1',
  title: 'Read before bed',
  normalTarget: { action: 'Read 20 minutes', quantity: 20, unit: 'minutes', estimatedMinutes: 20 },
  minimumTarget: { action: 'Read one page', quantity: 1, unit: 'page', estimatedMinutes: 3 },
  cue: { type: 'none', value: null },
  scheduledLocalDate: '2026-08-03',
  scheduledLocalTime: null,
  timezoneSnapshot: owner.timezone,
  status: 'unrecorded',
  revision: 1,
  synchronizationState: 'local_only',
};

describe('Authenticated core-loop accessibility', () => {
  it('labels wizard fields, progress, and validation errors', async () => {
    const user = userEvent.setup();
    render(<HabitWizard repository={{} as ProductRepository} owner={owner} />);

    expect(screen.getByRole('list', { name: 'Habit creation progress' })).toBeInTheDocument();
    expect(screen.getByLabelText('Habit name')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next step' }));

    expect(screen.getByLabelText('Habit name')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/expected string to have/i)).toBeInTheDocument();
  });

  it('keeps check-in actions named and describes Minimum as successful continuity', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<TodaySessionCard session={session} onAction={onAction} />);

    expect(screen.getByRole('button', { name: 'Full' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Minimum' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skipped' })).toBeInTheDocument();
    expect(screen.getByText(/Minimum:/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Minimum' }));
    expect(onAction).toHaveBeenCalledWith('minimum', session);
  });

  it('provides optional friction semantics and a keyboard-safe dialog', async () => {
    const user = userEvent.setup();
    render(<FrictionDialog open onOpenChange={vi.fn()} onCancel={vi.fn()} onSubmit={vi.fn()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Private note/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Skip explanation' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('keeps the active-limit decision explicit and non-destructive', async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    render(
      <ActiveLimitDialog
        open
        onOpenChange={vi.fn()}
        planTier="lite"
        activeHabits={[{ id: 'habit-1', title: 'Read' }]}
        onResolve={onResolve}
      />,
    );

    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    expect(screen.queryByRole('button', { name: 'Create Account' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keep as Draft' }));
    expect(onResolve).toHaveBeenCalledWith({ action: 'keep_draft' });
  });

  it('exposes action-group names independent of color', () => {
    render(<CheckInActionGroup onFull={vi.fn()} onMinimum={vi.fn()} onSkipped={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Check-in actions' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });
});
