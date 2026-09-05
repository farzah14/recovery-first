import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InsightsPanel, ReviewPanel } from '@/components/account/account-data-panels';
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
});
