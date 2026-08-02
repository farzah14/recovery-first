import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Sidebar } from '@/components/navigation/sidebar';
import { AppShell } from '@/components/layout/app-shell';

vi.mock('next/navigation', () => ({ usePathname: () => '/app/today' }));

afterEach(() => {
  window.localStorage.clear();
});

describe('desktop sidebar', () => {
  it('renders application navigation items and supports collapse state', async () => {
    const user = userEvent.setup();
    render(<Sidebar currentPath="/app/today" />);

    expect(screen.getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Habits' })).toBeVisible();

    const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i });
    await user.click(collapseButton);

    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeVisible();
  });

  it('collapses the sidebar used by the application shell and keeps Add Habit button visible', async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <div>Today content</div>
      </AppShell>,
    );

    const sidebar = screen.getByTestId('application-sidebar');
    // Verify Add Habit button is present in sidebar before collapse
    expect(within(sidebar).getByRole('button', { name: 'Add Habit' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    await waitFor(() => {
      expect(sidebar).toHaveAttribute('data-collapsed', 'true');
      expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
      // Add Habit icon button should remain visible and accessible in sidebar via aria-label
      expect(within(sidebar).getByRole('button', { name: 'Add Habit' })).toBeVisible();
    });
  });

  it('animates the selected navigation background when a section opens', () => {
    render(
      <AppShell>
        <div>Today content</div>
      </AppShell>,
    );

    const navigation = screen.getByRole('navigation', { name: 'Application main navigation' });
    expect(within(navigation).getByRole('link', { name: 'Today' })).toHaveClass(
      'animate-in',
      'fade-in',
      'slide-in-from-left-1',
    );
  });

  it('keeps the sidebar minimized after the application shell is mounted for another page', async () => {
    const user = userEvent.setup();
    const view = render(
      <AppShell>
        <div>Today content</div>
      </AppShell>,
    );

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(screen.getByTestId('sidebar-user-summary')).toHaveAttribute('aria-hidden', 'true');

    view.unmount();
    render(
      <AppShell>
        <div>Habits content</div>
      </AppShell>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('application-sidebar')).toHaveAttribute('data-collapsed', 'true');
      expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
    });
  });

  it('restores the sidebar without animating during a navigation remount', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('recovery-first.sidebar-collapsed', 'true');

    render(
      <AppShell>
        <div>Habits content</div>
      </AppShell>,
    );

    await waitFor(() => {
      const sidebar = screen.getByTestId('application-sidebar');
      expect(sidebar).toHaveAttribute('data-collapsed', 'true');
      expect(sidebar).toHaveClass('transition-none');
    });

    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));

    const sidebar = screen.getByTestId('application-sidebar');
    expect(sidebar).toHaveAttribute('data-collapsed', 'false');
    expect(sidebar).toHaveClass('transition-all');
  });

  it('hydrates without a mismatch when a persisted collapsed state exists', async () => {
    window.localStorage.clear();
    const serverMarkup = renderToString(
      <AppShell>
        <div>Today content</div>
      </AppShell>,
    );
    const container = document.createElement('div');
    container.innerHTML = serverMarkup;
    document.body.appendChild(container);
    window.localStorage.setItem('recovery-first.sidebar-collapsed', 'true');

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const root = hydrateRoot(
      container,
      <AppShell>
        <div>Today content</div>
      </AppShell>,
    );

    try {
      await waitFor(() => {
        expect(container.querySelector('[data-testid="application-sidebar"]')).toHaveAttribute(
          'data-collapsed',
          'true',
        );
      });

      await act(async () => undefined);
      expect(consoleError.mock.calls.flat().join(' ')).not.toContain('Hydration failed');
    } finally {
      root.unmount();
      consoleError.mockRestore();
      container.remove();
    }
  });
});
