import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  InsightsPanel,
  RemindersPanel,
  ReviewPanel,
} from '@/components/account/account-data-panels';
import type { AccountSurfacesRead } from '@/server/account/account-surfaces';

const readyRead: AccountSurfacesRead = {
  status: 'ready',
  review: {
    startDate: '2026-08-31',
    endDate: '2026-09-06',
    pendingItems: 2,
    resolvedSessions: 3,
    successfulSessions: 2,
    minimumSessions: 1,
  },
  insights: {
    fullTargetRate: 33.33,
    nonZeroRate: 66.67,
    recommendation: 'Evening sessions are often skipped.',
  },
  reminders: {
    configs: [],
    emailOptIn: false,
  },
};

const emptyRead: AccountSurfacesRead = {
  ...readyRead,
  review: {
    ...readyRead.review,
    pendingItems: 0,
    resolvedSessions: 0,
    successfulSessions: 0,
    minimumSessions: 0,
  },
  insights: {
    fullTargetRate: null,
    nonZeroRate: null,
    recommendation: null,
  },
};

const unavailableRead: AccountSurfacesRead = {
  ...emptyRead,
  status: 'unavailable',
};

const reminderRead: AccountSurfacesRead = {
  ...readyRead,
  reminders: {
    emailOptIn: true,
    configs: [
      {
        habitId: 'habit-1',
        habitTitle: 'Morning Grounding',
        channel: 'web_push',
        localTime: '08:00:00',
        timezone: 'Asia/Jakarta',
        enabled: true,
        registration: 'registered',
      },
      {
        habitId: 'habit-2',
        habitTitle: 'Evening Reading',
        channel: 'web_push',
        localTime: '20:00:00',
        timezone: 'Asia/Jakarta',
        enabled: true,
        registration: 'needs_permission',
      },
      {
        habitId: 'habit-3',
        habitTitle: 'Hydration Break',
        channel: 'email',
        localTime: '11:00:00',
        timezone: 'Asia/Jakarta',
        enabled: false,
        registration: 'not_applicable',
      },
    ],
  },
};

describe('account data panels', () => {
  it('renders persisted Review metrics and pending item count', () => {
    render(<ReviewPanel read={readyRead} />);

    expect(screen.getByText('66.67%')).toBeVisible();
    expect(screen.getByText('2')).toBeVisible();
    expect(screen.getByText('1')).toBeVisible();
    expect(screen.getByText(/2 open review items/i)).toBeVisible();
    expect(screen.queryByText('85%')).not.toBeInTheDocument();
    expect(screen.queryByText('14')).not.toBeInTheDocument();
  });

  it('renders persisted Insights metrics and recommendation text', () => {
    render(<InsightsPanel read={readyRead} />);

    expect(screen.getByText('33.33%')).toBeVisible();
    expect(screen.getByText('66.67%')).toBeVisible();
    expect(screen.getByText('Evening sessions are often skipped.')).toBeVisible();
    expect(screen.queryByText('92%')).not.toBeInTheDocument();
    expect(screen.queryByText('98%')).not.toBeInTheDocument();
  });

  it('shows explicit empty states without inventing account results', () => {
    render(
      <>
        <ReviewPanel read={emptyRead} />
        <InsightsPanel read={emptyRead} />
      </>,
    );

    expect(screen.getAllByText('No sessions recorded for this week yet.')).toHaveLength(2);
    expect(screen.getByText('No recommendation available yet.')).toBeVisible();
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.queryByText('85%')).not.toBeInTheDocument();
    expect(screen.queryByText('92%')).not.toBeInTheDocument();
    expect(screen.queryByText('98%')).not.toBeInTheDocument();
    expect(screen.queryByText('14')).not.toBeInTheDocument();
  });

  it('shows an unavailable state without rendering stale sample values', () => {
    render(
      <>
        <ReviewPanel read={unavailableRead} />
        <InsightsPanel read={unavailableRead} />
      </>,
    );

    expect(
      screen.getAllByText('Account data is temporarily unavailable. Please try again shortly.'),
    ).toHaveLength(2);
    expect(screen.queryByText('85%')).not.toBeInTheDocument();
    expect(screen.queryByText('92%')).not.toBeInTheDocument();
    expect(screen.queryByText('98%')).not.toBeInTheDocument();
    expect(screen.queryByText('14')).not.toBeInTheDocument();
  });

  it('renders persisted reminder configuration and actual registration status', () => {
    render(<RemindersPanel read={reminderRead} />);

    expect(screen.getByText('Morning Grounding')).toBeVisible();
    expect(screen.getByText('08:00:00 · Asia/Jakarta · Web Push')).toBeVisible();
    expect(screen.getByText('Evening Reading')).toBeVisible();
    expect(screen.getByText('Needs browser permission')).toBeVisible();
    expect(screen.getByText('Disabled')).toBeVisible();
    expect(screen.getAllByText('Enabled')).toHaveLength(1);
    expect(screen.getByText(/Email reminders are opted in/i)).toBeVisible();
  });

  it('renders explicit empty and unavailable reminder states without sample habits', () => {
    render(
      <>
        <RemindersPanel read={emptyRead} />
        <RemindersPanel read={unavailableRead} />
      </>,
    );

    expect(screen.getByText('No reminder schedules configured yet.')).toBeVisible();
    expect(
      screen.getByText('Account data is temporarily unavailable. Please try again shortly.'),
    ).toBeVisible();
    expect(screen.queryByText('Morning Meditation')).not.toBeInTheDocument();
    expect(screen.queryByText('Hydration & Water')).not.toBeInTheDocument();
  });
});
