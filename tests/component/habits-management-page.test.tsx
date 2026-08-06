import { StrictMode } from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { HabitsManagement } from '@/features/habits/habits-management';

describe('HabitsManagement', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders Habits Library header, search bar, status and date and time dropdowns, active habits cards, and paused habits section', () => {
    render(<HabitsManagement />);

    // Header title
    expect(screen.getByRole('heading', { level: 1, name: 'Habits Library' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: /Add Habit/i }).length).toBeGreaterThan(0);

    // Status, time and date filter dropdowns
    expect(screen.getByRole('combobox', { name: 'Filter by status' })).toHaveTextContent(
      'All Status',
    );
    expect(screen.getByRole('combobox', { name: 'Filter by time of day' })).toHaveTextContent(
      'Any Time',
    );
    expect(screen.getByRole('combobox', { name: 'Filter by date' })).toHaveTextContent('All Dates');
    expect(screen.queryByRole('combobox', { name: 'Filter by category' })).not.toBeInTheDocument();

    // Active habit cards
    expect(screen.getByText('Daily Meditation')).toBeVisible();
    expect(screen.getByText('Hydration & Water')).toBeVisible();

    // Paused habits section
    expect(screen.getByText(/Paused Habits \(1\)/i)).toBeVisible();
    expect(screen.getByText('Read Tech Documentation')).toBeVisible();
  }, 15000);

  it('filters habits list by status dropdown', async () => {
    render(<HabitsManagement />);

    // Filter by Paused status
    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by status' }));
    fireEvent.click(screen.getByRole('option', { name: 'Paused' }));
    expect(screen.getByText('Read Tech Documentation')).toBeVisible();
    expect(screen.queryByText('Daily Meditation')).not.toBeInTheDocument();

    // Reset to All Status
    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by status' }));
    fireEvent.click(screen.getByRole('option', { name: 'All Status' }));
    expect(screen.getByText('Daily Meditation')).toBeVisible();
  }, 30000);

  it('filters habits lists by time-of-day bucket', async () => {
    render(<HabitsManagement />);

    // Morning bucket keeps morning habits and hides the evening paused habit
    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by time of day' }));
    fireEvent.click(screen.getByRole('option', { name: 'Morning' }));
    expect(screen.getByText('Daily Meditation')).toBeVisible();
    expect(screen.getByText('Hydration & Water')).toBeVisible();
    expect(screen.queryByText('Read Tech Documentation')).not.toBeInTheDocument();
    expect(screen.queryByText(/Paused Habits/i)).not.toBeInTheDocument();

    // Evening bucket shows only the evening paused habit
    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by time of day' }));
    fireEvent.click(screen.getByRole('option', { name: 'Evening' }));
    expect(screen.getByText('Read Tech Documentation')).toBeVisible();
    expect(screen.queryByText('Daily Meditation')).not.toBeInTheDocument();
    expect(screen.queryByText('Hydration & Water')).not.toBeInTheDocument();

    // Reset to Any Time restores the full lists
    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by time of day' }));
    fireEvent.click(screen.getByRole('option', { name: 'Any Time' }));
    expect(screen.getByText('Daily Meditation')).toBeVisible();
    expect(screen.getByText('Read Tech Documentation')).toBeVisible();
  }, 30000);

  it('filters habits lists by date preset', async () => {
    render(<HabitsManagement />);

    // Date filter defaults to All Dates
    expect(screen.getByRole('combobox', { name: 'Filter by date' })).toHaveTextContent('All Dates');

    // Selecting Today option filters the habits list
    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by date' }));
    await waitFor(() => {
      fireEvent.click(screen.getByRole('option', { name: 'Today' }));
    });
    expect(screen.getByRole('combobox', { name: 'Filter by date' })).toHaveTextContent('Today');

    // Selecting Tomorrow option filters the habits list
    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by date' }));
    await waitFor(() => {
      fireEvent.click(screen.getByRole('option', { name: 'Tomorrow' }));
    });
    expect(screen.getByRole('combobox', { name: 'Filter by date' })).toHaveTextContent('Tomorrow');

    // Reset to All Dates restores the full list display
    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by date' }));
    await waitFor(() => {
      fireEvent.click(screen.getByRole('option', { name: 'All Dates' }));
    });
    expect(screen.getByText('Daily Meditation')).toBeVisible();
    expect(screen.getByText('Hydration & Water')).toBeVisible();
  }, 30000);

  it('uses the Habits Library count for the matching Weekly Overview date', async () => {
    window.localStorage.setItem(
      'recovery-first.habits-list',
      JSON.stringify([
        {
          id: 'h-wednesday-1',
          name: 'Wednesday Walk',
          category: 'Health',
          normalTarget: '30 minutes',
          minimumTarget: '5 minutes',
          schedule: 'Daily (08:00 AM - 09:00 AM)',
          status: 'Active',
          createdDate: '2026-08-05',
          iconName: 'running',
        },
        {
          id: 'h-wednesday-2',
          name: 'Wednesday Reading',
          category: 'Learning',
          normalTarget: '20 pages',
          minimumTarget: '2 pages',
          schedule: 'Daily (07:00 PM - 08:00 PM)',
          status: 'Active',
          createdDate: '2026-08-05',
          iconName: 'reading',
        },
        {
          id: 'h-wednesday-3',
          name: 'Jan Wednesday Walk',
          category: 'Health',
          normalTarget: '30 minutes',
          minimumTarget: '5 minutes',
          schedule: 'Daily (08:00 AM - 09:00 AM)',
          status: 'Active',
          createdDate: '2026-01-14',
          iconName: 'running',
        },
        {
          id: 'h-wednesday-4',
          name: 'Jan Wednesday Reading',
          category: 'Learning',
          normalTarget: '20 pages',
          minimumTarget: '2 pages',
          schedule: 'Daily (07:00 PM - 08:00 PM)',
          status: 'Active',
          createdDate: '2026-01-14',
          iconName: 'reading',
        },
      ]),
    );

    render(<HabitsManagement />);

    await waitFor(() => {
      const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
      const WednesdayRow = rows.find((row) => {
        const cellText = within(row).getAllByRole('cell')[0]?.textContent?.trim();
        return cellText === 'Aug 5' || cellText === 'Jan 14';
      });

      expect(WednesdayRow).toBeDefined();
      if (WednesdayRow) {
        expect(within(WednesdayRow).getAllByRole('cell')[2]).toHaveTextContent(/\/2$/);
      }
    });
  });

  it('navigates to Habit Detail view when View Details is clicked and returns back to Habits Library when Back to Habits is clicked', () => {
    render(<HabitsManagement />);

    // Click View Details on Daily Meditation
    const viewDetailsButtons = screen.getAllByRole('button', { name: /View Details/i });
    const firstDetailButton = viewDetailsButtons[0];
    expect(firstDetailButton).toBeDefined();
    if (firstDetailButton) {
      fireEvent.click(firstDetailButton);
    }

    // Verify detail view is rendered
    expect(screen.getByRole('heading', { level: 1, name: 'Daily Meditation' })).toBeVisible();

    // Click Back to Habits
    fireEvent.click(screen.getByRole('button', { name: /Back to Habits/i }));

    // Verify returned to Habits Library
    expect(screen.getByRole('heading', { level: 1, name: 'Habits Library' })).toBeVisible();
  }, 30000);

  it('blocks creating a habit whose name already exists in the list', () => {
    render(<HabitsManagement />);

    // Open the create habit dialog
    const addHabitButtons = screen.getAllByRole('button', { name: /Add Habit/i });
    const firstAddButton = addHabitButtons[0];
    expect(firstAddButton).toBeDefined();
    if (firstAddButton) {
      fireEvent.click(firstAddButton);
    }

    const nameInput = screen.getByLabelText('Habit Name');
    expect(nameInput).toBeInTheDocument();

    // Enter a name that already exists (case-insensitive match expected)
    fireEvent.change(nameInput, { target: { value: 'daily meditation' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Habit/i }));

    expect(
      screen.getByText('A habit with this name already exists. Choose a different name.'),
    ).toBeVisible();

    // Correcting to a unique name clears the error and allows submission
    fireEvent.change(nameInput, { target: { value: 'Evening Journal' } });
    expect(
      screen.queryByText('A habit with this name already exists. Choose a different name.'),
    ).not.toBeInTheDocument();
  }, 30000);

  it('persists a habit status change without updating AppShell during render', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      render(
        <StrictMode>
          <HabitsManagement />
        </StrictMode>,
      );

      const pauseHabitButton = screen.getAllByTitle('Pause Habit')[0];
      expect(pauseHabitButton).toBeDefined();
      if (pauseHabitButton) {
        fireEvent.click(pauseHabitButton);
      }

      const storedHabits = JSON.parse(
        window.localStorage.getItem('recovery-first.habits-list') ?? '[]',
      ) as Array<{ id: string; status: string }>;
      expect(storedHabits.find((habit) => habit.id === 'h1')?.status).toBe('Paused');

      const hasRenderPhaseWarning = consoleError.mock.calls.some((call) =>
        call.some(
          (argument) =>
            typeof argument === 'string' &&
            argument.includes(
              'Cannot update a component (`AppShell`) while rendering a different component (`HabitsManagement`)',
            ),
        ),
      );

      expect(hasRenderPhaseWarning).toBe(false);
    } finally {
      consoleError.mockRestore();
    }
  }, 30000);
});
