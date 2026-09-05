'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Repeat,
  ClipboardCheck,
  BarChart3,
  Bell,
  Settings,
  Award,
  Plus,
  Filter,
  Menu,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

import { routes } from '@/lib/navigation/route-definitions';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';
import { normalizeCreatedDate } from '@/domain/habits/habit-filters';

import { Button } from '@/components/ui/button';
import {
  AccountTierNotice,
  planTierLabel,
  useAccountState,
} from '@/components/account/account-state';
import { CreateHabitDialog } from '@/features/habits/create-habit-dialog';
import {
  addHabitToSync,
  getStoredHabits,
  getTodayDateStr,
  type StoredHabit,
} from '@/lib/storage/habits-sync';
import type { WeeklyOverviewRead } from '@/lib/repositories/product-repository';
import { getLocalWeekRange, type WeekStartDay } from '@/lib/dates/local-week';

const sidebarCollapsedStorageKey = 'recovery-first.sidebar-collapsed';
const DESIGN_REFERENCE_DATE = new Date('2026-01-15T10:00:00.000Z');

export interface DayOverview {
  day: string;
  fullDay: string;
  dateStr: string;
  completed: number;
  total: number;
  isToday?: boolean;
}

interface AppShellProps {
  children: React.ReactNode;
  onOpenCreateHabit?: () => void;
  showCreateHabitActions?: boolean;
  onOpenReflectionModal?: () => void;
  todayCompletedCount?: number;
  todayTotalCount?: number;
  weeklyOverview?: WeeklyOverviewRead;
  habitCountForDate?: (date: Date) => number;
  currentDate?: Date;
  reflectionNote?: string;
  weekStart?: WeekStartDay;
}

export function AppShell({
  children,
  onOpenCreateHabit,
  showCreateHabitActions = true,
  onOpenReflectionModal,
  todayCompletedCount = 0,
  todayTotalCount = 0,
  weeklyOverview,
  habitCountForDate,
  currentDate,
  reflectionNote,
  weekStart,
}: AppShellProps): React.JSX.Element {
  const pathname = usePathname();
  const account = useAccountState();
  const resolvedWeekStart = weekStart ?? account.weekStart ?? 1;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [storedHabits, setStoredHabits] = useState<StoredHabit[]>([]);
  const [resolvedCurrentDate, setResolvedCurrentDate] = useState(
    currentDate ?? DESIGN_REFERENCE_DATE,
  );

  useEffect(() => {
    const persisted = window.localStorage.getItem(sidebarCollapsedStorageKey) === 'true';
    if (persisted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (currentDate) return;

    const timeoutId = window.setTimeout(() => {
      setResolvedCurrentDate(new Date());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [currentDate]);

  useEffect(() => {
    const syncStoredHabits = () => {
      setStoredHabits(getStoredHabits());
    };

    syncStoredHabits();
    window.addEventListener('habits-updated', syncStoredHabits);
    window.addEventListener('storage', syncStoredHabits);

    return () => {
      window.removeEventListener('habits-updated', syncStoredHabits);
      window.removeEventListener('storage', syncStoredHabits);
    };
  }, []);

  const [collapseAnimationsEnabled, setCollapseAnimationsEnabled] = useState(false);
  const [fallbackCreateDialogOpen, setFallbackCreateDialogOpen] = useState(false);

  const handleAddHabitClick = () => {
    if (onOpenCreateHabit) {
      onOpenCreateHabit();
    } else {
      setFallbackCreateDialogOpen(true);
    }
  };

  function toggleSidebar(): void {
    setCollapseAnimationsEnabled(true);
    setSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue;
      window.localStorage.setItem(sidebarCollapsedStorageKey, String(nextValue));
      return nextValue;
    });
  }

  const collapseTransitionClass = collapseAnimationsEnabled
    ? 'transition-all duration-300 ease-in-out motion-reduce:transition-none'
    : 'transition-none';

  const [optimisticIndex, setOptimisticIndex] = useState<number | null>(null);

  const mainNavItems = [
    { label: 'Today', href: routes.today, icon: Calendar },
    { label: 'Habits', href: routes.habits, icon: Repeat },
    { label: 'Review', href: routes.review, icon: ClipboardCheck },
    { label: 'Insights', href: routes.insights, icon: BarChart3 },
    { label: 'Reminders', href: routes.reminders, icon: Bell },
    { label: 'Pro Plan', href: routes.pricing, icon: Award, isGold: true },
  ];

  const currentActiveIndex = mainNavItems.findIndex(
    (item) => pathname === item.href || (item.href === routes.today && pathname === routes.app),
  );

  const activeIndex = optimisticIndex !== null ? optimisticIndex : currentActiveIndex;

  // Build the seven displayed days from persisted counts when available.
  // Without remote data, show zeroes rather than fabricated sample activity.
  const refDate = currentDate ?? resolvedCurrentDate;
  const formatDateKey = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  };

  const getDateSpecificTotal = (targetDate: Date): number => {
    const currentDateKey = formatDateKey(refDate);
    const targetDateKey = formatDateKey(targetDate);

    const dateAdjustment = storedHabits.reduce((adjustment, habit) => {
      if (habit.status !== 'Active') return adjustment;

      const startDateKey = normalizeCreatedDate(habit.createdDate);
      if (!startDateKey) return adjustment;

      if (targetDateKey > currentDateKey) {
        return startDateKey > currentDateKey && startDateKey <= targetDateKey
          ? adjustment + 1
          : adjustment;
      }

      if (targetDateKey < currentDateKey) {
        return startDateKey > targetDateKey && startDateKey <= currentDateKey
          ? adjustment - 1
          : adjustment;
      }

      return adjustment;
    }, 0);

    return Math.max(0, todayTotalCount + dateAdjustment);
  };

  const fallbackRange = getLocalWeekRange(formatDateKey(refDate), resolvedWeekStart);

  const weeklyData: DayOverview[] = (weeklyOverview?.days ?? fallbackRange.dates).map(
    (entry, idx) => {
      const fallbackLocalDate = typeof entry === 'string' ? entry : entry.localDate;
      const fallbackTargetDate = new Date(`${fallbackLocalDate}T12:00:00`);
      const persistedDay = weeklyOverview?.days[idx];
      const localDate = persistedDay?.localDate ?? fallbackLocalDate;
      const isToday = weeklyOverview
        ? localDate === weeklyOverview.todayDate
        : localDate === formatDateKey(refDate);
      const displayDate = new Date(`${localDate}T00:00:00.000Z`);
      const fullDayName = displayDate.toLocaleDateString('en-US', {
        timeZone: 'UTC',
        weekday: 'long',
      });
      const shortDayName = displayDate
        .toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' })
        .slice(0, 1);
      const fullDay = isToday ? `${fullDayName} (Today)` : fullDayName;

      const [year, month, day] = localDate.split('-').map(Number);
      const dateStr = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const fallbackTotal = Math.max(
        0,
        habitCountForDate
          ? habitCountForDate(fallbackTargetDate)
          : getDateSpecificTotal(fallbackTargetDate),
      );
      const total = persistedDay?.totalCount ?? fallbackTotal;
      const completed =
        persistedDay?.completedCount ?? (isToday ? Math.min(todayCompletedCount, total) : 0);

      return {
        day: shortDayName,
        fullDay,
        dateStr,
        completed,
        total,
        isToday,
      };
    },
  );

  // Calculate total weekly completed sessions and total weekly goal
  const totalWeeklyCompleted = weeklyData.reduce((acc, curr) => acc + curr.completed, 0);
  const totalWeeklyGoal = weeklyData.reduce((acc, curr) => acc + curr.total, 0);
  const resiliencePercent = Math.round((totalWeeklyCompleted / Math.max(totalWeeklyGoal, 1)) * 100);

  return (
    <div className="min-h-screen bg-[var(--color-page)] text-[var(--color-text-primary)] antialiased">
      {/* Desktop Side Navigation */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 hidden h-screen flex-col overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:flex',
          collapseTransitionClass,
          sidebarCollapsed ? 'w-20' : 'w-64',
        )}
        data-collapsed={sidebarCollapsed}
        data-testid="application-sidebar"
      >
        <div className="flex h-full flex-col px-4 py-6">
          {/* User Profile & Subscription Header at Top */}
          <div className="relative mb-6 flex flex-col border-b border-[var(--color-border)] px-1 pb-4">
            <div className="flex items-center justify-between">
              <div
                aria-hidden={sidebarCollapsed}
                className={cn(
                  'flex items-center gap-3 overflow-hidden',
                  collapseTransitionClass,
                  sidebarCollapsed && 'mx-auto justify-center',
                )}
                data-testid="sidebar-user-summary"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-emerald-50)] font-bold text-[var(--color-primary)] shadow-xs">
                  <span className="text-sm font-bold">RF</span>
                </div>
                <div
                  className={cn(
                    'flex flex-col overflow-hidden whitespace-nowrap',
                    collapseTransitionClass,
                    sidebarCollapsed
                      ? 'pointer-events-none hidden'
                      : 'max-w-40 translate-x-0 opacity-100',
                  )}
                >
                  <h1 className="text-sm font-bold text-[var(--color-primary)]">
                    {account.displayName}
                  </h1>
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">
                    {planTierLabel(account.planTier)} Plan
                  </p>
                  <AccountTierNotice />
                </div>
              </div>

              {!sidebarCollapsed && (
                <button
                  aria-label="Collapse sidebar"
                  aria-pressed={false}
                  className="relative z-10 ml-auto flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)] focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-focus)_24%,transparent)] focus-visible:outline-none"
                  onClick={toggleSidebar}
                  title="Collapse sidebar"
                  type="button"
                >
                  <PanelLeftClose aria-hidden="true" className="size-5" />
                </button>
              )}
            </div>

            {sidebarCollapsed && (
              <button
                aria-label="Expand sidebar"
                aria-pressed={true}
                className="relative z-10 mx-auto mt-3 flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)] focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-focus)_24%,transparent)] focus-visible:outline-none"
                onClick={toggleSidebar}
                title="Expand sidebar"
                type="button"
              >
                <PanelLeftOpen aria-hidden="true" className="size-5" />
              </button>
            )}
          </div>

          {showCreateHabitActions && (
            <Button
              onClick={handleAddHabitClick}
              fullWidth={!sidebarCollapsed}
              size="touch"
              variant="primary"
              aria-label="Add Habit"
              title="Add Habit"
              className={cn(
                'flex h-11 items-center justify-center gap-2 overflow-hidden font-semibold whitespace-nowrap shadow-sm transition-all duration-200',
                collapseTransitionClass,
                sidebarCollapsed
                  ? 'mx-auto mb-3.5 size-11 rounded-xl px-0 hover:scale-105 active:scale-95'
                  : 'mb-6 w-full px-4',
              )}
            >
              <Plus className="size-5 shrink-0 text-white" />
              <span
                className={cn(
                  'inline-block overflow-hidden whitespace-nowrap',
                  collapseTransitionClass,
                  sidebarCollapsed
                    ? 'pointer-events-none hidden'
                    : 'max-w-32 translate-x-0 opacity-100',
                )}
              >
                Add Habit
              </span>
            </Button>
          )}

          {/* Main Navigation Links */}
          <nav aria-label="Application main navigation" className="relative flex-1 space-y-1.5">
            {activeIndex !== -1 && (
              <div
                aria-hidden="true"
                className="cubic-bezier(0.4, 0, 0.2, 1) pointer-events-none absolute right-0 left-0 z-0 h-11 rounded-xl border-r-4 border-[var(--color-primary)] bg-[var(--color-surface-subtle)] shadow-2xs transition-all duration-300 motion-reduce:transition-none"
                style={{
                  transform: `translateY(${activeIndex * 50}px)`,
                }}
              />
            )}
            {mainNavItems.map((item, idx) => {
              const isActive =
                pathname === item.href || (item.href === routes.today && pathname === routes.app);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOptimisticIndex(idx)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    'relative z-10 flex h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                    collapseTransitionClass,
                    sidebarCollapsed && 'justify-center gap-0 px-0',
                    isActive
                      ? 'animate-in fade-in slide-in-from-left-1 font-bold text-[var(--color-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]',
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={cn('size-5 shrink-0', item.isGold ? 'text-amber-500' : '')} />
                  <span
                    className={cn(
                      'inline-block overflow-hidden whitespace-nowrap',
                      collapseTransitionClass,
                      sidebarCollapsed
                        ? 'pointer-events-none hidden'
                        : 'max-w-40 translate-x-0 opacity-100',
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Footer Navigation Links (Settings) */}
          <div className="mt-auto space-y-1 border-t border-[var(--color-border)] pt-4">
            <Link
              href={routes.settings}
              aria-label={sidebarCollapsed ? 'Settings' : undefined}
              className={cn(
                'flex h-10 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium whitespace-nowrap text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-primary)]',
                collapseTransitionClass,
                sidebarCollapsed && 'justify-center gap-0 px-0',
              )}
              title={sidebarCollapsed ? 'Settings' : undefined}
            >
              <Settings className="size-5 shrink-0" />
              <span
                className={cn(
                  'inline-block overflow-hidden whitespace-nowrap',
                  collapseTransitionClass,
                  sidebarCollapsed
                    ? 'pointer-events-none hidden'
                    : 'max-w-40 translate-x-0 opacity-100',
                )}
              >
                Settings
              </span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 shadow-2xs lg:hidden">
        <h1 className="text-lg font-bold text-[var(--color-primary)]">RecoveryFirst</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            title="Filter habits"
          >
            <Filter className="size-5" />
          </button>
          {showCreateHabitActions && (
            <Button
              onClick={onOpenCreateHabit}
              size="compact"
              variant="primary"
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold shadow-xs"
            >
              <Plus className="size-3.5 shrink-0" />
              <span>Add Habit</span>
            </Button>
          )}
          <div className="flex size-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-emerald-50)] text-xs font-bold text-[var(--color-primary)]">
            A
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={cn(
          'w-full flex-1 pb-24 lg:pr-80 lg:pb-8',
          collapseTransitionClass,
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        <div key={pathname} className="animate-page-enter motion-reduce:animate-none">
          {children}
        </div>
      </main>

      {/* Desktop Right Side Rail (Weekly Overview & Reflection) */}
      <aside className="fixed top-0 right-0 z-40 hidden h-screen w-80 flex-col overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface)] lg:flex">
        <div className="flex h-full flex-col gap-8 p-6">
          {/* Weekly Overview */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Weekly Overview
              </h2>
              <span className="rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-emerald-50)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-primary)]">
                {totalWeeklyCompleted} Completed
              </span>
            </div>

            {/* Weekly Overview Table: Clean text format displaying Date, Day, and Total Habits */}
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xs">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]/70 text-[11px] font-semibold text-[var(--color-text-muted)]">
                    <th className="px-2.5 py-2 font-bold">Date</th>
                    <th className="px-2.5 py-2 font-bold">Day</th>
                    <th className="px-2.5 py-2 text-right font-bold">Total Habits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]/60">
                  {weeklyData.map((d, idx) => {
                    const isFullyCompleted = d.completed === d.total && d.completed > 0;
                    const isPartiallyCompleted = d.completed > 0;

                    return (
                      <tr
                        key={idx}
                        className={cn(
                          'transition-colors hover:bg-[var(--color-surface-subtle)]/50',
                          d.isToday ? 'bg-[var(--color-emerald-50)]/40 font-bold' : '',
                        )}
                      >
                        <td className="px-2.5 py-2 text-[11px] font-medium whitespace-nowrap text-[var(--color-text-secondary)]">
                          {d.dateStr}
                        </td>
                        <td className="px-2.5 py-2 text-[11px] whitespace-nowrap text-[var(--color-text-primary)]">
                          <span className="flex items-center gap-1.5">
                            {d.isToday && (
                              <span className="size-1.5 animate-pulse rounded-full bg-[var(--color-primary)]" />
                            )}
                            <span>{d.fullDay}</span>
                          </span>
                        </td>
                        <td className="px-2.5 py-2 text-right">
                          {isFullyCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-primary)]">
                              <Check className="size-3.5 stroke-[3] text-[var(--color-primary)]" />
                              <span>
                                {d.completed}/{d.total}
                              </span>
                            </span>
                          ) : isPartiallyCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)]">
                              <Check className="size-3 text-[var(--color-primary)]" />
                              <span>
                                {d.completed}/{d.total}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-normal text-[var(--color-text-muted)]">
                              0/{d.total}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-[var(--color-text-secondary)]">
                <span>Resilience Score</span>
                <span className="font-bold text-[var(--color-primary)]">
                  {resiliencePercent}% Active
                </span>
              </div>
              <div className="flex justify-between text-[var(--color-text-secondary)]">
                <span>Weekly Goal</span>
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {totalWeeklyCompleted} / {totalWeeklyGoal} Sessions
                </span>
              </div>
            </div>
          </div>

          {/* Daily Reflection Prompt */}
          <div className="mt-auto space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
              <span className="flex size-6 items-center justify-center rounded-md bg-[var(--color-emerald-50)] text-[var(--color-primary)]">
                ✍️
              </span>
              Daily Reflection
            </h3>
            <p className="text-xs leading-relaxed font-medium text-[var(--color-text-primary)] italic">
              Write about how you’re feeling today. This will help you improve in the future.
            </p>
            <Button
              size="compact"
              variant="secondary"
              fullWidth
              onClick={onOpenReflectionModal}
              className="text-xs font-semibold"
            >
              {reflectionNote ? 'Edit Reflection Note' : 'Add Reflection Note'}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className="fixed bottom-0 z-50 flex h-16 w-full items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-surface)] px-2 shadow-lg lg:hidden"
        data-testid="mobile-bottom-navigation"
      >
        {mainNavItems.slice(0, 4).map((item) => {
          const isActive =
            pathname === item.href || (item.href === routes.today && pathname === routes.app);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
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
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex scale-95 flex-col items-center justify-center px-3 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <Menu className="size-5" />
          <span className="mt-0.5 text-[11px]">More</span>
        </button>
      </nav>

      {/* Fallback Shared Create Habit Modal for All App Shell Pages */}
      {showCreateHabitActions && (
        <CreateHabitDialog
          open={fallbackCreateDialogOpen}
          onOpenChange={setFallbackCreateDialogOpen}
          onCreated={(data) => {
            addHabitToSync({
              id: `h-${Date.now()}`,
              name: data.name,
              category: data.category,
              normalTarget: data.normalTarget,
              minimumTarget: data.minimumTarget,
              schedule: `${data.category} (${data.timingContext})`,
              cue: data.timingContext,
              status: 'Active',
              createdDate: data.startDate || getTodayDateStr(),
              iconName: data.icon === 'water' ? '💧' : data.icon === 'reading' ? '📚' : '🧘‍♂️',
            });
            toast.success(`Habit "${data.name}" created successfully!`);
          }}
        />
      )}
    </div>
  );
}
