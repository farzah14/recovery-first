'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';

import { IconButton } from '@/components/ui/icon-button';
import { Button } from '@/components/ui/button';
import { applicationNavigation, routes } from '@/lib/navigation/route-definitions';
import { cn } from '@/lib/cn';

export function Sidebar({
  currentPath,
  onOpenCreateHabit,
}: Readonly<{ currentPath: string; onOpenCreateHabit?: () => void }>): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-300 ease-in-out lg:flex lg:flex-col',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      <div className="flex h-16 items-center justify-between overflow-hidden border-b border-[var(--color-border)] px-4">
        <Link
          className={cn(
            'inline-block overflow-hidden font-semibold whitespace-nowrap text-[var(--color-emerald-800)] transition-all duration-300 ease-in-out',
            collapsed ? 'pointer-events-none hidden' : 'max-w-48 translate-x-0 opacity-100',
          )}
          href={routes.today}
        >
          Recovery First
        </Link>
        <IconButton
          label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed((value) => !value)}
          className={cn('shrink-0', collapsed && 'mx-auto')}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden="true" className="size-5" />
          ) : (
            <PanelLeftClose aria-hidden="true" className="size-5" />
          )}
        </IconButton>
      </div>

      <div className="p-3 pb-0">
        <Button
          onClick={onOpenCreateHabit}
          fullWidth={!collapsed}
          size="touch"
          variant="primary"
          aria-label="Add Habit"
          title="Add Habit"
          className={cn(
            'flex h-11 items-center justify-center gap-2 overflow-hidden font-semibold whitespace-nowrap shadow-sm transition-all duration-200',
            collapsed
              ? 'mx-auto size-11 rounded-xl px-0 hover:scale-105 active:scale-95'
              : 'w-full px-4',
          )}
        >
          <Plus className="size-5 shrink-0 text-white" />
          <span
            className={cn(
              'inline-block overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
              collapsed ? 'pointer-events-none hidden' : 'max-w-32 translate-x-0 opacity-100',
            )}
          >
            Add Habit
          </span>
        </Button>
      </div>

      <nav aria-label="Application navigation" className="flex-1 space-y-1 p-3">
        {applicationNavigation.map((item) => {
          const active = currentPath === item.href;
          const Icon = item.icon;
          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-11 items-center gap-3 overflow-hidden rounded-[var(--radius-md)] px-3 text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out',
                collapsed && 'justify-center gap-0 px-0',
                active
                  ? 'bg-[var(--color-surface-selected)] font-semibold text-[var(--color-focus)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]',
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              <span
                className={cn(
                  'inline-block overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
                  collapsed ? 'pointer-events-none hidden' : 'max-w-40 translate-x-0 opacity-100',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
