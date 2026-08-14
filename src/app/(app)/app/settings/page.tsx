'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { AccountTierSummary, useAccountState } from '@/components/account/account-state';
import { Settings, User, Shield, CreditCard, Globe } from 'lucide-react';
import { routes } from '@/lib/navigation/route-definitions';
import { Button } from '@/components/ui/button';

export default function SettingsPage(): React.JSX.Element {
  const account = useAccountState();
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)]">
              <Settings className="size-4" />
              <span>Preferences & Account</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
              Account Settings
            </h1>
            <p className="mt-1 text-xs text-[var(--color-text-muted)] sm:text-sm">
              Manage your account preferences, local data, and privacy settings.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <User className="size-5 text-[var(--color-primary)]" />
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Profile Information
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  <AccountTierSummary />
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
              <Globe className="size-4 shrink-0 text-[var(--color-text-secondary)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Time zone: {account.timezone ?? 'UTC'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Detected automatically from this device&apos;s settings.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="size-5 text-[var(--color-primary)]" />
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Subscription & Billing
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Review verified access or manage payment details.
                </p>
              </div>
            </div>
            <Button asChild size="compact" variant="secondary">
              <Link href={routes.subscriptionSettings}>Open subscription settings</Link>
            </Button>
          </div>

          <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-[var(--color-primary)]" />
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Privacy & Data Security
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  All habit details are stored locally on your device with Recovery First
                  encryption.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
