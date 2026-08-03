import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HabitWizard } from '@/features/habits/components/habit-wizard';
import { createHabitFormDefaults } from '@/features/habits/forms/habit-form-defaults';
import type { HabitFormValues } from '@/features/habits/forms/habit-form-types';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

const owner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

const values: HabitFormValues = {
  ...createHabitFormDefaults({ timezone: 'Asia/Jakarta', startLocalDate: '2026-08-03' }),
  category: 'movement',
  title: 'Walk after lunch',
  normalAction: 'Walk for 20 minutes',
  normalQuantity: 20,
  normalUnit: 'minutes',
  minimumAction: 'Walk for 5 minutes',
  minimumQuantity: 5,
  minimumUnit: 'minutes',
  cueType: 'after_activity',
  cueValue: 'After lunch',
};

function repository(): ProductRepository {
  return {
    createHabit: vi.fn(async () => ({
      habitId: 'habit-1',
      habitVersionId: 'version-1',
      lifecycleState: 'starting' as const,
      activeCount: 1,
      firstEligibleSessionId: 'session-1',
    })),
    saveHabitDraft: vi.fn(async () => undefined),
    getHabitDraft: vi.fn(async () => null),
    deleteHabitDraft: vi.fn(async () => undefined),
    listHabits: vi.fn(async () => []),
    getHabitDetail: vi.fn(async () => null),
    ensureSessionHorizon: vi.fn(async () => 0),
    resolveExpiredUnrecorded: vi.fn(async () => 0),
    getToday: vi.fn(async () => ({
      localDate: '2026-08-03',
      sessions: [],
      activeHabitCount: 0,
      activeHabitLimit: 3,
    })),
    recordCheckIn: vi.fn(),
    editCheckIn: vi.fn(),
  };
}

async function moveToStep(user: ReturnType<typeof userEvent.setup>, stepCount: number) {
  for (let step = 1; step < stepCount; step += 1) {
    await user.click(screen.getByRole('button', { name: 'Next step' }));
  }
}

describe('HabitWizard', () => {
  it('exposes five named steps and keeps the mobile footer keyboard reachable', () => {
    render(<HabitWizard repository={repository()} owner={owner} initialValues={values} />);

    const progress = screen.getByRole('list', { name: 'Habit creation progress' });
    expect(progress).toHaveTextContent('Goal and name');
    expect(progress).toHaveTextContent('Normal and Minimum');
    expect(progress).toHaveTextContent('Schedule and cue');
    expect(progress).toHaveTextContent('Optional reminder');
    expect(progress).toHaveTextContent('Review and create');
    const footer = screen.getByRole('navigation', { name: 'Wizard actions' });
    expect(footer).toBeInTheDocument();
    screen.getByRole('button', { name: 'Next step' }).focus();
    expect(document.activeElement).toHaveAccessibleName('Next step');
  });

  it('requires distinct Normal and Minimum fields in step two', async () => {
    const user = userEvent.setup();
    render(<HabitWizard repository={repository()} owner={owner} initialValues={values} />);

    await user.click(screen.getByRole('button', { name: 'Next step' }));

    expect(screen.getByRole('group', { name: 'Normal and Minimum' })).toBeInTheDocument();
    expect(screen.getByLabelText('Normal action')).toHaveValue('Walk for 20 minutes');
    expect(screen.getByLabelText('Minimum action')).toHaveValue('Walk for 5 minutes');
  });

  it('preserves entered values when moving between steps', async () => {
    const user = userEvent.setup();
    render(<HabitWizard repository={repository()} owner={owner} initialValues={values} />);

    const title = screen.getByLabelText('Habit name');
    await user.clear(title);
    await user.type(title, 'Read before bed');
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    await user.click(screen.getByRole('button', { name: 'Previous step' }));

    expect(screen.getByLabelText('Habit name')).toHaveValue('Read before bed');
  });

  it('offers save, discard, and continue actions for a dirty form', async () => {
    const user = userEvent.setup();
    render(<HabitWizard repository={repository()} owner={owner} initialValues={values} />);

    await user.clear(screen.getByLabelText('Habit name'));
    await user.type(screen.getByLabelText('Habit name'), 'Walk updated');
    await user.click(screen.getByRole('button', { name: 'Leave wizard' }));

    expect(screen.getByRole('button', { name: 'Save draft and leave' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue editing' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue editing' }));
    expect(screen.queryByRole('button', { name: 'Save draft and leave' })).not.toBeInTheDocument();
  });

  it('shows exact form values, slot impact, and first-session guidance in review', async () => {
    const user = userEvent.setup();
    render(<HabitWizard repository={repository()} owner={owner} initialValues={values} />);

    await moveToStep(user, 5);

    expect(screen.getByRole('group', { name: 'Review and create' })).toHaveTextContent(
      'Walk after lunch',
    );
    expect(screen.getByText('Uses 1 of 3 active habit slots')).toBeInTheDocument();
    expect(screen.getByText(/first eligible session/i)).toBeInTheDocument();
  });
});
