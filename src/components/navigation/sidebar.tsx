'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { IconButton } from '@/components/ui/icon-button';
import { applicationNavigation, routes } from '@/lib/navigation/route-definitions';
import { cn } from '@/lib/cn';

export function Sidebar({ currentPath }: Readonly<{ currentPath: string }>): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-[var(--motion-standard)] lg:flex lg:flex-col',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      <div className="flex min-h-16 items-center justify-between px-4 border-b border-[var(--color-border)]">
        {!collapsed ? (
          <Link className="font-semibold text-[var(--color-emerald-800)]" href={routes.today}>
            Recovery First
          </Link>
        ) : null}
        <IconButton
          label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <PanelLeftOpen aria-hidden="true" className="size-5" /> : <PanelLeftClose aria-hidden="true" className="size-5" />}
        </IconButton>
      </div>

      <nav aria-label="Application navigation" className="flex-1 space-y-1 p-3">
        {applicationNavigation.map((item) => {
          const active = currentPath === item.href;
          const Icon = item.icon;
          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors',
                active
                  ? 'bg-[var(--color-surface-selected)] text-[var(--color-focus)] font-semibold'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]',
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
