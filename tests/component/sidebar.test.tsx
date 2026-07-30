import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Sidebar } from '@/components/navigation/sidebar';

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
});
