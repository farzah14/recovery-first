'use client';

import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';

import { AccountStateContext, useAccountState } from '@/components/account/account-state';
import { detectDeviceTimezone, detectWeekStart } from '@/lib/dates/device-time';

type DeviceSettings = {
  timezone: string;
  weekStart: number;
};

let cachedDeviceSettings: DeviceSettings | null = null;

export function resetDeviceSettingsCache(): void {
  cachedDeviceSettings = null;
}

function readDeviceSettings(): DeviceSettings {
  if (!cachedDeviceSettings) {
    cachedDeviceSettings = {
      timezone: detectDeviceTimezone(),
      weekStart: detectWeekStart(),
    };
  }
  return cachedDeviceSettings;
}

function subscribeToDeviceSettings(): () => void {
  return () => undefined;
}

export function DeviceTimeSync({ children }: { children: ReactNode }): React.JSX.Element {
  const account = useAccountState();
  const serverSettings = useMemo(
    () => ({ timezone: account.timezone ?? 'UTC', weekStart: account.weekStart ?? 1 }),
    [account.timezone, account.weekStart],
  );
  const deviceSettings = useSyncExternalStore(
    subscribeToDeviceSettings,
    readDeviceSettings,
    () => serverSettings,
  );

  useEffect(() => {
    const accountId = account.accountId;
    if (!accountId) return;
    if (
      deviceSettings.timezone === account.timezone &&
      deviceSettings.weekStart === account.weekStart
    ) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser');
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase
          .from('profiles')
          .update({ timezone: deviceSettings.timezone, week_start: deviceSettings.weekStart })
          .eq('id', accountId);
        if (error || cancelled) return;
      } catch {
        // Best-effort background sync; the device settings still apply for this session.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account.accountId, account.timezone, account.weekStart, deviceSettings]);

  return (
    <AccountStateContext.Provider
      value={{ ...account, timezone: deviceSettings.timezone, weekStart: deviceSettings.weekStart }}
    >
      {children}
    </AccountStateContext.Provider>
  );
}
