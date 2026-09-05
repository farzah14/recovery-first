import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppShell } from '@/components/layout/app-shell';
import { AccountStateProvider } from '@/components/account/account-state';

describe('AppShell Weekly Overview', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('uses persisted weekly counts instead of inventing sample completions', () => {
    const ThursdayDate = new Date(2026, 7, 6);

    render(
      <AppShell currentDate={ThursdayDate}>
        <div>Content</div>
      </AppShell>,
    );

    expect(screen.getByText('0 Completed')).toBeInTheDocument();
    expect(screen.getAllByText('0/0')).toHaveLength(7);
  });

  it('renders the same persisted counts supplied by the repository', () => {
    const ThursdayDate = new Date(2026, 7, 6);

    render(
      <AppShell
        currentDate={ThursdayDate}
        weeklyOverview={{
          todayDate: '2026-08-06',
          startDate: '2026-08-03',
          endDate: '2026-08-09',
          days: [
            { localDate: '2026-08-03', completedCount: 1, totalCount: 2 },
            { localDate: '2026-08-04', completedCount: 2, totalCount: 2 },
            { localDate: '2026-08-05', completedCount: 0, totalCount: 2 },
            { localDate: '2026-08-06', completedCount: 1, totalCount: 3 },
            { localDate: '2026-08-07', completedCount: 0, totalCount: 0 },
            { localDate: '2026-08-08', completedCount: 0, totalCount: 0 },
            { localDate: '2026-08-09', completedCount: 0, totalCount: 0 },
          ],
        }}
      >
        <div>Content</div>
      </AppShell>,
    );

    expect(screen.getByText('4 Completed')).toBeInTheDocument();
    expect(screen.getByText(/4\s*\/\s*9 Sessions/)).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByText('Thursday (Today)')).toBeInTheDocument();
  });

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

  it('orders the Weekly Overview from Sunday through Saturday for a Sunday-first account', () => {
    const ThursdayDate = new Date(2026, 7, 6);

    render(
      <AccountStateProvider
        account={{
          displayName: 'Alex',
          planTier: 'free',
          timezone: 'UTC',
          weekStart: 7,
        }}
      >
        <AppShell currentDate={ThursdayDate}>
          <div>Content</div>
        </AppShell>
      </AccountStateProvider>,
    );

    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).getAllByRole('cell')[1]?.textContent?.trim())).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday (Today)',
      'Friday',
      'Saturday',
    ]);
  });

  it('uses each habit start date when calculating the total for each overview day', async () => {
    const MondayDate = new Date(2026, 7, 3);

    window.localStorage.setItem(
      'recovery-first.habits-list',
      JSON.stringify([
        {
          id: 'h-tomorrow',
          name: 'Tomorrow Habit',
          category: 'Health',
          normalTarget: '10 minutes',
          minimumTarget: '2 minutes',
          schedule: 'Daily (08:00 AM - 09:00 AM)',
          status: 'Active',
          createdDate: '2026-08-04',
          iconName: 'target',
        },
      ]),
    );

    render(
      <AppShell currentDate={MondayDate} todayCompletedCount={2} todayTotalCount={3}>
        <div>Content</div>
      </AppShell>,
    );

    await waitFor(() => {
      const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);

      expect(rows).toHaveLength(7);
      expect(rows.map((row) => within(row).getAllByRole('cell')[2]?.textContent?.trim())).toEqual([
        '2/3',
        '0/4',
        '0/4',
        '0/4',
        '0/4',
        '0/4',
        '0/4',
      ]);
    });
  });

  it('uses exact route-provided library counts for each calendar date', () => {
    const MondayDate = new Date(2026, 7, 3);

    render(
      <AppShell
        currentDate={MondayDate}
        todayCompletedCount={2}
        todayTotalCount={3}
        habitCountForDate={(date) => (date.getDate() === 3 ? 3 : date.getDate() === 5 ? 2 : 0)}
      >
        <div>Content</div>
      </AppShell>,
    );

    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);

    expect(rows.map((row) => within(row).getAllByRole('cell')[2]?.textContent?.trim())).toEqual([
      '2/3',
      '0/0',
      '0/2',
      '0/0',
      '0/0',
      '0/0',
      '0/0',
    ]);
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
