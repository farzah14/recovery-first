import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '@/components/feedback/empty-state';
import { OfflineState } from '@/components/feedback/offline-state';
import { StatusBadge } from '@/components/data-display/status-badge';

describe('system states', () => {
  it('uses explicit text for status meaning', () => {
    render(
      <>
        <StatusBadge status="minimum" />
        <EmptyState actionLabel="Add a habit" description="Create your first habit." title="No habits yet" />
        <OfflineState />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Add a habit' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'You are offline' })).toBeVisible();
  });
});
