import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ActiveLimitDialog } from '@/features/habits/components/active-limit-dialog';

describe('ActiveLimitDialog', () => {
  it('offers every non-destructive Guest resolution and focuses Cancel first', async () => {
    const user = userEvent.setup();
    render(
      <ActiveLimitDialog
        open
        planTier="guest"
        activeHabits={[{ id: 'habit-1', title: 'Walk' }]}
        onResolve={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Guest allows 3 active habits')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause an Active Habit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep as Draft' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByText('Walk')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await user.click(screen.getByRole('button', { name: 'Keep as Draft' }));
  });
});
