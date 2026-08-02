'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Repeat, ClipboardCheck, BarChart3, MoreHorizontal } from 'lucide-react';
import { routes } from '@/lib/navigation/route-definitions';
import { cn } from '@/lib/cn';

interface MobileBottomNavigationProps {
  readonly onOpenMoreDrawer?: () => void;
}

export function MobileBottomNavigation({
  onOpenMoreDrawer,
}: MobileBottomNavigationProps): React.JSX.Element {
  const pathname = usePathname();

  const navItems = [
    { label: 'Today', href: routes.today, icon: Calendar },
    { label: 'Habits', href: routes.habits, icon: Repeat },
    { label: 'Review', href: routes.review, icon: ClipboardCheck },
    { label: 'Insights', href: routes.insights, icon: BarChart3 },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed right-0 bottom-0 left-0 z-40 flex h-16 items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-surface)] px-2 shadow-lg md:hidden"
    >
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || (item.href === routes.today && pathname === routes.app);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center rounded-xl px-3 py-1 transition-all duration-150',
              isActive
                ? 'animate-in fade-in slide-in-from-bottom-1 scale-100 bg-[var(--color-emerald-50)] font-bold text-[var(--color-primary)] duration-200 motion-reduce:animate-none'
                : 'scale-95 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
            )}
          >
            <Icon className="size-5" />
            <span className="mt-0.5 text-[11px]">{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onOpenMoreDrawer}
        className="flex scale-95 flex-col items-center justify-center px-3 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      >
        <MoreHorizontal className="size-5" />
        <span className="mt-0.5 text-[11px]">More</span>
      </button>
    </nav>
  );
}
