import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppShell } from '@/components/layout/app-shell';

describe('AppShell Weekly Overview', () => {
  it('dynamically marks the ONE real current day as Today and the next day as Tomorrow', () => {
    // Mock date to a known Friday: July 31, 2026
    const FridayDate = new Date(2026, 6, 31); // July 31, 2026 is a Friday

    render(
      <AppShell currentDate={FridayDate} todayCompletedCount={2} todayTotalCount={4}>
        <div>Content</div>
      </AppShell>,
    );

    // Should display Friday (Today)
    expect(screen.getByText('Friday (Today)')).toBeInTheDocument();
    // Should display Saturday without (Tomorrow)
    expect(screen.getByText('Saturday')).toBeInTheDocument();
    expect(screen.queryByText(/Tomorrow/i)).toBeNull();
    // Should NOT display Thursday (Today) unless Thursday is actually today
    expect(screen.queryByText('Thursday (Today)')).toBeNull();

    // Table Headers
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Total Habits')).toBeInTheDocument();

    // Date strings for July 31, 2026 (Friday)
    expect(screen.getByText('Jul 31')).toBeInTheDocument(); // Friday
    expect(screen.getByText('Aug 1')).toBeInTheDocument(); // Saturday
  });

  it('correctly calculates Weekly Overview when today is Monday', () => {
    // Mock date to a known Monday: July 27, 2026
    const MondayDate = new Date(2026, 6, 27); // July 27, 2026 is a Monday

    render(
      <AppShell currentDate={MondayDate} todayCompletedCount={1} todayTotalCount={3}>
        <div>Content</div>
      </AppShell>,
    );

    expect(screen.getByText('Monday (Today)')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    expect(screen.getByText('Jul 27')).toBeInTheDocument();
    expect(screen.getByText('Jul 28')).toBeInTheDocument();
    expect(screen.queryByText(/Tomorrow/i)).toBeNull();
    expect(screen.queryByText('Thursday (Today)')).toBeNull();
  });

  it('correctly calculates Weekly Overview when today is Sunday', () => {
    // Mock date to a known Sunday: August 2, 2026
    const SundayDate = new Date(2026, 7, 2); // August 2, 2026 is a Sunday

    render(
      <AppShell currentDate={SundayDate} todayCompletedCount={3} todayTotalCount={3}>
        <div>Content</div>
      </AppShell>,
    );

    expect(screen.getByText('Sunday (Today)')).toBeInTheDocument();
    expect(screen.getByText('Aug 2')).toBeInTheDocument();
    expect(screen.queryByText('Thursday (Today)')).toBeNull();
  });

  it('renders Daily Reflection text with prompt text', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );

    expect(screen.getByText('Daily Reflection')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Write about how you’re feeling today\. This will help you improve in the future\./i,
      ),
    ).toBeInTheDocument();
  });
});
