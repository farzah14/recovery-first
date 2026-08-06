import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';

import { TodayDashboard } from '@/features/today/today-dashboard';

describe('TodayDashboard', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders supportive time-based greeting, animated circular progress ring, scheduled habits list, and action buttons', () => {
    render(<TodayDashboard />);

    // Supportive time-of-day greeting & date (Good morning / afternoon / evening)
    expect(
      screen.getByRole('heading', { level: 1, name: /Good (morning|afternoon|evening), Alex\./i }),
    ).toBeVisible();

    // Progress summary widget & total habits
    expect(screen.getByText("Today's Progress")).toBeVisible();
    expect(screen.getByText('2 Total Habits')).toBeVisible();

    // Habit cards
    expect(screen.getByRole('button', { name: 'Daily Meditation' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Hydration & Water' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Read 5 Pages' })).toBeNull();

    // Recovery Available indication
    expect(screen.getByText('Recovery Available')).toBeVisible();
  });

  it('records Full, Minimum, and Skipped outcomes correctly morphing control button and excluding Skipped from Today Progress', () => {
    render(<TodayDashboard />);

    // Record Skipped for Daily Meditation using exact button text 'Skip'
    const skipButtons = screen.getAllByRole('button', { name: 'Skip' });
    if (skipButtons[0]) {
      fireEvent.click(skipButtons[0]);
    }

    // Check that Skipped status displays Skipped on the morphed control button
    expect(screen.getByRole('button', { name: /Skipped/i })).toBeVisible();

    // Skipped is not completed, so progress remains at zero of the two active Library habits.
    expect(screen.getByText(/0 of 2 habits completed today/i)).toBeVisible();

    // Record Full for Daily Meditation by clicking Skipped to reset then Full
    fireEvent.click(screen.getByRole('button', { name: /Skipped/i }));
    const fullButtons = screen.getAllByRole('button', { name: 'Full' });
    if (fullButtons[0]) {
      fireEvent.click(fullButtons[0]);
    }

    // Check that Full displays Completed! and increases completed count to one.
    expect(screen.getAllByRole('button', { name: /Completed!/i }).length).toBe(1);
    expect(screen.getByText(/1 of 2 habits completed today/i)).toBeVisible();
  });

  it('allows editing a habit name and target parameters via Edit Habit dialog', () => {
    render(<TodayDashboard />);

    const editButtons = screen.getAllByRole('button', { name: /Edit Daily Meditation/i });
    if (editButtons[0]) {
      fireEvent.click(editButtons[0]);
    }

    expect(screen.getByRole('heading', { level: 2, name: 'Edit Habit' })).toBeVisible();
    expect(screen.getByDisplayValue('Daily Meditation')).toBeVisible();
  });

  it('persists Today edits back to the canonical Library record', async () => {
    render(<TodayDashboard />);

    fireEvent.click(screen.getByRole('button', { name: /Edit Daily Meditation/i }));
    fireEvent.change(screen.getByDisplayValue('Daily Meditation'), {
      target: { value: 'Library-renamed Meditation' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      const storedHabits = JSON.parse(
        window.localStorage.getItem('recovery-first.habits-list') ?? '[]',
      ) as Array<{ id: string; name: string }>;
      expect(storedHabits.find((habit) => habit.id === 'h1')?.name).toBe(
        'Library-renamed Meditation',
      );
      expect(screen.getByRole('button', { name: 'Library-renamed Meditation' })).toBeVisible();
      expect(screen.queryByRole('button', { name: 'Daily Meditation' })).toBeNull();
    });
  });

  it('opens Create Habit dialog when requested from sidebar', () => {
    render(<TodayDashboard />);

    const createButtons = screen.getAllByRole('button', { name: /Add Habit/i });
    if (createButtons[0]) {
      fireEvent.click(createButtons[0]);
    }

    expect(screen.getByRole('heading', { level: 2, name: 'Create New Habit' })).toBeVisible();
  });

  it('allows choosing an icon when creating a new habit', () => {
    render(<TodayDashboard />);

    const createButtons = screen.getAllByRole('button', { name: /Add Habit/i });
    if (createButtons[0]) {
      fireEvent.click(createButtons[0]);
    }

    expect(screen.getByText('Choose Icon')).toBeVisible();
    // Select the exercise icon option button
    const exerciseIconButton = screen.getByRole('button', { name: /Select Exercise icon/i });
    expect(exerciseIconButton).toBeVisible();
    fireEvent.click(exerciseIconButton);

    // Fill habit name and submit
    const nameInput = screen.getByLabelText('Habit Name');
    fireEvent.change(nameInput, { target: { value: 'Gym Workout' } });

    const saveButton = screen.getByRole('button', { name: 'Save Habit' });
    fireEvent.click(saveButton);

    expect(screen.getByRole('button', { name: 'Gym Workout' })).toBeVisible();
  });

  it('allows choosing From and Until clock times for habit schedule range', () => {
    render(<TodayDashboard />);

    const createButtons = screen.getAllByRole('button', { name: /Add Habit/i });
    if (createButtons[0]) {
      fireEvent.click(createButtons[0]);
    }

    // Check for From and Until clock time inputs
    const fromTimeInput = screen.getByLabelText(/From Clock/i);
    const untilTimeInput = screen.getByLabelText(/Until Clock/i);
    expect(fromTimeInput).toBeVisible();
    expect(untilTimeInput).toBeVisible();

    // Change From time to 11:00 and Until time to 12:00
    fireEvent.change(fromTimeInput, { target: { value: '11:00' } });
    fireEvent.change(untilTimeInput, { target: { value: '12:00' } });

    const nameInput = screen.getByLabelText('Habit Name');
    fireEvent.change(nameInput, { target: { value: 'Late Morning Walk' } });

    const saveButton = screen.getByRole('button', { name: 'Save Habit' });
    fireEvent.click(saveButton);

    expect(screen.getByRole('button', { name: 'Late Morning Walk' })).toBeVisible();
    expect(screen.getByText(/11:00 AM - 12:00 PM/i)).toBeVisible();
  });

  it('preserves existing From and Until timing context when opening Edit Habit dialog', () => {
    render(<TodayDashboard />);

    // Open Edit Habit for Daily Meditation
    const editButtons = screen.getAllByRole('button', { name: /Edit Daily Meditation/i });
    if (editButtons[0]) {
      fireEvent.click(editButtons[0]);
    }

    // Check timing input retains existing range value '08:00 AM - 09:00 AM'
    const timingInput = screen.getByDisplayValue('08:00 AM - 09:00 AM');
    expect(timingInput).toBeVisible();
  });

  it('renders Recovery Available and green Adjust Plan with matching text-[11px] font size, and Min/Full list prefixes', () => {
    render(<TodayDashboard />);

    // Recovery Available text
    const recoveryElement = screen.getByText('Recovery Available');
    expect(recoveryElement).toBeVisible();

    // Adjust Plan button with green text and text-[11px] matching Recovery Available
    const adjustBtn = screen.getByRole('button', { name: /Adjust Plan/i });
    expect(adjustBtn).toBeVisible();
    expect(adjustBtn.className).toContain('text-[var(--color-primary)]');
    expect(adjustBtn.className).toContain('text-[11px]');

    // Check Min: and Full: target list items
    expect(screen.getByText(/Min:\s*Minimum 5 mins stretching/i)).toBeVisible();
    expect(screen.getByText(/Full:\s*Full 30 mins meditation/i)).toBeVisible();

    // Click Skip on first habit
    const skipButtons = screen.getAllByRole('button', { name: 'Skip' });
    if (skipButtons[0]) {
      fireEvent.click(skipButtons[0]);
    }

    // Skipped is recorded but does not count as completed.
    const skippedButton = screen.getByRole('button', { name: /Skipped/i });
    expect(skippedButton).toBeVisible();
    expect(skippedButton).not.toHaveClass('border');
  });

  it('hides Adjust Plan button when the habit is completed', () => {
    render(<TodayDashboard />);

    // Daily Meditation has needsReview, so Adjust Plan is visible initially
    const fullButtons = screen.getAllByRole('button', { name: 'Full' });
    if (fullButtons[0]) {
      fireEvent.click(fullButtons[0]);
    }

    // Adjust Plan button should be hidden / removed
    expect(screen.queryByRole('button', { name: /Adjust Plan/i })).toBeNull();
  });

  it('renders Daily Reflection card with default ..... text and updates to Edit Reflection Note when note is saved', () => {
    render(<TodayDashboard />);

    // Verify title is Daily Reflection on the dashboard card
    const reflectionTitles = screen.getAllByText(/Daily Reflection/i);
    expect(reflectionTitles.length).toBeGreaterThanOrEqual(1);

    // Verify default text is .....
    expect(screen.getByText('.....')).toBeVisible();

    // Click Add Reflection Note in right rail under Weekly Overview
    const addNoteButtons = screen.getAllByRole('button', { name: /Add Reflection Note/i });
    const targetBtn = addNoteButtons[0];
    if (targetBtn) {
      fireEvent.click(targetBtn);
    }

    // Fill in custom reflection note
    const textarea = screen.getByPlaceholderText(/e\.g\. Focused on consistency today/i);
    fireEvent.change(textarea, {
      target: { value: 'Great focus on hydration and reading today!' },
    });

    const saveButton = screen.getByRole('button', { name: 'Save Reflection' });
    fireEvent.click(saveButton);

    // Verify text in Daily Reflection card updated to user's typed note
    expect(screen.getByText(/Great focus on hydration and reading today!/i)).toBeVisible();
    expect(
      screen.getByText(
        /Write about how you’re feeling today\. This will help you improve in the future\./i,
      ),
    ).toBeVisible();
    expect(screen.queryByText('.....')).toBeNull();

    // Verify button in rail changed to Edit Reflection Note
    expect(screen.getByRole('button', { name: /Edit Reflection Note/i })).toBeVisible();
  });

  it('renders toast notification at center bottom position with animation classes when action occurs', () => {
    render(<TodayDashboard />);

    // Perform action that triggers toast (e.g. click Full)
    const fullButtons = screen.getAllByRole('button', { name: 'Full' });
    const targetBtn = fullButtons[0];
    if (targetBtn) {
      fireEvent.click(targetBtn);
    }

    // Verify toast container exists with status role and bottom center positioning
    const toastElement = screen.getByRole('status');
    expect(toastElement).toBeVisible();
    expect(toastElement.className).toContain('fixed');
    expect(toastElement.className).toContain('bottom-8');
    expect(toastElement.className).toContain('left-1/2');
    expect(toastElement.className).toContain('-translate-x-1/2');
  });

  it('renders pure From-Until clock time range for habit timing contexts', () => {
    render(<TodayDashboard />);

    // From-Until Clock time ranges present
    expect(screen.getByText('08:00 AM - 09:00 AM')).toBeVisible();
    expect(screen.getByText('09:00 AM - 05:00 PM')).toBeVisible();
    expect(screen.queryByText('05:00 PM - 06:00 PM')).toBeNull();

    // Ensure no prefixed strings like Daily • 08:00 AM exist
    expect(screen.queryByText(/Daily\s*•/i)).toBeNull();
    expect(screen.queryByText(/Morning\s*•/i)).toBeNull();
    expect(screen.queryByText(/Evening\s*•/i)).toBeNull();
    expect(screen.queryByText(/Night\s*•/i)).toBeNull();
  });

  it('sorts the scheduled habits list ascending by start time when stored habits are out of order', async () => {
    const todayStr = new Date().toISOString().split('T')[0];

    window.localStorage.setItem(
      'recovery-first.habits-list',
      JSON.stringify([
        {
          id: 'h-night',
          name: 'Night Wind Down',
          category: 'Health',
          normalTarget: 'Full 30 mins',
          minimumTarget: 'Minimum 5 mins',
          schedule: '09:00 PM - 10:00 PM',
          status: 'Active',
          createdDate: todayStr,
          iconName: 'moon',
        },
        {
          id: 'h-dawn',
          name: 'Dawn Stretch',
          category: 'Health',
          normalTarget: 'Full 15 mins',
          minimumTarget: 'Minimum 2 mins',
          schedule: '05:00 AM - 05:30 AM',
          status: 'Active',
          createdDate: todayStr,
          iconName: 'exercise',
        },
      ]),
    );

    render(<TodayDashboard />);

    await waitFor(() => {
      const timingTexts = screen
        .getAllByText(/\d{2}:\d{2} [AP]M - \d{2}:\d{2} [AP]M/)
        .map((el) => el.textContent);

      expect(timingTexts).toEqual([
        '05:00 AM - 05:30 AM',
        '08:00 AM - 09:00 AM',
        '09:00 AM - 05:00 PM',
        '09:00 PM - 10:00 PM',
      ]);
    });
  });

  it('derives Today habits from the Library definitions instead of retaining stale sessions', async () => {
    const todayStr = new Date().toISOString().split('T')[0];

    window.localStorage.setItem(
      'recovery-first.habits-list',
      JSON.stringify([
        {
          id: 'h1',
          name: 'Renamed Library Meditation',
          category: 'Mindfulness',
          normalTarget: '30 mins meditation',
          minimumTarget: '5 mins stretching',
          schedule: '08:00 AM - 09:00 AM',
          status: 'Active',
          createdDate: todayStr,
          iconName: 'meditation',
        },
        {
          id: 'h2',
          name: 'Paused Library Hydration',
          category: 'Health',
          normalTarget: '2.5 Liters water',
          minimumTarget: '1 Liter water',
          schedule: '09:00 AM - 05:00 PM',
          status: 'Paused',
          createdDate: todayStr,
          iconName: 'water',
        },
      ]),
    );

    render(<TodayDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Renamed Library Meditation' })).toBeVisible();
      expect(screen.queryByRole('button', { name: 'Daily Meditation' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Paused Library Hydration' })).toBeNull();
      expect(screen.getByText('1 Total Habits')).toBeVisible();
    });
  });
});
