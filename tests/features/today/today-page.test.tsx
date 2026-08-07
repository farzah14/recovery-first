import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TodayPageClient } from '@/features/today/components/today-page-client';
import type { TodayReadModel } from '@/features/today/today-types';

function read(overrides: Partial<TodayReadModel> = {}): TodayReadModel {
  return {
    localDate: '2026-08-03',
    sessions: [],
    activeHabitCount: 0,
    activeHabitLimit: 3,
    successfulCount: 0,
    minimumCount: 0,
    remainingCount: 0,
    emptyState: 'no_habits',
    ...overrides,
  };
}

describe('TodayPageClient', () => {
  it('links the no-habits state to the creation wizard', () => {
    render(<TodayPageClient initialReadModel={read()} />);
    expect(screen.getByRole('link', { name: 'Create your first habit' })).toHaveAttribute(
      'href',
      '/app/habits/new',
    );
  });

  it('reports the next session when there are no eligible sessions today', () => {
    render(
      <TodayPageClient
        initialReadModel={read({
          emptyState: 'no_eligible_sessions',
          activeHabitCount: 1,
        })}
        nextSession={{ title: 'Walk', localDate: '2026-08-04' }}
      />,
    );
    expect(screen.getByText(/next session.*Walk/i)).toBeInTheDocument();
  });

  it('explains that Full and Minimum both support continuity when all are recorded', () => {
    render(
      <TodayPageClient
        initialReadModel={read({
          emptyState: 'all_recorded',
          activeHabitCount: 1,
          successfulCount: 2,
        })}
      />,
    );
    expect(screen.getByText('Full and Minimum both support continuity.')).toBeInTheDocument();
  });
});
