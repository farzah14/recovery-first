'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Info,
  Check,
  Leaf,
  Minus,
  Sparkles,
  ArrowRight,
  BookOpen,
  Droplets,
  HeartPulse,
  RotateCcw,
  ShieldCheck,
  Pencil,
  Trash2,
  Dumbbell,
  Footprints,
  Moon,
  Code,
  Apple,
  Target,
  Flame,
  Coffee,
  Music,
  Zap,
  Clock,
  CheckCircle2,
  Users,
} from 'lucide-react';

import { useAccountState } from '@/components/account/account-state';
import { AppShell } from '@/components/layout/app-shell';
import { CreateHabitDialog, type CreateHabitFormData } from '@/features/habits/create-habit-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import {
  addHabitToSync,
  archiveHabitToSync,
  getLibraryHabitCountForDate,
  getLibraryHabits,
  isTodayDate,
  getTodayDateStr,
  updateHabitToSync,
  type StoredHabit,
} from '@/lib/storage/habits-sync';
import {
  createBrowserProductRepository,
  getBrowserProductOwner,
} from '@/lib/repositories/signed-in/browser-product-repository';
import {
  buildCreateHabitCommand,
  buildHabitVersionCommand,
} from '@/lib/repositories/habit-command-builders';
import { getLocalDateForTimezone, getLocalWeekRange } from '@/lib/dates/local-week';
import type { WeeklyOverviewRead } from '@/lib/repositories/product-repository';
import { mapSessionToTodayHabit } from '@/features/today/today-repository-mappers';
import { DEFAULT_HABITS } from '@/domain/habits/default-habits';

export type OutcomeType = 'unrecorded' | 'full' | 'minimum' | 'skipped';

export interface HabitSession {
  id: string;
  habitId?: string;
  habitVersionId?: string;
  currentVersionId?: string | null;
  habitRevision?: number;
  sessionRevision?: number;
  name: string;
  category: string;
  timingContext: string;
  minimumSummary: string;
  fullSummary: string;
  outcome: OutcomeType;
  needsReview?: boolean;
  recoveryAvailable?: boolean;
  icon: string;
}

function getTodayIcon(iconName: string): string {
  const normalized = iconName.toLowerCase();
  if (normalized === 'water' || normalized.includes('💧') || normalized.includes('water')) {
    return 'water';
  }
  if (normalized === 'reading' || normalized.includes('📚') || normalized.includes('book')) {
    return 'reading';
  }
  if (normalized === 'exercise' || normalized.includes('dumbbell')) return 'exercise';
  if (normalized === 'running' || normalized.includes('foot')) return 'running';
  if (normalized === 'sleep' || normalized.includes('moon')) return 'sleep';
  if (normalized === 'coding' || normalized.includes('code')) return 'coding';
  if (normalized === 'writing' || normalized.includes('pencil')) return 'writing';
  if (normalized === 'nutrition' || normalized.includes('apple')) return 'nutrition';
  return normalized || 'meditation';
}

function toHabitSession(record: StoredHabit, previous?: HabitSession): HabitSession {
  return {
    id: record.id,
    name: record.name,
    category: record.category,
    timingContext: record.timingContext || record.schedule || '08:00 AM - 09:00 AM',
    minimumSummary: record.minimumTarget.startsWith('Minimum')
      ? record.minimumTarget
      : `Minimum ${record.minimumTarget}`,
    fullSummary: record.normalTarget.startsWith('Full')
      ? record.normalTarget
      : `Full ${record.normalTarget}`,
    outcome: previous?.outcome ?? 'unrecorded',
    needsReview: previous?.needsReview ?? record.id === 'h1',
    recoveryAvailable: previous?.recoveryAvailable ?? record.id === 'h1',
    icon: getTodayIcon(record.iconName),
  };
}

function getTodayHabitSessions(
  records: ReadonlyArray<StoredHabit>,
  existing: ReadonlyArray<HabitSession> = [],
): HabitSession[] {
  const existingById = new Map(existing.map((h) => [h.id, h]));
  return records
    .filter((record) => record.status === 'Active' && isTodayDate(record.createdDate))
    .map((record) => toHabitSession(record, existingById.get(record.id)));
}

export const CLOCK_PRESETS = [
  { label: '07:00 AM - 08:00 AM', from: '07:00', until: '08:00' },
  { label: '11:00 AM - 12:00 PM', from: '11:00', until: '12:00' },
  { label: '05:00 PM - 06:00 PM', from: '17:00', until: '18:00' },
];

export function formatTimeToAmPm(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24;
  const parts = time24.split(':');
  const hStr = parts[0];
  const mStr = parts[1];
  if (!hStr) return time24;
  let h = parseInt(hStr, 10);
  const m = mStr ? mStr.substring(0, 2).padStart(2, '0') : '00';
  if (isNaN(h)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const formattedH = h < 10 ? `0${h}` : `${h}`;
  return `${formattedH}:${m} ${period}`;
}

export function formatTimeRange(from24: string, until24: string): string {
  return `${formatTimeToAmPm(from24)} - ${formatTimeToAmPm(until24)}`;
}

function convertMatchTo24(match: RegExpMatchArray): string {
  const hRaw = match[1];
  const mRaw = match[2];
  const periodRaw = match[3];
  if (!hRaw || !mRaw || !periodRaw) return '08:00';
  let h = parseInt(hRaw, 10);
  const m = mRaw;
  const period = periodRaw.toUpperCase();
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  return `${hStr}:${m}`;
}

function addOneHour24(time24: string): string {
  const parts = time24.split(':');
  if (parts.length < 2 || !parts[0] || !parts[1]) return '09:00';
  const h = (parseInt(parts[0], 10) + 1) % 24;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  return `${hStr}:${parts[1]}`;
}

export function extractTimeRange24FromContext(context: string): { from: string; until: string } {
  if (!context) return { from: '08:00', until: '09:00' };
  const matches = [...context.matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi)];
  if (matches.length >= 2 && matches[0] && matches[1]) {
    return {
      from: convertMatchTo24(matches[0]),
      until: convertMatchTo24(matches[1]),
    };
  } else if (matches.length === 1 && matches[0]) {
    const fromStr = convertMatchTo24(matches[0]);
    return { from: fromStr, until: addOneHour24(fromStr) };
  }
  return { from: '08:00', until: '09:00' };
}

export function extractTime24FromContext(context: string): string {
  return extractTimeRange24FromContext(context).from;
}

export function sortHabitSessionsByStartTime(sessions: HabitSession[]): HabitSession[] {
  return [...sessions].sort((a, b) => {
    const aTime = extractTime24FromContext(a.timingContext);
    const bTime = extractTime24FromContext(b.timingContext);
    if (aTime < bTime) return -1;
    if (aTime > bTime) return 1;
    return 0;
  });
}

export const ICON_OPTIONS = [
  { id: 'meditation', label: 'Meditation', Icon: HeartPulse },
  { id: 'water', label: 'Water', Icon: Droplets },
  { id: 'reading', label: 'Reading', Icon: BookOpen },
  { id: 'exercise', label: 'Exercise', Icon: Dumbbell },
  { id: 'running', label: 'Running', Icon: Footprints },
  { id: 'sleep', label: 'Sleep', Icon: Moon },
  { id: 'coding', label: 'Coding', Icon: Code },
  { id: 'writing', label: 'Writing', Icon: Pencil },
  { id: 'nutrition', label: 'Nutrition', Icon: Apple },
  { id: 'target', label: 'Target', Icon: Target },
  { id: 'flame', label: 'Energy', Icon: Flame },
  { id: 'coffee', label: 'Coffee', Icon: Coffee },
  { id: 'music', label: 'Music', Icon: Music },
  { id: 'zap', label: 'Power', Icon: Zap },
];

export const CATEGORY_OPTIONS = [
  { id: 'mindfulness', label: 'Mindfulness', Icon: Sparkles },
  { id: 'health', label: 'Health', Icon: Dumbbell },
  { id: 'learning', label: 'Learning', Icon: BookOpen },
  { id: 'creativity', label: 'Creativity', Icon: Pencil },
  { id: 'social', label: 'Social', Icon: Users },
  { id: 'other', label: 'Other', Icon: Target },
];

export function renderHabitIcon(iconId?: string): React.JSX.Element {
  switch (iconId) {
    case 'meditation':
    case 'heart':
      return <HeartPulse className="size-6" />;
    case 'water':
    case 'droplets':
      return <Droplets className="size-6" />;
    case 'reading':
    case 'book':
      return <BookOpen className="size-6" />;
    case 'exercise':
    case 'dumbbell':
      return <Dumbbell className="size-6" />;
    case 'running':
    case 'footprints':
      return <Footprints className="size-6" />;
    case 'sleep':
    case 'moon':
      return <Moon className="size-6" />;
    case 'coding':
    case 'code':
      return <Code className="size-6" />;
    case 'writing':
    case 'pencil':
      return <Pencil className="size-6" />;
    case 'nutrition':
    case 'apple':
      return <Apple className="size-6" />;
    case 'target':
    case 'bullseye':
      return <Target className="size-6" />;
    case 'flame':
      return <Flame className="size-6" />;
    case 'coffee':
      return <Coffee className="size-6" />;
    case 'music':
      return <Music className="size-6" />;
    case 'zap':
      return <Zap className="size-6" />;
    default:
      return <HeartPulse className="size-6" />;
  }
}

const DESIGN_REFERENCE_DATE = new Date('2026-01-15T10:00:00.000Z');

function createCommandId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `today-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function getDynamicGreeting(
  now: Date = new Date(),
  name: string = 'Alex',
): { greeting: string; dateString: string } {
  const hour = now.getHours();

  let salutation = 'Good morning';
  if (hour >= 12 && hour < 17) {
    salutation = 'Good afternoon';
  } else if (hour >= 17 || hour < 5) {
    salutation = 'Good evening';
  }

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return { greeting: `${salutation}, ${name}.`, dateString: formattedDate };
}

export function TodayDashboard(): React.JSX.Element {
  const account = useAccountState();
  const owner = React.useMemo(() => getBrowserProductOwner(account), [account]);
  const repository = React.useMemo(() => createBrowserProductRepository(account), [account]);
  const [dashboardDate, setDashboardDate] = useState(DESIGN_REFERENCE_DATE);
  const [habits, setHabits] = useState<HabitSession[]>(() => getTodayHabitSessions(DEFAULT_HABITS));

  const [remoteDataReady, setRemoteDataReady] = useState(!repository || !owner);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [weeklyOverview, setWeeklyOverview] = useState<WeeklyOverviewRead | null>(null);

  const reloadRemoteToday = React.useCallback(async () => {
    if (!repository || !owner) {
      setWeeklyOverview(null);
      setRemoteDataReady(true);
      return;
    }
    const localDate = getLocalDateForTimezone(owner.timezone);
    try {
      setRemoteDataReady(false);
      setRemoteError(null);
      const weekRange = getLocalWeekRange(localDate);
      await repository.resolveExpiredUnrecorded(owner, new Date().toISOString());
      await repository.ensureSessionHorizon(owner, weekRange.endDate);
      const [today, overview] = await Promise.all([
        repository.getToday(owner, localDate),
        repository.getWeeklyOverview(owner, localDate),
      ]);
      setHabits(
        today.sessions.map((session) => {
          const mapped = mapSessionToTodayHabit(session);
          return {
            ...mapped,
            outcome: mapped.outcome as OutcomeType,
          };
        }),
      );
      setWeeklyOverview(overview);
      setRemoteDataReady(true);
    } catch (error) {
      setRemoteDataReady(false);
      setWeeklyOverview(null);
      setRemoteError(
        error instanceof Error ? error.message : 'Unable to load today from Supabase.',
      );
    }
  }, [owner, repository]);

  // Rebuild Today from Supabase for signed-in users and from local library records otherwise.
  React.useEffect(() => {
    if (repository && owner) {
      const loadTimer = window.setTimeout(() => {
        void reloadRemoteToday();
      }, 0);
      return () => window.clearTimeout(loadTimer);
    }

    const syncFromLibrary = () => {
      const libraryHabits = getLibraryHabits();
      setHabits((previous) => getTodayHabitSessions(libraryHabits, previous));
    };

    syncFromLibrary();
    window.addEventListener('habits-updated', syncFromLibrary);
    window.addEventListener('storage', syncFromLibrary);
    return () => {
      window.removeEventListener('habits-updated', syncFromLibrary);
      window.removeEventListener('storage', syncFromLibrary);
    };
  }, [owner, reloadRemoteToday, repository]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDashboardDate(new Date());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  // Dynamic Time-Based Greeting (Good morning / afternoon / evening based on current hour)
  const accountName =
    account.displayName && account.displayName !== 'Account' ? account.displayName : 'Alex';
  const { greeting, dateString } = getDynamicGreeting(dashboardDate, accountName);

  // Dialog States
  const [selectedHabitForDetail, setSelectedHabitForDetail] = useState<HabitSession | null>(null);
  const [editingHabit, setEditingHabit] = useState<HabitSession | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [createHabitDialogOpen, setCreateHabitDialogOpen] = useState(false);
  const [reflectionDialogOpen, setReflectionDialogOpen] = useState(false);
  const [reflectionNote, setReflectionNote] = useState('');
  const [reflectionInput, setReflectionInput] = useState('');

  // Edit Habit Form State
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('other');
  const [editTiming, setEditTiming] = useState('');
  const [editFromTime, setEditFromTime] = useState('08:00');
  const [editUntilTime, setEditUntilTime] = useState('09:00');
  const [editMin, setEditMin] = useState('');
  const [editFull, setEditFull] = useState('');
  const [editIcon, setEditIcon] = useState('meditation');

  // Toast Feedback State with In & Out Animations
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastExitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    if (toastExitTimeoutRef.current) clearTimeout(toastExitTimeoutRef.current);

    setToastMessage(msg);
    setToastExiting(false);

    toastExitTimeoutRef.current = setTimeout(() => {
      setToastExiting(true);
    }, 2700);

    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      setToastExiting(false);
    }, 3000);
  };

  const handleRecordOutcome = async (id: string, newOutcome: OutcomeType) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    if (repository && owner && habit.habitId) {
      if (newOutcome === 'unrecorded') {
        showToast('The saved check-in remains unchanged.');
        return;
      }
      try {
        await repository.recordCheckIn({
          commandId: createCommandId(),
          owner,
          sessionId: habit.id,
          outcome: newOutcome === 'skipped' ? 'manual_skipped' : newOutcome,
          frictionCode: null,
          frictionNote: null,
          expectedSessionRevision: habit.sessionRevision ?? 1,
          clientRecordedAt: new Date().toISOString(),
        });
        await reloadRemoteToday();
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to save check-in.');
        return;
      }
    } else {
      setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, outcome: newOutcome } : h)));
    }

    if (newOutcome === 'full') {
      showToast(`Full target recorded for ${habit.name}! Completed! 🎉`);
    } else if (newOutcome === 'minimum') {
      showToast(`Minimum met for ${habit.name}! Completed! ✨`);
    } else if (newOutcome === 'skipped') {
      showToast(`Skipped session recorded for ${habit.name}. Skipped`);
    } else {
      showToast(`Session reset to unrecorded.`);
    }
  };

  const handleCreateHabit = async (data: CreateHabitFormData) => {
    const startDate = data.startDate || getTodayDateStr();
    const isForToday = isTodayDate(startDate);

    if (repository && owner) {
      try {
        await repository.createHabit(
          buildCreateHabitCommand(data, owner, {
            habitId: createCommandId(),
            habitVersionId: createCommandId(),
            commandId: createCommandId(),
            now: new Date().toISOString(),
          }),
        );
        await reloadRemoteToday();
        showToast(
          isForToday
            ? `New habit "${data.name}" created for today!`
            : `Habit "${data.name}" scheduled for ${startDate} (available in Habits Library)!`,
        );
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to create habit.');
      }
      return;
    }

    const habitId = `h-${Date.now()}`;
    addHabitToSync({
      id: habitId,
      name: data.name,
      category: data.category,
      normalTarget: data.normalTarget,
      minimumTarget: data.minimumTarget,
      schedule: `${data.category} (${data.timingContext})`,
      cue: data.timingContext,
      timingContext: data.timingContext,
      fromTime: data.fromTime,
      untilTime: data.untilTime,
      status: 'Active',
      createdDate: startDate,
      iconName: data.icon === 'water' ? '💧' : data.icon === 'reading' ? '📚' : '🧘‍♂️',
    });

    showToast(
      isForToday
        ? `New habit "${data.name}" created for today!`
        : `Habit "${data.name}" scheduled for ${startDate} (available in Habits Library)!`,
    );
  };

  const handleOpenEdit = (habit: HabitSession) => {
    setEditingHabit(habit);
    setEditName(habit.name);
    const foundCat = CATEGORY_OPTIONS.find(
      (c) => c.label.toLowerCase() === habit.category.toLowerCase(),
    );
    setEditCategory(foundCat ? foundCat.id : 'other');
    setEditTiming(habit.timingContext);
    const range = extractTimeRange24FromContext(habit.timingContext);
    setEditFromTime(range.from);
    setEditUntilTime(range.until);
    setEditMin(habit.minimumSummary);
    setEditFull(habit.fullSummary);
    setEditIcon(habit.icon || 'meditation');
  };

  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit || !editName.trim()) return;

    const categoryLabel =
      CATEGORY_OPTIONS.find((c) => c.id === editCategory)?.label || editingHabit.category;

    if (repository && owner && editingHabit.habitId) {
      try {
        const from = editFromTime || extractTimeRange24FromContext(editTiming).from;
        const until = editUntilTime || extractTimeRange24FromContext(editTiming).until;
        await repository.updateHabitVersion(
          buildHabitVersionCommand(
            {
              name: editName,
              category: categoryLabel,
              normalTarget: editFull.replace(/^Full\s+/i, '').trim(),
              minimumTarget: editMin.replace(/^Minimum\s+/i, '').trim(),
              icon: editIcon,
              startDate: getLocalDateForTimezone(owner.timezone),
              fromTime: from,
              untilTime: until,
              timingContext: editTiming.trim() || formatTimeRange(from, until),
            },
            owner,
            {
              habitId: editingHabit.habitId,
              habitVersionId: createCommandId(),
              commandId: createCommandId(),
              expectedRevision: editingHabit.habitRevision ?? 1,
            },
          ),
        );
        await reloadRemoteToday();
        showToast(`Habit "${editName.trim()}" updated successfully!`);
        setEditingHabit(null);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to update habit.');
      }
      return;
    }

    const libraryHabit = getLibraryHabits().find((habit) => habit.id === editingHabit.id);
    if (libraryHabit) {
      updateHabitToSync(editingHabit.id, {
        name: editName.trim(),
        category: categoryLabel,
        schedule: editTiming.trim() || libraryHabit.schedule,
        timingContext: editTiming.trim() || libraryHabit.timingContext || libraryHabit.schedule,
        minimumTarget: editMin.trim().replace(/^Minimum\s+/i, '') || libraryHabit.minimumTarget,
        normalTarget: editFull.trim().replace(/^Full\s+/i, '') || libraryHabit.normalTarget,
        iconName: editIcon,
        fromTime: editFromTime,
        untilTime: editUntilTime,
      });
    }

    showToast(`Habit "${editName.trim()}" updated successfully!`);
    setEditingHabit(null);
  };

  const handleDeleteHabit = async (id: string) => {
    const habit = habits.find((h) => h.id === id);

    if (repository && owner && habit?.habitId) {
      try {
        await repository.setHabitLifecycle({
          commandId: createCommandId(),
          owner,
          habitId: habit.habitId,
          expectedRevision: habit.habitRevision ?? 1,
          nextState: 'trash',
        });
        await reloadRemoteToday();
        setEditingHabit(null);
        showToast(`Habit "${habit.name}" deleted.`);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to delete habit.');
      }
      return;
    }

    archiveHabitToSync(id);
    setEditingHabit(null);
    showToast(`Habit "${habit?.name ?? 'Habit'}" deleted.`);
  };

  const completedCount = habits.filter(
    (h) => h.outcome === 'full' || h.outcome === 'minimum',
  ).length;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const sortedHabits = sortHabitSessionsByStartTime(habits);

  // SVG Circle Progress parameters
  const circumference = 2 * Math.PI * 52; // r=52 => ~326.72
  const strokeOffset = circumference * (1 - completedCount / Math.max(totalCount, 1));

  return (
    <AppShell
      onOpenCreateHabit={() => setCreateHabitDialogOpen(true)}
      onOpenReflectionModal={() => {
        setReflectionInput(reflectionNote);
        setReflectionDialogOpen(true);
      }}
      todayCompletedCount={completedCount}
      todayTotalCount={totalCount}
      {...(weeklyOverview ? { weeklyOverview } : {})}
      currentDate={dashboardDate}
      habitCountForDate={getLibraryHabitCountForDate}
      reflectionNote={reflectionNote}
    >
      <span
        aria-hidden="true"
        className="sr-only"
        data-ready={remoteDataReady ? 'true' : 'false'}
        data-testid="today-data-ready"
      />
      {remoteError ? (
        <p
          role="alert"
          className="mx-auto max-w-5xl px-4 pt-4 text-xs text-red-700 sm:px-6 lg:px-8"
        >
          {remoteError}
        </p>
      ) : null}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Toast Notification Banner (Centered Bottom Text-Only with Entrance & Exit Animations - No Rectangle Box) */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              'pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ease-out',
              toastExiting
                ? 'translate-y-6 scale-95 opacity-0'
                : 'animate-in fade-in slide-in-from-bottom-6 translate-y-0 scale-100 opacity-100 duration-300',
            )}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] drop-shadow-sm">
              <Sparkles className="size-4 shrink-0 animate-pulse text-[var(--color-primary)]" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Dynamic Time-of-Day Greeting & Header */}
        <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
              {greeting}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)] sm:text-base">
              {dateString}
            </p>
          </div>
          <p className="text-xs font-semibold text-[var(--color-primary)] sm:text-right sm:text-sm">
            You&apos;re keeping the habit alive.
          </p>
        </div>

        {/* Dashboard Grid (Bento style) */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Daily Progress Widget (Col span 4) */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-xs md:col-span-4">
            <h2 className="mb-4 w-full text-left text-sm font-bold text-[var(--color-text-primary)]">
              Today&apos;s Progress
            </h2>

            {/* Smooth SVG Animated Progress Ring based on Completed Habits */}
            <div className="relative mb-4 flex size-32 items-center justify-center">
              <svg className="size-32 -rotate-90 transform" viewBox="0 0 120 120">
                {/* Track Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className="stroke-[var(--color-border)]/60"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Animated Primary Progress Arc */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className="stroke-[var(--color-primary)] transition-all duration-700 ease-out"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-[var(--color-primary)] transition-all duration-300">
                  {completedCount}
                </span>
                <span className="text-xs font-medium text-[var(--color-text-muted)]">
                  of {totalCount}
                </span>
              </div>
            </div>

            <p className="text-xs font-medium text-[var(--color-text-secondary)]">
              {completedCount} of {totalCount} habits completed today ({progressPercent}%)
            </p>
          </div>

          {/* Action Required Banner / Secondary Info (Col span 8) */}
          <div className="flex flex-col gap-4 md:col-span-8">
            {/* Action Required Banner */}
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-emerald-50)] p-5 shadow-xs sm:flex-row sm:items-center">
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-primary)] shadow-2xs">
                  <Info aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--color-primary)]">Needs Review</h3>
                    <Badge tone="recovery" className="px-2 text-[10px] font-semibold">
                      Friction Detected
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-primary)]">
                    Daily Meditation has been skipped twice this week. Want to adjust target?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewDialogOpen(true)}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline"
              >
                <span>Review</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>

            {/* Daily Reflection Card (Positioned top of rectangle self, text updates when note added via rail) */}
            <div className="relative flex flex-1 items-start overflow-hidden rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-emerald-50)]/50 via-white to-[var(--color-surface-subtle)] p-6 shadow-xs">
              <div className="relative z-10 w-full space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[var(--color-primary)] uppercase">
                  <span>✍️</span>
                  <span>Daily Reflection</span>
                </p>
                <p className="max-w-md text-sm leading-relaxed font-medium text-[var(--color-text-primary)] italic">
                  {reflectionNote ? `“${reflectionNote}”` : '.....'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Habits List Header (Sticky Header) */}
        <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-[var(--color-border)] bg-[var(--color-page)]/95 px-4 py-3.5 shadow-2xs backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              Habits to Track
            </h2>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
              {totalCount} Total Habits
            </span>
          </div>
        </div>

        {/* Habit Session Cards List */}
        <div className="space-y-4">
          {sortedHabits.map((habit) => {
            const isFull = habit.outcome === 'full';
            const isMinimum = habit.outcome === 'minimum';
            const isSkipped = habit.outcome === 'skipped';
            const isUnrecorded = habit.outcome === 'unrecorded';
            const isCompleted = !isUnrecorded;

            return (
              <div
                key={habit.id}
                className={`relative flex flex-col justify-between gap-4 rounded-2xl border p-5 shadow-xs transition-all duration-200 md:flex-row md:items-center ${
                  isFull
                    ? 'border-[var(--color-primary)]/40 bg-white'
                    : isMinimum
                      ? 'border-amber-500/40 bg-white'
                      : isSkipped
                        ? 'border-[var(--color-border)] bg-[var(--color-surface-subtle)]/70'
                        : 'border-[var(--color-border)] bg-white hover:border-[var(--color-primary)]/30'
                }`}
              >
                {/* Left Edge Status Accent Bar */}
                <div
                  className={`absolute top-0 bottom-0 left-0 w-1.5 rounded-l-2xl transition-all duration-300 ${
                    isFull
                      ? 'bg-[var(--color-primary)]'
                      : isMinimum
                        ? 'bg-amber-500'
                        : isSkipped
                          ? 'bg-[var(--color-text-muted)]'
                          : 'bg-[var(--color-border)]'
                  }`}
                />

                <div className="flex items-start gap-4 pl-3">
                  {/* Icon Badge */}
                  <div
                    className={`flex size-12 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isFull
                        ? 'bg-[var(--color-emerald-50)] text-[var(--color-primary)]'
                        : isMinimum
                          ? 'bg-amber-50 text-amber-600'
                          : isSkipped
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-[var(--color-surface-subtle)] text-[var(--color-primary)]'
                    }`}
                  >
                    {renderHabitIcon(habit.icon)}
                  </div>

                  {/* Habit Info & Actions */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedHabitForDetail(habit)}
                        className="text-left text-base font-bold text-[var(--color-text-primary)] hover:text-[var(--color-primary)] hover:underline"
                      >
                        {habit.name}
                      </button>

                      {/* Edit Habit Button Action */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(habit)}
                        className="rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-primary)]"
                        title="Edit habit"
                        aria-label={`Edit ${habit.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </div>

                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                      <Clock className="size-3.5 shrink-0 text-red-500" />
                      <span>{habit.timingContext}</span>
                    </p>

                    <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs font-medium text-[var(--color-text-primary)]">
                      <li>Min: {habit.minimumSummary}</li>
                      <li>Full: {habit.fullSummary}</li>
                    </ul>
                  </div>
                </div>

                {/* Check-in Trio Actions / Recovery Available / Adjust Plan / Morphing Completed Text Only */}
                <div className="flex flex-col items-end gap-1.5 self-start md:self-auto">
                  <div className="flex flex-wrap items-center justify-end gap-2.5">
                    {/* Adjust Plan (Green text, placed on Left side of Recovery Available, Same text size text-[11px]) */}
                    {habit.needsReview && isUnrecorded && (
                      <button
                        type="button"
                        onClick={() => setReviewDialogOpen(true)}
                        className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] hover:underline"
                      >
                        <span>Adjust Plan</span>
                        <ArrowRight className="size-3 text-[var(--color-primary)]" />
                      </button>
                    )}

                    {/* Recovery Available Text Only */}
                    {habit.recoveryAvailable && isUnrecorded && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                        <RotateCcw className="size-3 text-amber-600" />
                        <span>Recovery Available</span>
                      </span>
                    )}
                  </div>

                  {isCompleted ? (
                    isSkipped ? (
                      /* Morphed Skipped Text Only */
                      <button
                        type="button"
                        onClick={() => handleRecordOutcome(habit.id, 'unrecorded')}
                        title="Skipped. Click to reset status"
                        className="flex cursor-pointer items-center gap-1 px-2 py-1 text-xs font-bold text-[var(--color-text-muted)] hover:underline"
                      >
                        <Minus className="size-4 text-[var(--color-text-muted)]" />
                        <span>Skipped</span>
                      </button>
                    ) : (
                      /* Morphed Completed Text Only (Full or Minimum) */
                      <button
                        type="button"
                        onClick={() => handleRecordOutcome(habit.id, 'unrecorded')}
                        title="Completed! Click to reset status"
                        className="flex cursor-pointer items-center gap-1 px-2 py-1 text-xs font-bold text-[var(--color-primary)] hover:underline"
                      >
                        <Check className="size-4 text-[var(--color-primary)]" />
                        <span>Completed!</span>
                      </button>
                    )
                  ) : (
                    /* Check-in Trio Actions Control Bar */
                    <div className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-2xs">
                      {/* Record Full Button */}
                      <button
                        type="button"
                        onClick={() => handleRecordOutcome(habit.id, 'full')}
                        title="Record Full outcome"
                        className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-emerald-50)] hover:text-[var(--color-primary)]"
                      >
                        <Check className="size-4" />
                        <span>Full</span>
                      </button>

                      <div className="h-5 w-px bg-[var(--color-border)]" />

                      {/* Record Minimum Button */}
                      <button
                        type="button"
                        onClick={() => handleRecordOutcome(habit.id, 'minimum')}
                        title="Record Minimum outcome"
                        className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[var(--color-text-primary)] transition-all hover:bg-amber-50 hover:text-amber-700"
                      >
                        <Leaf className="size-4" />
                        <span>Min</span>
                      </button>

                      <div className="h-5 w-px bg-[var(--color-border)]" />

                      {/* Record Skipped Button */}
                      <button
                        type="button"
                        onClick={() => handleRecordOutcome(habit.id, 'skipped')}
                        title="Record Skipped outcome"
                        className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[var(--color-text-secondary)] transition-all hover:bg-gray-100 hover:text-[var(--color-text-primary)]"
                      >
                        <Minus className="size-4" />
                        <span>Skip</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal 1: Edit Habit Dialog (Matching Stitch Reference Design: code.html layout) */}
      <Dialog open={Boolean(editingHabit)} onOpenChange={() => setEditingHabit(null)}>
        <DialogContent className="overflow-hidden rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-0 sm:max-w-xl">
          {/* Header */}
          <div className="space-y-3 border-b border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-6">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#004e27]">
              <Pencil className="size-4 text-[#004e27]" />
              <span>Define Your Habit</span>
            </div>

            <div>
              <DialogTitle className="text-2xl font-bold text-[#161A17]">Edit Habit</DialogTitle>
              <DialogDescription className="mt-1 text-xs text-[#3f4940]">
                Update habit targets, category, schedule parameters, or delete habit.
              </DialogDescription>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#e1e3e3]">
              <div className="h-full w-full rounded-full bg-[#004e27] transition-all duration-300" />
            </div>
          </div>

          {editingHabit && (
            <form
              onSubmit={handleSaveEditSubmit}
              className="custom-scrollbar max-h-[75vh] space-y-6 overflow-y-auto p-6"
            >
              {/* Habit Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#161A17]" htmlFor="editName">
                  Habit Name
                </label>
                <input
                  id="editName"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3.5 py-2 text-xs text-[#161A17] transition-all placeholder:text-xs placeholder:text-[#bfc9be] focus:border-[#004e27] focus:ring-1 focus:ring-[#004e27]/30 focus:outline-none"
                />
              </div>

              {/* Category Selection Grid */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#161A17]">Category</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const CatIcon = cat.Icon;
                    const isSelected = editCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEditCategory(cat.id)}
                        className={`flex h-20 flex-col items-center justify-center rounded-lg border p-3 transition-all ${
                          isSelected
                            ? 'border-[#004e27] bg-[#96f4a8]/30 font-semibold text-[#027235] ring-1 ring-[#004e27]'
                            : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:bg-[#f3f4f4]'
                        }`}
                      >
                        <CatIcon className="mb-1.5 size-5" />
                        <span className="text-xs font-medium">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Definition Grid */}
              <div className="grid grid-cols-1 gap-4 border-t border-[var(--color-border-standard,#DDE5E1)] pt-4 sm:grid-cols-2">
                {/* Normal Version Target */}
                <div className="space-y-2">
                  <label
                    className="flex items-center gap-2 text-xs font-semibold text-[#161A17]"
                    htmlFor="editFull"
                  >
                    <CheckCircle2 className="size-4 text-[#004e27]" />
                    <span>Normal Target</span>
                  </label>
                  <p className="text-[11px] text-[#3f4940]">What you aim to do on a good day.</p>
                  <input
                    id="editFull"
                    type="text"
                    value={editFull}
                    onChange={(e) => setEditFull(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs text-[#161A17] transition-all focus:border-[#004e27] focus:ring-1 focus:ring-[#004e27]/30 focus:outline-none"
                  />
                </div>

                {/* Minimum Version Target (Recovery First) */}
                <div className="space-y-2">
                  <label
                    className="flex items-center gap-2 text-xs font-semibold text-[#161A17]"
                    htmlFor="editMin"
                  >
                    <Leaf className="size-4 text-[#F59E0B]" />
                    <span>Minimum Target</span>
                  </label>
                  <p className="text-[11px] text-[#3f4940]">Your non-zero effort for hard days.</p>
                  <div className="flex h-10 items-center rounded-lg border border-amber-300/70 bg-[#FFFBEB] px-3 transition-all focus-within:border-[#F59E0B] focus-within:ring-2 focus-within:ring-[#F59E0B]/20">
                    <Leaf className="mr-2 size-4 shrink-0 text-[#F59E0B]" />
                    <input
                      id="editMin"
                      type="text"
                      value={editMin}
                      onChange={(e) => setEditMin(e.target.value)}
                      className="w-full border-none bg-transparent text-xs text-[#161A17] focus:ring-0 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Choose Icon */}
              <div className="space-y-2 border-t border-[var(--color-border-standard,#DDE5E1)] pt-4">
                <span className="block text-xs font-semibold text-[#161A17]">Choose Icon</span>
                <div className="grid grid-cols-7 gap-2 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-3">
                  {ICON_OPTIONS.map((opt) => {
                    const IconComp = opt.Icon;
                    const isSelected = editIcon === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-label={`Select ${opt.label} icon`}
                        onClick={() => setEditIcon(opt.id)}
                        className={`flex size-9 items-center justify-center rounded-lg transition-all ${
                          isSelected
                            ? 'bg-[#004e27] font-bold text-white shadow-xs ring-2 ring-[#004e27]'
                            : 'text-[#3f4940] hover:bg-white hover:text-[#004e27]'
                        }`}
                        title={opt.label}
                      >
                        <IconComp className="size-4.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clock Schedule */}
              <div className="space-y-3 border-t border-[var(--color-border-standard,#DDE5E1)] pt-4">
                <div className="flex items-center justify-between">
                  <label
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#161A17]"
                    htmlFor="editFromTime"
                  >
                    <Clock className="size-4 text-[#004e27]" />
                    <span>Clock Schedule (From - Until)</span>
                  </label>
                  <span className="text-[11px] font-medium text-[#3f4940]">Schedule range</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="mb-1 block text-[11px] font-semibold text-[#3f4940]"
                      htmlFor="editFromTime"
                    >
                      From Clock
                    </label>
                    <input
                      id="editFromTime"
                      type="time"
                      value={editFromTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditFromTime(val);
                        setEditTiming(formatTimeRange(val, editUntilTime));
                      }}
                      className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs font-semibold text-[#161A17] focus:border-[#004e27] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-[11px] font-semibold text-[#3f4940]"
                      htmlFor="editUntilTime"
                    >
                      Until Clock
                    </label>
                    <input
                      id="editUntilTime"
                      type="time"
                      value={editUntilTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditUntilTime(val);
                        setEditTiming(formatTimeRange(editFromTime, val));
                      }}
                      className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs font-semibold text-[#161A17] focus:border-[#004e27] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {CLOCK_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setEditFromTime(p.from);
                        setEditUntilTime(p.until);
                        setEditTiming(p.label);
                      }}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        editFromTime === p.from && editUntilTime === p.until
                          ? 'border-[#004e27] bg-[#96f4a8]/30 font-bold text-[#027235]'
                          : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:border-[#004e27]/40'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <input
                  id="editTiming"
                  type="text"
                  placeholder="e.g. 08:00 AM - 09:00 AM"
                  value={editTiming}
                  onChange={(e) => setEditTiming(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs text-[#161A17] focus:border-[#004e27] focus:outline-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t border-[var(--color-border-standard,#DDE5E1)] pt-4">
                <button
                  type="button"
                  onClick={() => handleDeleteHabit(editingHabit.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                >
                  <Trash2 className="size-4" />
                  <span>Delete Habit</span>
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="compact"
                    variant="secondary"
                    onClick={() => setEditingHabit(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="compact"
                    variant="primary"
                    disabled={!editName.trim()}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 2: Open Habit Details Dialog (Matching Stitch Reference Design: check_in_desktop_dialog/code.html) */}
      <Dialog
        open={Boolean(selectedHabitForDetail)}
        onOpenChange={() => setSelectedHabitForDetail(null)}
      >
        <DialogContent className="overflow-hidden rounded-2xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-0 shadow-[0_4px_24px_rgba(22,26,23,0.12)] sm:max-w-[560px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-6">
            <div>
              <DialogTitle className="text-2xl font-bold text-[#161A17]">
                {selectedHabitForDetail?.name}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-[#3f4940]">
                Habit parameters & participation details.
              </DialogDescription>
            </div>
          </div>

          {selectedHabitForDetail && (
            <div className="custom-scrollbar flex max-h-[75vh] flex-col space-y-6 overflow-y-auto p-6">
              {/* Targets Overview (Bento Layout) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Normal Target Card */}
                <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-4 transition-all">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#004e27]/10 text-[#004e27]">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <span className="mb-1 block text-[11px] font-semibold tracking-wider text-[#3f4940] uppercase">
                      Normal Target
                    </span>
                    <span className="block text-sm font-bold text-[#161A17]">
                      {selectedHabitForDetail.fullSummary}
                    </span>
                    <span className="mt-1 block text-xs text-[#3f4940]">Deep focus session</span>
                  </div>
                </div>

                {/* Minimum Target Card */}
                <div className="relative flex items-start gap-3 overflow-hidden rounded-xl border border-amber-300/70 bg-[#FFFBEB] p-4">
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[#b86b00]">
                    <Leaf className="size-5" />
                  </div>
                  <div className="relative z-10">
                    <span className="mb-1 block text-[11px] font-semibold tracking-wider text-[#b86b00] uppercase">
                      Minimum Target
                    </span>
                    <span className="block text-sm font-bold text-[#161A17]">
                      {selectedHabitForDetail.minimumSummary}
                    </span>
                    <span className="mt-1 block text-xs text-[#3f4940]">Keep the habit alive</span>
                  </div>
                </div>
              </div>

              {/* Real Category & Real Schedule (Stitch Card Layout) */}
              <div className="space-y-3 pt-2">
                {/* Real Category Card */}
                <div className="flex items-center justify-between rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f4f3] text-[#004e27]">
                      {(() => {
                        const catOpt = CATEGORY_OPTIONS.find(
                          (c) =>
                            c.label.toLowerCase() === selectedHabitForDetail.category.toLowerCase(),
                        );
                        const CatIconComp = catOpt ? catOpt.Icon : Target;
                        return <CatIconComp className="size-6" />;
                      })()}
                    </div>
                    <div className="text-left">
                      <span className="block text-[11px] font-semibold tracking-wider text-[#3f4940] uppercase">
                        Category
                      </span>
                      <span className="mt-0.5 block text-sm font-bold text-[#161A17]">
                        {selectedHabitForDetail.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real Schedule Card */}
                <div className="flex items-center justify-between rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF5FF] text-[#3B82F6]">
                      <Clock className="size-6" />
                    </div>
                    <div className="text-left">
                      <span className="block text-[11px] font-semibold tracking-wider text-[#3f4940] uppercase">
                        Schedule
                      </span>
                      <span className="mt-0.5 block text-sm font-bold text-[#161A17]">
                        {selectedHabitForDetail.timingContext}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 border-t border-[var(--color-border-standard,#DDE5E1)] pt-4">
                <Button
                  size="compact"
                  variant="secondary"
                  onClick={() => setSelectedHabitForDetail(null)}
                >
                  Close
                </Button>
                <Button
                  size="compact"
                  variant="primary"
                  onClick={() => {
                    const h = selectedHabitForDetail;
                    setSelectedHabitForDetail(null);
                    handleOpenEdit(h);
                  }}
                >
                  Edit Habit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 3: Open Check-in Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]">
            <ShieldCheck className="size-5 text-[var(--color-primary)]" />
            <span>Compassionate Check-in Review</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[var(--color-text-secondary)]">
            Acknowledge friction without guilt or streak loss.
          </DialogDescription>

          <div className="mt-4 space-y-4 text-xs">
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h4 className="flex items-center gap-1.5 font-bold text-amber-900">
                <Info className="size-4 text-amber-600" />
                Friction Analysis
              </h4>
              <p className="leading-relaxed text-amber-800">
                Daily Meditation was skipped twice recently. Would you like to temporarily switch
                your primary target to the <strong>Minimum Version (2 mins)</strong>?
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-[var(--color-text-primary)]">
                Reflection Note (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="What made this habit challenging recently? (e.g., travel, busy mornings)"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="compact" variant="secondary" onClick={() => setReviewDialogOpen(false)}>
                Keep Current Targets
              </Button>
              <Button
                size="compact"
                variant="primary"
                onClick={() => {
                  setReviewDialogOpen(false);
                  showToast('Habit target adjusted to Minimum. Rest and continuity restored!');
                }}
              >
                Switch to Minimum Target
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Create Habit Dialog */}
      <CreateHabitDialog
        open={createHabitDialogOpen}
        onOpenChange={setCreateHabitDialogOpen}
        onCreated={(data) => {
          if (repository && owner) {
            void handleCreateHabit(data);
            return;
          }
          const startDate = data.startDate || getTodayDateStr();
          const isForToday = isTodayDate(startDate);
          const habitId = `h-${Date.now()}`;

          addHabitToSync({
            id: habitId,
            name: data.name,
            category: data.category,
            normalTarget: data.normalTarget,
            minimumTarget: data.minimumTarget,
            schedule: `${data.category} (${data.timingContext})`,
            cue: data.timingContext,
            timingContext: data.timingContext,
            fromTime: data.fromTime,
            untilTime: data.untilTime,
            status: 'Active',
            createdDate: startDate,
            iconName: data.icon === 'water' ? '💧' : data.icon === 'reading' ? '📚' : '🧘‍♂️',
          });

          if (isForToday) {
            showToast(`New habit "${data.name}" created for today!`);
          } else {
            showToast(
              `Habit "${data.name}" scheduled for ${startDate} (available in Habits Library)!`,
            );
          }
        }}
      />

      {/* Modal 5: Daily Reflection Note Dialog */}
      <Dialog open={reflectionDialogOpen} onOpenChange={setReflectionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]">
            <span>✍️</span>
            <span>Add Reflection Note</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[var(--color-text-secondary)]">
            Capture how your habits went today or what you learned.
          </DialogDescription>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (reflectionInput.trim()) {
                setReflectionNote(reflectionInput.trim());
                showToast('Reflection note saved!');
              }
              setReflectionDialogOpen(false);
            }}
            className="mt-4 space-y-3 text-xs"
          >
            <textarea
              rows={3}
              required
              placeholder="e.g. Focused on consistency today. Felt great about drinking water early."
              value={reflectionInput}
              onChange={(e) => setReflectionInput(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                size="compact"
                variant="secondary"
                onClick={() => setReflectionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="compact" variant="primary">
                Save Reflection
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
