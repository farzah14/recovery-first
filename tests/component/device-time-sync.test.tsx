import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AccountStateProvider, useAccountState } from '@/components/account/account-state';
import { DeviceTimeSync, resetDeviceSettingsCache } from '@/components/account/device-time-sync';

const updateMock = vi.fn();

vi.mock('@/lib/supabase/browser', () => ({
  createSupabaseBrowserClient: () => ({
    from: () => ({
      update: updateMock,
    }),
  }),
}));

function Probe(): React.JSX.Element {
  const account = useAccountState();
  return (
    <div>
      <span data-testid="timezone">{account.timezone}</span>
      <span data-testid="week-start">{account.weekStart}</span>
    </div>
  );
}

describe('DeviceTimeSync', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetDeviceSettingsCache();
    updateMock.mockReset();
  });

  function stubDevice(dateTimeZone: string, localeWeekStart: number): void {
    vi.stubGlobal('Intl', {
      DateTimeFormat: class {
        resolvedOptions(): { timeZone: string } {
          return { timeZone: dateTimeZone };
        }
      },
      Locale: class {
        weekInfo = { firstDay: localeWeekStart };
      },
    });
    vi.stubGlobal('navigator', { language: 'en-US' });
  }

  it('overrides the account state with the device timezone and week start', () => {
    stubDevice('Asia/Jakarta', 7);
    render(
      <AccountStateProvider
        account={{
          accountId: 'user-1',
          displayName: 'Ada',
          planTier: 'free',
          timezone: 'UTC',
          weekStart: 1,
        }}
      >
        <DeviceTimeSync>
          <Probe />
        </DeviceTimeSync>
      </AccountStateProvider>,
    );

    expect(screen.getByTestId('timezone')).toHaveTextContent('Asia/Jakarta');
    expect(screen.getByTestId('week-start')).toHaveTextContent('7');
  });

  it('persists the detected device settings when they differ from the stored profile', async () => {
    stubDevice('Asia/Jakarta', 7);
    updateMock.mockReturnValue({ eq: () => Promise.resolve({ error: null }) });

    render(
      <AccountStateProvider
        account={{
          accountId: 'user-1',
          displayName: 'Ada',
          planTier: 'free',
          timezone: 'UTC',
          weekStart: 1,
        }}
      >
        <DeviceTimeSync>
          <Probe />
        </DeviceTimeSync>
      </AccountStateProvider>,
    );

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledTimes(1);
    });
    expect(updateMock).toHaveBeenCalledWith({ timezone: 'Asia/Jakarta', week_start: 7 });
  });

  it('does not write to the profile when the device already matches the stored settings', async () => {
    stubDevice('UTC', 1);
    updateMock.mockReturnValue({ eq: () => Promise.resolve({ error: null }) });

    render(
      <AccountStateProvider
        account={{
          accountId: 'user-1',
          displayName: 'Ada',
          planTier: 'free',
          timezone: 'UTC',
          weekStart: 1,
        }}
      >
        <DeviceTimeSync>
          <Probe />
        </DeviceTimeSync>
      </AccountStateProvider>,
    );

    await waitFor(() => {
      expect(updateMock).not.toHaveBeenCalled();
    });
  });

  it('never writes when the account id is missing', async () => {
    stubDevice('Asia/Jakarta', 7);
    updateMock.mockReturnValue({ eq: () => Promise.resolve({ error: null }) });

    render(
      <AccountStateProvider
        account={{ displayName: 'Ada', planTier: 'free', timezone: 'UTC', weekStart: 1 }}
      >
        <DeviceTimeSync>
          <Probe />
        </DeviceTimeSync>
      </AccountStateProvider>,
    );

    await waitFor(() => {
      expect(updateMock).not.toHaveBeenCalled();
    });
  });
});
