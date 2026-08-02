import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HabitsManagement } from '@/features/habits/habits-management';

describe('HabitsManagement', () => {
  it('renders Habits Library header, search bar, status and category dropdowns, active habits cards, and paused habits section', () => {
    render(<HabitsManagement />);

    // Header title
    expect(screen.getByRole('heading', { level: 1, name: 'Habits Library' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: /Add Habit/i }).length).toBeGreaterThan(0);

    // Status and category filter dropdowns
    expect(screen.getByRole('combobox', { name: 'Filter by status' })).toHaveTextContent(
      'All Status',
    );
    expect(screen.getByRole('combobox', { name: 'Filter by category' })).toHaveTextContent(
      'All Categories',
    );

    // Active habit cards
    expect(screen.getByText('Daily Meditation')).toBeVisible();
    expect(screen.getByText('Hydration & Water')).toBeVisible();

    // Paused habits section
    expect(screen.getByText(/Paused Habits \(1\)/i)).toBeVisible();
    expect(screen.getByText('Read Tech Documentation')).toBeVisible();
  }, 15000);

  it('filters habits list by category and status dropdowns', async () => {
    render(<HabitsManagement />);

    // Select Mindfulness from the category dropdown
    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by category' }));
    fireEvent.click(screen.getByRole('option', { name: 'Mindfulness' }));
    expect(screen.getByText('Daily Meditation')).toBeVisible();
    expect(screen.queryByText('Hydration & Water')).not.toBeInTheDocument();

    // Reset to all categories
    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by category' }));
    fireEvent.click(screen.getByRole('option', { name: 'All Categories' }));
    expect(screen.getByText('Hydration & Water')).toBeVisible();

    // Filter by Paused status
    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by status' }));
    fireEvent.click(screen.getByRole('option', { name: 'Paused' }));
    expect(screen.getByText('Read Tech Documentation')).toBeVisible();
  }, 30000);

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
    expect(screen.getByRole('heading', { level: 2, name: 'Current Definition' })).toBeVisible();

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
});
