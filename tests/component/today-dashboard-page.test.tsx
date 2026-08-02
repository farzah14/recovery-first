import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TodayDashboard } from '@/features/today/today-dashboard';

describe('TodayDashboard', () => {
  it('renders supportive time-based greeting, animated circular progress ring, scheduled habits list, and action buttons', () => {
    render(<TodayDashboard />);

    // Supportive time-of-day greeting & date (Good morning / afternoon / evening)
    expect(
      screen.getByRole('heading', { level: 1, name: /Good (morning|afternoon|evening), Alex\./i }),
    ).toBeVisible();

    // Progress summary widget & total habits
    expect(screen.getByText("Today's Progress")).toBeVisible();
    expect(screen.getByText('3 Total Habits')).toBeVisible();

    // Habit cards
    expect(screen.getByRole('button', { name: 'Daily Meditation' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Morning Hydration' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Read 5 Pages' })).toBeVisible();

    // Recovery Available indication
    expect(screen.getByText('Recovery Available')).toBeVisible();
  }, 15000);

  it('records Full, Minimum, and Skipped outcomes correctly morphing control button and excluding Skipped from Today Progress', () => {
    render(<TodayDashboard />);

    // Record Skipped for Daily Meditation using exact button text 'Skip'
    const skipButtons = screen.getAllByRole('button', { name: 'Skip' });
    if (skipButtons[0]) {
      fireEvent.click(skipButtons[0]);
    }

    // Check that Skipped status displays Skipped on the morphed control button
    expect(screen.getByRole('button', { name: /Skipped/i })).toBeVisible();

    // Check that progress completed count did NOT increase from initial (Initial: Morning Hydration [minimum]=1, Read 5 Pages [full]=1 => Total 2)
    expect(screen.getByText(/2 of 3 habits completed today/i)).toBeVisible();

    // Record Full for Daily Meditation by clicking Skipped to reset then Full
    fireEvent.click(screen.getByRole('button', { name: /Skipped/i }));
    const fullButtons = screen.getAllByRole('button', { name: 'Full' });
    if (fullButtons[0]) {
      fireEvent.click(fullButtons[0]);
    }

    // Check that Full displays Completed! and increases completed count to 3
    expect(screen.getAllByRole('button', { name: /Completed!/i }).length).toBe(3);
    expect(screen.getByText(/3 of 3 habits completed today/i)).toBeVisible();
  }, 15000);

  it('allows editing a habit name and target parameters via Edit Habit dialog', () => {
    render(<TodayDashboard />);

    const editButtons = screen.getAllByRole('button', { name: /Edit Daily Meditation/i });
    if (editButtons[0]) {
      fireEvent.click(editButtons[0]);
    }

    expect(screen.getByRole('heading', { level: 2, name: 'Edit Habit' })).toBeVisible();
    expect(screen.getByDisplayValue('Daily Meditation')).toBeVisible();
  }, 15000);

  it('opens Create Habit dialog when requested from sidebar', () => {
    render(<TodayDashboard />);

    const createButtons = screen.getAllByRole('button', { name: /Add Habit/i });
    if (createButtons[0]) {
      fireEvent.click(createButtons[0]);
    }

    expect(screen.getByRole('heading', { level: 2, name: 'Create New Habit' })).toBeVisible();
  }, 15000);

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
  }, 15000);

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
  }, 15000);

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
  }, 15000);

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
    expect(screen.getByText(/Min:\s*Minimum 2 mins/i)).toBeVisible();
    expect(screen.getByText(/Full:\s*Full 10 mins/i)).toBeVisible();

    // Click Skip on first habit
    const skipButtons = screen.getAllByRole('button', { name: 'Skip' });
    if (skipButtons[0]) {
      fireEvent.click(skipButtons[0]);
    }

    // Check Completed! text element
    const completedButtons = screen.getAllByRole('button', { name: /Completed!/i });
    expect(completedButtons[0]).toBeVisible();
    expect(completedButtons[0]).not.toHaveClass('border');
  }, 15000);

  it('hides Adjust Plan button when the habit is completed', () => {
    render(<TodayDashboard />);

    // Daily Meditation has needsReview, so Adjust Plan is visible initially
    const fullButtons = screen.getAllByRole('button', { name: 'Full' });
    if (fullButtons[0]) {
      fireEvent.click(fullButtons[0]);
    }

    // Adjust Plan button should be hidden / removed
    expect(screen.queryByRole('button', { name: /Adjust Plan/i })).toBeNull();
  }, 15000);

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
  }, 15000);

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
  }, 15000);

  it('renders pure From-Until clock time range for habit timing contexts', () => {
    render(<TodayDashboard />);

    // From-Until Clock time ranges present
    expect(screen.getByText('08:00 AM - 09:00 AM')).toBeVisible();
    expect(screen.getByText('09:00 AM - 10:00 AM')).toBeVisible();
    expect(screen.getByText('05:00 PM - 06:00 PM')).toBeVisible();

    // Ensure no prefixed strings like Daily • 08:00 AM exist
    expect(screen.queryByText(/Daily\s*•/i)).toBeNull();
    expect(screen.queryByText(/Morning\s*•/i)).toBeNull();
    expect(screen.queryByText(/Evening\s*•/i)).toBeNull();
    expect(screen.queryByText(/Night\s*•/i)).toBeNull();
  }, 15000);
});
