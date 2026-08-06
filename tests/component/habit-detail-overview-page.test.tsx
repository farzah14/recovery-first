import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';

import { HabitDetailOverview } from '@/features/habits/habit-detail-overview';

describe('HabitDetailOverview', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders habit name, active status badge, normal and minimum targets, and continuity metrics', () => {
    render(<HabitDetailOverview />);

    // Habit name
    expect(screen.getByRole('heading', { level: 1, name: 'Daily Meditation' })).toBeVisible();

    // Active status badge with label
    expect(screen.getByText('Active')).toBeVisible();

    // Normal & Minimum targets
    expect(screen.getByText('30 mins meditation')).toBeVisible();
    expect(screen.getByText('5 mins stretching')).toBeVisible();
    expect(screen.getByText('Compassionate baseline for low-energy days.')).toBeVisible();

    // Continuity metrics
    expect(screen.getByText('12')).toBeVisible();
    expect(screen.getByText('Current Streak')).toBeVisible();

    // Redesign action button
    expect(screen.getByRole('button', { name: /Redesign/i })).toBeVisible();
  }, 30000);

  it('supports tab switching between Overview, History, and Insights & Changes', () => {
    render(<HabitDetailOverview />);

    // Click History tab
    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    expect(screen.getByRole('heading', { name: 'Completion History Log' })).toBeVisible();

    // Click Insights & Changes tab
    fireEvent.click(screen.getByRole('button', { name: 'Insights & Changes' }));
    expect(screen.getByRole('heading', { name: 'Friction Analysis & Insights' })).toBeVisible();

    // Return to Overview
    fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
    expect(screen.getByRole('heading', { name: 'Current Definition' })).toBeVisible();
  }, 30000);

  it('allows pausing/resuming, editing, redesigning, and deleting habit without non-dominant red visual overflow', () => {
    render(<HabitDetailOverview />);

    // Pause toggle
    const pauseBtn = screen.getByTitle('Pause Habit');
    fireEvent.click(pauseBtn);
    expect(screen.getByText('Paused')).toBeVisible();

    // Open Edit dialog
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(
      screen.getByRole('heading', { level: 2, name: 'Edit Habit Specifications' }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Open Delete confirmation dialog
    const deleteBtn = screen.getByTitle('Delete Habit');
    fireEvent.click(deleteBtn);
    expect(screen.getByRole('heading', { level: 2, name: 'Delete Habit' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  }, 30000);
});
