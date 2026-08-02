import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from '@/components/layout/app-shell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/app/today',
  useRouter: () => ({ push: vi.fn() }),
}));

describe('AppShell Accessibility', () => {
  it('exposes landmark roles for main navigation and content', () => {
    render(
      <AppShell>
        <div>Page Content</div>
      </AppShell>,
    );

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeVisible();
    expect(screen.getByRole('main')).toBeVisible();
  });
});
