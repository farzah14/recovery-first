import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AccountStateProvider } from '@/components/account/account-state';
import { TodayPageClient } from '@/features/today/components/today-page-client';
import type { TodayReadModel } from '@/features/today/today-types';
import type { ProductRepository } from '@/lib/repositories/product-repository';

const { createClientProductRepository } = vi.hoisted(() => ({
  createClientProductRepository: vi.fn(),
}));

vi.mock('@/lib/repositories/client-product-repository', () => ({
  createClientProductRepository,
}));

const readModel: TodayReadModel = {
  localDate: '2026-08-03',
  sessions: [],
  activeHabitCount: 0,
  activeHabitLimit: 10,
  successfulCount: 0,
  minimumCount: 0,
  remainingCount: 0,
  emptyState: 'no_habits',
};

describe('authenticated Today wiring', () => {
  it('passes the server account identity to the Supabase repository boundary', async () => {
    const repository = {} as ProductRepository;
    createClientProductRepository.mockReturnValue({ repository, dispose: vi.fn() });

    render(
      <AccountStateProvider
        account={{
          id: '00000000-0000-4000-8000-000000000001',
          displayName: 'Ari',
          planTier: 'lite',
          timezone: 'Asia/Jakarta',
        }}
      >
        <TodayPageClient initialReadModel={readModel} />
      </AccountStateProvider>,
    );

    await waitFor(() => expect(createClientProductRepository).toHaveBeenCalled());
    expect(createClientProductRepository).toHaveBeenCalledWith({
      ownerId: '00000000-0000-4000-8000-000000000001',
      identityMode: 'account',
      planTier: 'lite',
      timezone: 'Asia/Jakarta',
    });
    expect(screen.getByText('Account mode · synced with Supabase')).toBeInTheDocument();
  });
});
