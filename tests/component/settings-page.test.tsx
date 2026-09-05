import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SettingsPage from '@/app/(app)/app/settings/page';

vi.mock('next/navigation', () => ({ usePathname: () => '/app/settings' }));

afterEach(() => {
  window.localStorage.clear();
});

describe('settings privacy description', () => {
  it('describes account-backed and browser-local storage without claiming app encryption', () => {
    render(<SettingsPage />);

    expect(screen.getByText(/signed-in habit details sync to Supabase/i)).toBeVisible();
    expect(screen.getByText(/browser-local records remain on this device/i)).toBeVisible();
    expect(screen.getByText(/not encrypted by the application/i)).toBeVisible();
    expect(screen.queryByText(/all habit details are stored locally/i)).not.toBeInTheDocument();
  });
});
