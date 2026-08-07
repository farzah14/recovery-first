import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CheckInActionGroup } from '@/features/check-ins/components/check-in-action-group';
import { CheckInConfirmation } from '@/features/check-ins/components/check-in-confirmation';
import { FrictionDialog } from '@/features/check-ins/components/friction-dialog';

describe('check-in components', () => {
  it('renders keyboard-reachable Full, Minimum, and Skipped actions', async () => {
    const user = userEvent.setup();
    const onMinimum = vi.fn();
    render(<CheckInActionGroup onFull={vi.fn()} onMinimum={onMinimum} onSkipped={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Minimum' }));
    expect(onMinimum).toHaveBeenCalledTimes(1);
  });

  it('opens friction choices for Skipped and supports a private note', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FrictionDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} onCancel={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Skip explanation' }));
    expect(onSubmit).toHaveBeenCalledWith({ frictionCode: null, frictionNote: null });
  });

  it('announces a normal confirmation politely', () => {
    render(<CheckInConfirmation message="Minimum completed — you kept the habit alive today." />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText(/kept the habit alive/i)).toBeInTheDocument();
  });
});
