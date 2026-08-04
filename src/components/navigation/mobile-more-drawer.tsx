'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Settings, HelpCircle, User, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { routes } from '@/lib/navigation/route-definitions';
import { planTierLabel, useAccountState } from '@/components/account/account-state';

interface MobileMoreDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function MobileMoreDrawer({ open, onOpenChange }: MobileMoreDrawerProps): React.JSX.Element {
  const account = useAccountState();
  const tierLabel = planTierLabel(account.planTier);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="space-y-4 rounded-t-2xl bg-[var(--color-surface)] p-6">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div>
            <SheetTitle className="text-base font-bold text-[var(--color-text-primary)]">
              More Options
            </SheetTitle>
            <SheetDescription className="text-xs text-[var(--color-text-muted)]">
              Reminders, Settings, and Account Context
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            aria-label="Close drawer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-2 pt-1">
          <Link
            href={routes.reminders}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-3 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
          >
            <Bell className="size-5 text-[var(--color-primary)]" />
            <span>Reminders & Alerts</span>
          </Link>
          <Link
            href={routes.settings}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-3 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
          >
            <Settings className="size-5 text-[var(--color-primary)]" />
            <span>Settings & Preferences</span>
          </Link>
          <Link
            href={routes.help}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-3 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
          >
            <HelpCircle className="size-5 text-[var(--color-primary)]" />
            <span>Help & Recovery Guide</span>
          </Link>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 text-xs">
            <User className="size-5 shrink-0 text-[var(--color-primary)]" />
            <div>
              <p className="font-bold text-[var(--color-text-primary)]">{account.displayName}</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {tierLabel} Plan · Account data is securely synced
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
