'use client';

import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Leaf,
  Sun,
  ListFilter,
  Pencil,
  Pause,
  Play,
  Trash2,
  Sparkles,
  TrendingUp,
  Info,
  Calendar,
  Wrench,
  AlertTriangle,
  Search,
  Eye,
  RotateCcw,
  Clock,
  ChevronDown,
  ChevronUp,
  Moon,
  Sunrise,
  Sunset,
  type LucideIcon,
} from 'lucide-react';

import {
  matchesDatePreset,
  matchesTimeBucket,
  normalizeCreatedDate,
  type DateFilterPreset,
  type TimeFilterValue,
} from '@/domain/habits/habit-filters';
import { DEFAULT_HABITS, type HabitRecord } from '@/domain/habits/default-habits';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  CreateHabitDialog,
  type CreateHabitFormData,
  CATEGORY_OPTIONS,
  ICON_OPTIONS,
  CLOCK_PRESETS,
  formatTimeRange,
} from '@/features/habits/create-habit-dialog';
import { getLibraryHabits, saveStoredHabits } from '@/lib/storage/habits-sync';

export interface HabitItem {
  id: string;
  name: string;
  category: 'Mindfulness' | 'Health' | 'Learning' | 'Social';
  description: string;
  normalTarget: string;
  minimumTarget: string;
  schedule: string;
  cue: string;
  status: 'Active' | 'Paused' | 'Archived';
  streak: number;
  consistency: number;
  createdDate: string;
  version: string;
  iconName: string;
  fromTime?: string;
  untilTime?: string;
  timingContext?: string;
}

function toHabitItem(habit: HabitRecord): HabitItem {
  return {
    id: habit.id,
    name: habit.name,
    category: (habit.category as HabitItem['category']) || 'Mindfulness',
    description: habit.description || '',
    normalTarget: habit.normalTarget,
    minimumTarget: habit.minimumTarget,
    schedule: habit.schedule,
    cue: habit.cue || habit.schedule,
    status: habit.status,
    streak: habit.streak ?? 1,
    consistency: habit.consistency ?? 100,
    createdDate: habit.createdDate,
    version: habit.version || 'v1',
    iconName: habit.iconName || '🎯',
    ...(habit.fromTime ? { fromTime: habit.fromTime } : {}),
    ...(habit.untilTime ? { untilTime: habit.untilTime } : {}),
    ...(habit.timingContext ? { timingContext: habit.timingContext } : {}),
  };
}

const INITIAL_HABITS: HabitItem[] = DEFAULT_HABITS.map(toHabitItem);

const STATUS_FILTER_OPTIONS = ['All', 'Active', 'Paused'] as const;
type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number];

const STATUS_FILTER_ICONS: Record<StatusFilter, LucideIcon> = {
  All: ListFilter,
  Active: Play,
  Paused: Pause,
};

const STATUS_FILTER_COLORS: Record<StatusFilter, string> = {
  All: '#3f4940',
  Active: '#004e27',
  Paused: '#92400E',
};

const TIME_FILTER_OPTIONS: { value: TimeFilterValue; label: string; icon: LucideIcon }[] = [
  { value: 'all', label: 'Any Time', icon: Clock },
  { value: 'morning', label: 'Morning', icon: Sunrise },
  { value: 'afternoon', label: 'Afternoon', icon: Sun },
  { value: 'evening', label: 'Evening', icon: Sunset },
  { value: 'night', label: 'Night', icon: Moon },
];

const TIME_FILTER_COLORS: Record<TimeFilterValue, string> = {
  all: '#3f4940',
  morning: '#F59E0B',
  afternoon: '#2563EB',
  evening: '#7C3AED',
  night: '#4F46E5',
};

function TimeFilterIcon({
  bucket,
  className,
}: Readonly<{ bucket: TimeFilterValue; className?: string }>): React.JSX.Element {
  const option = TIME_FILTER_OPTIONS.find((item) => item.value === bucket);
  const Icon = option?.icon ?? Clock;
  return (
    <Icon aria-hidden="true" className={className} style={{ color: TIME_FILTER_COLORS[bucket] }} />
  );
}

const DATE_FILTER_OPTIONS: { value: DateFilterPreset; label: string; icon: LucideIcon }[] = [
  { value: 'all', label: 'All Dates', icon: Calendar },
  { value: 'today', label: 'Today', icon: Sun },
  { value: 'tomorrow', label: 'Tomorrow', icon: Sunrise },
];

const DATE_FILTER_COLORS: Record<DateFilterPreset, string> = {
  all: '#3f4940',
  today: '#004e27',
  tomorrow: '#2563EB',
  last7: '#2563EB',
  last30: '#7C3AED',
  thisMonth: '#DB2777',
  custom: '#B45309',
};

function DateFilterIcon({
  preset,
  className,
}: Readonly<{ preset: DateFilterPreset; className?: string }>): React.JSX.Element {
  const option = DATE_FILTER_OPTIONS.find((item) => item.value === preset);
  const Icon = option?.icon ?? Calendar;
  return (
    <Icon aria-hidden="true" className={className} style={{ color: DATE_FILTER_COLORS[preset] }} />
  );
}

function getTodayDateStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0] ?? '';
}

function getTomorrowDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0] ?? '';
}

function getNextMondayDateStr(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
  const nextMonday = new Date(d);
  nextMonday.setDate(diff);
  return nextMonday.toISOString().split('T')[0] ?? '';
}

function StatusFilterIcon({
  status,
  className,
}: Readonly<{ status: StatusFilter; className?: string }>): React.JSX.Element {
  const Icon = STATUS_FILTER_ICONS[status];
  return (
    <Icon
      aria-hidden="true"
      className={className}
      style={{ color: STATUS_FILTER_COLORS[status] }}
    />
  );
}

function mergeLibraryHabits(records: ReadonlyArray<HabitRecord>): HabitItem[] {
  return records.map(toHabitItem);
}

function getIconIdFromEmoji(emojiOrName: string): string {
  const normalized = emojiOrName.toLowerCase();
  if (normalized === 'water' || normalized.includes('💧')) return 'water';
  if (normalized === 'reading' || normalized.includes('📚') || normalized.includes('📖'))
    return 'reading';
  if (normalized === 'exercise' || normalized.includes('🏋️') || normalized.includes('🏃'))
    return 'exercise';
  if (normalized === 'running' || normalized.includes('🏃')) return 'running';
  if (normalized === 'sleep' || normalized.includes('🌙') || normalized.includes('😴'))
    return 'sleep';
  if (normalized === 'coding' || normalized.includes('💻')) return 'coding';
  if (normalized === 'writing' || normalized.includes('✏️')) return 'writing';
  if (normalized === 'nutrition' || normalized.includes('🍎')) return 'nutrition';
  if (normalized === 'flame' || normalized.includes('🔥')) return 'flame';
  if (normalized === 'coffee' || normalized.includes('☕')) return 'coffee';
  if (normalized === 'music' || normalized.includes('🎵')) return 'music';
  if (normalized === 'zap' || normalized.includes('⚡')) return 'zap';
  if (normalized === 'target' || normalized.includes('🎯')) return 'target';
  return 'meditation';
}

function getIconEmojiFromId(iconId: string): string {
  switch (iconId) {
    case 'meditation':
      return '🧘‍♂️';
    case 'water':
      return '💧';
    case 'reading':
      return '📖';
    case 'exercise':
      return '🏋️‍♂️';
    case 'running':
      return '🏃‍♂️';
    case 'sleep':
      return '🌙';
    case 'coding':
      return '💻';
    case 'writing':
      return '✏️';
    case 'nutrition':
      return '🍎';
    case 'flame':
      return '🔥';
    case 'coffee':
      return '☕';
    case 'music':
      return '🎵';
    case 'zap':
      return '⚡';
    default:
      return '🎯';
  }
}

export function HabitsManagement(): React.JSX.Element {
  // Screen Mode: 'list' | 'detail'
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedHabitId, setSelectedHabitId] = useState<string>('h1');

  // Habits State
  const [habitsList, setHabitsList] = useState<HabitItem[]>(INITIAL_HABITS);
  const shouldPersistHabitsRef = useRef(false);

  // Hydrate browser-local habits after mount to keep server and client markup deterministic.
  React.useEffect(() => {
    const libraryHabits = getLibraryHabits();
    if (libraryHabits.length === 0) return undefined;

    const hydrationTimer = window.setTimeout(() => {
      setHabitsList(mergeLibraryHabits(libraryHabits));
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  React.useEffect(() => {
    if (!shouldPersistHabitsRef.current) return;

    shouldPersistHabitsRef.current = false;
    saveStoredHabits(
      habitsList.map((h) => ({
        id: h.id,
        name: h.name,
        category: h.category,
        normalTarget: h.normalTarget,
        minimumTarget: h.minimumTarget,
        schedule: h.schedule,
        cue: h.cue,
        status: h.status,
        createdDate: h.createdDate,
        iconName: h.iconName,
        description: h.description,
        streak: h.streak,
        consistency: h.consistency,
        version: h.version,
        ...(h.fromTime ? { fromTime: h.fromTime } : {}),
        ...(h.untilTime ? { untilTime: h.untilTime } : {}),
        ...(h.timingContext ? { timingContext: h.timingContext } : {}),
      })),
    );
  }, [habitsList]);

  const updateHabitsWithSync = (updater: (prev: HabitItem[]) => HabitItem[]) => {
    shouldPersistHabitsRef.current = true;
    setHabitsList((prev) => updater(prev));
  };

  // Filters & Search State
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('All');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilterValue>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterPreset>('all');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Habit for Detail View
  const activeHabit = habitsList.find((h) => h.id === selectedHabitId) || habitsList[0];

  function handleStatusFilterChange(value: string): void {
    if (value === 'All' || value === 'Active' || value === 'Paused') {
      setSelectedStatus(value);
    }
  }

  function handleTimeFilterChange(value: string): void {
    if (
      value === 'all' ||
      value === 'morning' ||
      value === 'afternoon' ||
      value === 'evening' ||
      value === 'night'
    ) {
      setSelectedTimeFilter(value);
      setVisibleActiveCount(4);
    }
  }

  function handleDateFilterChange(value: string): void {
    if (
      value === 'all' ||
      value === 'today' ||
      value === 'tomorrow' ||
      value === 'last7' ||
      value === 'last30' ||
      value === 'thisMonth' ||
      value === 'custom'
    ) {
      setSelectedDateFilter(value as DateFilterPreset);
      setVisibleActiveCount(4);
    }
  }

  // Tab Navigation in Detail View
  const [detailTab, setDetailTab] = useState<'overview' | 'history' | 'changes'>('overview');

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [redesignDialogOpen, setRedesignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);

  // Edit Form Fields
  const [editName, setEditName] = useState(activeHabit?.name || '');
  const [editDesc, setEditDesc] = useState(activeHabit?.description || '');
  const [editCategory, setEditCategory] = useState(
    activeHabit?.category?.toLowerCase() || 'mindfulness',
  );
  const [editNormal, setEditNormal] = useState(activeHabit?.normalTarget || '');
  const [editMinimum, setEditMinimum] = useState(activeHabit?.minimumTarget || '');
  const [editIcon, setEditIcon] = useState('meditation');
  const [editFromTime, setEditFromTime] = useState(activeHabit?.fromTime || '08:00');
  const [editUntilTime, setEditUntilTime] = useState(activeHabit?.untilTime || '09:00');
  const [editTiming, setEditTiming] = useState(activeHabit?.timingContext || '08:00 AM - 09:00 AM');
  const [editDate, setEditDate] = useState(activeHabit?.createdDate || getTodayDateStr());

  // Toast State
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

  const openEditHabitModal = (habit: HabitItem) => {
    setSelectedHabitId(habit.id);
    setEditName(habit.name);
    setEditDesc(habit.description);
    setEditCategory((habit.category || 'mindfulness').toLowerCase());
    setEditNormal(habit.normalTarget);
    setEditMinimum(habit.minimumTarget);
    setEditIcon(getIconIdFromEmoji(habit.iconName));
    setEditFromTime(habit.fromTime || '08:00');
    setEditUntilTime(habit.untilTime || '09:00');
    setEditTiming(habit.timingContext || habit.schedule || '08:00 AM - 09:00 AM');
    setEditDate(habit.createdDate || getTodayDateStr());
    setEditDialogOpen(true);
  };

  const handleOpenDetail = (habitId: string) => {
    const habit = habitsList.find((h) => h.id === habitId);
    if (habit) {
      setSelectedHabitId(habitId);
      setViewMode('detail');
      setDetailTab('overview');
    }
  };

  const handleTogglePause = (habitId: string) => {
    const habit = habitsList.find((h) => h.id === habitId);
    if (!habit) return;

    const nextStatus = habit.status === 'Active' ? 'Paused' : 'Active';
    updateHabitsWithSync((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, status: nextStatus } : h)),
    );
    showToast(`Habit "${habit.name}" status updated to ${nextStatus}`);
  };

  const handleCreateHabitSubmit = (data: CreateHabitFormData) => {
    const newHabit: HabitItem = {
      id: `h-${Date.now()}`,
      name: data.name,
      category: (data.category as HabitItem['category']) || 'Mindfulness',
      description: data.description?.trim() || '',
      normalTarget: data.normalTarget,
      minimumTarget: data.minimumTarget,
      schedule: `${data.category} (${data.timingContext})`,
      cue: data.timingContext,
      status: 'Active',
      streak: 1,
      consistency: 100,
      createdDate: data.startDate || getTodayDateStr(),
      version: 'v1',
      iconName: getIconEmojiFromId(data.icon),
      fromTime: data.fromTime,
      untilTime: data.untilTime,
      timingContext: data.timingContext,
    };
    updateHabitsWithSync((prev) => [newHabit, ...prev]);
    showToast(`New habit "${data.name}" created successfully!`);
  };

  const handleSaveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const matchedCat = CATEGORY_OPTIONS.find((c) => c.id === editCategory);
    const categoryLabel = (matchedCat?.label as HabitItem['category']) || ('Mindfulness' as const);
    const computedTiming =
      editTiming || formatTimeRange(editFromTime, editUntilTime) || '08:00 AM - 09:00 AM';

    updateHabitsWithSync((prev) =>
      prev.map((h) => {
        if (h.id === selectedHabitId) {
          return {
            ...h,
            name: editName.trim(),
            category: categoryLabel,
            description: editDesc.trim(),
            normalTarget: editNormal.trim() || h.normalTarget,
            minimumTarget: editMinimum.trim() || h.minimumTarget,
            iconName: getIconEmojiFromId(editIcon),
            fromTime: editFromTime,
            untilTime: editUntilTime,
            timingContext: computedTiming,
            schedule: `${categoryLabel} (${computedTiming})`,
            cue: computedTiming,
            createdDate: editDate.trim() || getTodayDateStr(),
          };
        }
        return h;
      }),
    );

    setEditDialogOpen(false);
    showToast(`Habit "${editName.trim()}" specifications updated!`);
  };

  const handleDeleteHabitConfirm = () => {
    updateHabitsWithSync((prev) => prev.filter((h) => h.id !== selectedHabitId));
    setDeleteDialogOpen(false);
    setViewMode('list');
    showToast('Habit moved to archive/trash');
  };

  // Filtered Habits Logic (Search retrieves habits regardless of whether active or paused)
  const filteredHabits = habitsList.filter((h) => {
    const matchesStatus = selectedStatus === 'All' || h.status === selectedStatus;
    const matchesSearch =
      !searchQuery.trim() ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTime = matchesTimeBucket(h, selectedTimeFilter);
    const matchesDate = matchesDatePreset(
      h.createdDate,
      selectedDateFilter,
      {
        from: customFrom,
        to: customTo,
      },
      new Date(),
    );
    return matchesStatus && matchesSearch && matchesTime && matchesDate;
  });

  const [visibleActiveCount, setVisibleActiveCount] = useState<number>(4);

  const activeHabits = filteredHabits.filter((h) => h.status === 'Active');
  const pausedHabits = filteredHabits.filter((h) => h.status === 'Paused');
  const displayedActiveHabits = activeHabits.slice(0, visibleActiveCount);
  const hasMoreActiveHabits = activeHabits.length > visibleActiveCount;
  const getLibraryHabitCountForDate = (date: Date): number => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${date.getFullYear()}-${month}-${day}`;

    return habitsList.filter((habit) => {
      if (habit.status === 'Archived') return false;
      return normalizeCreatedDate(habit.createdDate) === dateKey;
    }).length;
  };

  return (
    <AppShell
      onOpenCreateHabit={() => setCreateDialogOpen(true)}
      habitCountForDate={getLibraryHabitCountForDate}
    >
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

      {/* VIEW 1: HABITS LIBRARY LIST SCREEN */}
      {viewMode === 'list' && (
        <div className="mx-auto w-full max-w-[1024px] space-y-6 px-4 py-6 sm:px-6">
          {/* Header Section with Title */}
          <div className="border-b border-[var(--color-border-standard,#DDE5E1)] pb-4">
            <h1 className="text-2xl font-bold text-[#161A17] sm:text-3xl">Habits Library</h1>
            <p className="mt-1 text-xs text-[#3f4940] sm:text-sm">
              Manage your habit definitions, minimum baselines, and active routines.
            </p>
          </div>

          {/* Search, Status, Time & Date Filter Controls Bar */}
          <div className="flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
            {/* Search Input (Retrieves habits across both Active and Paused) */}
            <div className="relative min-w-0 flex-1 md:max-w-[420px]">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#3f4940]" />
              <input
                aria-label="Search habits"
                type="text"
                placeholder="Search habits by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white pr-4 pl-9 text-sm text-[#161A17] shadow-xs transition-[border-color,box-shadow] duration-150 placeholder:text-[#3f4940] hover:border-[#004e27]/60 hover:shadow-sm focus:border-[#004e27] focus:ring-4 focus:ring-[#004e27]/10 focus:outline-none motion-reduce:transition-none"
              />
            </div>

            {/* Status, Time & Date Dropdown Filters - Clean Uncovered Icons & Borderless Hover */}
            <div className="flex w-full items-center justify-center gap-2.5 py-1 sm:w-auto md:shrink-0">
              <Select value={selectedStatus} onValueChange={handleStatusFilterChange}>
                <SelectTrigger
                  aria-label="Filter by status"
                  className={cn(
                    'group h-11 min-h-11 w-full items-center justify-between gap-2.5 rounded-xl border bg-white px-3.5 text-xs shadow-2xs transition-colors duration-150 focus-visible:border-[#004e27] focus-visible:ring-4 focus-visible:ring-[#004e27]/10 sm:w-fit',
                    selectedStatus !== 'All'
                      ? 'border-[#004e27]/50 bg-[#f7fbf8] font-semibold text-[#004e27]'
                      : 'border-[var(--color-border-standard,#DDE5E1)] text-[#161A17] hover:border-[#004e27]/70 hover:bg-[#f4f9f6] hover:text-[#004e27]',
                  )}
                >
                  <span className="flex items-center gap-2 overflow-hidden py-0.5">
                    <StatusFilterIcon
                      status={selectedStatus}
                      className="size-4 shrink-0 text-[#004e27]"
                    />
                    <SelectValue className="font-semibold">
                      <span className="block text-xs leading-none font-semibold text-[#161A17]">
                        {selectedStatus === 'All' ? 'All Status' : selectedStatus}
                      </span>
                    </SelectValue>
                  </span>
                </SelectTrigger>
                <SelectContent className="animate-in fade-in-0 zoom-in-95 w-52 rounded-2xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-1.5 shadow-xl shadow-emerald-950/10 backdrop-blur-md transition-all duration-150">
                  {STATUS_FILTER_OPTIONS.map((status) => {
                    const Icon = STATUS_FILTER_ICONS[status];
                    const color = STATUS_FILTER_COLORS[status];
                    return (
                      <SelectItem
                        key={status}
                        value={status}
                        showIndicator={true}
                        className="group flex w-full cursor-pointer items-center justify-between rounded-xl border-0 px-3 py-2.5 text-xs text-[#3f4940] transition-colors duration-150 outline-none hover:bg-[#f0f8f4] hover:text-[#004e27] data-[highlighted]:bg-[#f0f8f4] data-[highlighted]:text-[#004e27] data-[state=checked]:bg-[#e7f3ed] data-[state=checked]:font-semibold data-[state=checked]:text-[#004e27]"
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-2.5">
                          <Icon aria-hidden="true" className="size-4 shrink-0" style={{ color }} />
                          <span className="truncate text-xs font-semibold text-[#161A17] group-hover:text-[#004e27] group-data-[highlighted]:text-[#004e27]">
                            {status === 'All' ? 'All Status' : status}
                          </span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select value={selectedTimeFilter} onValueChange={handleTimeFilterChange}>
                <SelectTrigger
                  aria-label="Filter by time of day"
                  className={cn(
                    'group h-11 min-h-11 w-full items-center justify-between gap-2.5 rounded-xl border bg-white px-3.5 text-xs shadow-2xs transition-colors duration-150 focus-visible:border-[#004e27] focus-visible:ring-4 focus-visible:ring-[#004e27]/10 sm:w-fit',
                    selectedTimeFilter !== 'all'
                      ? 'border-[#004e27]/50 bg-[#f7fbf8] font-semibold text-[#004e27]'
                      : 'border-[var(--color-border-standard,#DDE5E1)] text-[#161A17] hover:border-[#004e27]/70 hover:bg-[#f4f9f6] hover:text-[#004e27]',
                  )}
                >
                  <span className="flex items-center gap-2 overflow-hidden py-0.5">
                    <TimeFilterIcon
                      bucket={selectedTimeFilter}
                      className="size-4 shrink-0 text-[#004e27]"
                    />
                    <SelectValue className="font-semibold">
                      <span className="block text-xs leading-none font-semibold text-[#161A17]">
                        {TIME_FILTER_OPTIONS.find((o) => o.value === selectedTimeFilter)?.label ??
                          'Any Time'}
                      </span>
                    </SelectValue>
                  </span>
                </SelectTrigger>
                <SelectContent className="animate-in fade-in-0 zoom-in-95 w-48 rounded-2xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-1.5 shadow-xl shadow-emerald-950/10 backdrop-blur-md transition-all duration-150">
                  {TIME_FILTER_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const color = TIME_FILTER_COLORS[option.value];
                    return (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        showIndicator={true}
                        className="group flex w-full cursor-pointer items-center justify-between rounded-xl border-0 px-3 py-2.5 text-xs text-[#3f4940] transition-colors duration-150 outline-none hover:bg-[#f0f8f4] hover:text-[#004e27] data-[highlighted]:bg-[#f0f8f4] data-[highlighted]:text-[#004e27] data-[state=checked]:bg-[#e7f3ed] data-[state=checked]:font-semibold data-[state=checked]:text-[#004e27]"
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-2.5">
                          <Icon aria-hidden="true" className="size-4 shrink-0" style={{ color }} />
                          <span className="truncate text-xs font-semibold text-[#161A17] group-hover:text-[#004e27] group-data-[highlighted]:text-[#004e27]">
                            {option.label}
                          </span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select value={selectedDateFilter} onValueChange={handleDateFilterChange}>
                <SelectTrigger
                  aria-label="Filter by date"
                  className={cn(
                    'group h-11 min-h-11 w-full items-center justify-between gap-2.5 rounded-xl border bg-white px-3.5 text-xs shadow-2xs transition-colors duration-150 focus-visible:border-[#004e27] focus-visible:ring-4 focus-visible:ring-[#004e27]/10 sm:w-fit',
                    selectedDateFilter !== 'all'
                      ? 'border-[#004e27]/50 bg-[#f7fbf8] font-semibold text-[#004e27]'
                      : 'border-[var(--color-border-standard,#DDE5E1)] text-[#161A17] hover:border-[#004e27]/70 hover:bg-[#f4f9f6] hover:text-[#004e27]',
                  )}
                >
                  <span className="flex items-center gap-2 overflow-hidden py-0.5">
                    <DateFilterIcon
                      preset={selectedDateFilter}
                      className="size-4 shrink-0 text-[#004e27]"
                    />
                    <SelectValue className="font-semibold">
                      <span className="block text-xs leading-none font-semibold text-[#161A17]">
                        {DATE_FILTER_OPTIONS.find((o) => o.value === selectedDateFilter)?.label ??
                          'All Dates'}
                      </span>
                    </SelectValue>
                  </span>
                </SelectTrigger>
                <SelectContent className="animate-in fade-in-0 zoom-in-95 w-52 rounded-2xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-1.5 shadow-xl shadow-emerald-950/10 backdrop-blur-md transition-all duration-150">
                  {DATE_FILTER_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const color = DATE_FILTER_COLORS[option.value];
                    return (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        showIndicator={true}
                        className="group flex w-full cursor-pointer items-center justify-between rounded-xl border-0 px-3 py-2.5 text-xs text-[#3f4940] transition-colors duration-150 outline-none hover:bg-[#f0f8f4] hover:text-[#004e27] data-[highlighted]:bg-[#f0f8f4] data-[highlighted]:text-[#004e27] data-[state=checked]:bg-[#e7f3ed] data-[state=checked]:font-semibold data-[state=checked]:text-[#004e27]"
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-2.5">
                          <Icon aria-hidden="true" className="size-4 shrink-0" style={{ color }} />
                          <span className="truncate text-xs font-semibold text-[#161A17] group-hover:text-[#004e27] group-data-[highlighted]:text-[#004e27]">
                            {option.label}
                          </span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {selectedDateFilter === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Custom date from"
                    type="date"
                    value={customFrom}
                    onChange={(e) => {
                      setCustomFrom(e.target.value);
                      setVisibleActiveCount(4);
                    }}
                    className="h-11 w-36 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs font-semibold text-[#161A17] focus:border-[#004e27] focus:outline-none"
                  />
                  <input
                    aria-label="Custom date to"
                    type="date"
                    value={customTo}
                    onChange={(e) => {
                      setCustomTo(e.target.value);
                      setVisibleActiveCount(4);
                    }}
                    className="h-11 w-36 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs font-semibold text-[#161A17] focus:border-[#004e27] focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE HABITS BENTO GRID */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#161A17]">
                <Sparkles className="size-5 text-[#004e27]" />
                <span>Active Habits ({activeHabits.length})</span>
              </h2>
            </div>

            {activeHabits.length === 0 ? (
              <div className="space-y-2 rounded-xl border border-dashed border-[var(--color-border-standard,#DDE5E1)] bg-white p-8 text-center">
                <p className="text-xs font-semibold text-[#3f4940]">No active habits found.</p>
                <p className="text-xs text-[#3f4940]">
                  Try adjusting your search query or filter settings.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {displayedActiveHabits.map((habit) => (
                    <div
                      key={habit.id}
                      className="group relative flex flex-col justify-between space-y-4 overflow-hidden rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-5 shadow-xs transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[#004e27]/60 hover:bg-[#fafcfb] hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none"
                    >
                      {/* Hover Accent Top Line Indicator */}
                      <div className="absolute top-0 left-0 h-1 w-full scale-x-0 bg-[#004e27] transition-transform duration-200 ease-out group-hover:scale-x-100 motion-reduce:hidden" />

                      <div>
                        {/* Card Header: Icon, Name, Category & Status Badge */}
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-[#f0f4f3] text-lg shadow-2xs transition-transform duration-200 ease-out group-hover:scale-110 group-hover:bg-[#e7f3ed] motion-reduce:transform-none">
                              {habit.iconName}
                            </span>
                            <div>
                              <h3 className="text-sm font-bold text-[#161A17] transition-colors duration-150 group-hover:text-[#004e27]">
                                {habit.name}
                              </h3>
                              <span className="rounded bg-[#f0f4f3] px-2 py-0.5 text-[11px] font-semibold text-[#004e27] transition-colors duration-150 group-hover:bg-[#e1f0e8]">
                                {habit.category}
                              </span>
                            </div>
                          </div>

                          <Badge
                            tone="success"
                            className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none"
                          >
                            <span className="size-1.5 animate-pulse rounded-full bg-[#004e27]" />
                            <span>Active</span>
                          </Badge>
                        </div>

                        {/* Normal & Minimum Target Cards */}
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-2.5 transition-all duration-150 group-hover:border-[#004e27]/30 group-hover:bg-[#f2f8f5]">
                            <span className="text-[11px] font-semibold text-[#3f4940]">
                              Normal:
                            </span>
                            <span className="flex items-center gap-1.5 font-bold text-[#161A17]">
                              <CheckCircle2 className="size-3.5 text-[#004e27]" />
                              <span>{habit.normalTarget}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-2.5 transition-all duration-150 group-hover:border-[#FBBF24] group-hover:bg-[#FEF3C7]">
                            <span className="text-[11px] font-semibold text-[#92400E]">
                              Minimum:
                            </span>
                            <span className="flex items-center gap-1.5 font-bold text-[#92400E]">
                              <Leaf className="size-3.5 text-[#F59E0B]" />
                              <span>{habit.minimumTarget}</span>
                            </span>
                          </div>
                        </div>

                        {/* Date, Clock & Streak Metadata */}
                        <div className="mt-3 space-y-1.5 border-t border-[var(--color-border-standard,#DDE5E1)] pt-3 text-xs text-[#3f4940]">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#161A17]">
                              <Calendar className="size-3.5 text-[#004e27]" />
                              <span>Started: {habit.createdDate}</span>
                            </span>
                            <span className="rounded-full bg-[#f0f4f3] px-2 py-0.5 text-[11px] font-bold text-[#004e27] transition-colors duration-150 group-hover:bg-[#e1f0e8]">
                              🔥 {habit.streak} Days ({habit.consistency}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#3f4940]">
                            <Clock className="size-3.5 text-[#004e27]" />
                            <span>{habit.schedule}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--color-border-standard,#DDE5E1)] pt-3">
                        <Button
                          size="compact"
                          variant="secondary"
                          onClick={() => handleOpenDetail(habit.id)}
                          className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-2.5 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-150 hover:border-[#004e27]/50 hover:bg-[#f0f4f3] hover:text-[#004e27] hover:shadow-xs active:scale-[0.98] motion-reduce:transform-none"
                        >
                          <Eye className="size-3.5 shrink-0 text-[#3f4940]" />
                          <span className="truncate">View Details</span>
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleTogglePause(habit.id)}
                          title="Pause Habit"
                          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] transition-all duration-150 hover:border-[#004e27]/50 hover:bg-[#f0f4f3] hover:text-[#004e27] hover:shadow-xs active:scale-[0.98] motion-reduce:transform-none"
                        >
                          <Pause className="size-3.5" />
                        </button>

                        <Button
                          size="compact"
                          variant="primary"
                          onClick={() => {
                            setSelectedHabitId(habit.id);
                            setCheckInDialogOpen(true);
                          }}
                          className="h-9 shrink-0 px-3 text-xs font-semibold whitespace-nowrap transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] motion-reduce:transform-none"
                        >
                          Check-in
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Show More / Show Less Button with Down Arrow */}
                {activeHabits.length > 4 && (
                  <div className="flex justify-center pt-3">
                    {hasMoreActiveHabits ? (
                      <Button
                        type="button"
                        size="compact"
                        variant="ghost"
                        onClick={() => setVisibleActiveCount((prev) => prev + 4)}
                        className="group inline-flex items-center gap-1.5 rounded-lg bg-transparent px-2 py-1 text-xs font-semibold text-[#004e27] hover:bg-transparent hover:text-[#004e27]/80"
                      >
                        <span>
                          Show More Habits ({activeHabits.length - visibleActiveCount} remaining)
                        </span>
                        <ChevronDown className="size-4 text-[#004e27] transition-transform duration-200 group-hover:translate-y-0.5" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="compact"
                        variant="ghost"
                        onClick={() => setVisibleActiveCount(4)}
                        className="group inline-flex items-center gap-1.5 rounded-lg bg-transparent px-2 py-1 text-xs font-semibold text-[#3f4940] hover:bg-transparent hover:text-[#161A17]"
                      >
                        <span>Show Less</span>
                        <ChevronUp className="size-4 text-[#3f4940] transition-transform duration-200 group-hover:-translate-y-0.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PAUSED HABITS SECTION */}
          {pausedHabits.length > 0 && (
            <div className="space-y-4 border-t border-[var(--color-border-standard,#DDE5E1)] pt-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#3f4940]">
                <Pause className="size-5 text-[#3f4940]" />
                <span>Paused Habits ({pausedHabits.length})</span>
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {pausedHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="group relative flex flex-col justify-between space-y-4 overflow-hidden rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9]/80 p-5 shadow-2xs transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[#3f4940]/50 hover:bg-white hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    {/* Hover Accent Top Line Indicator */}
                    <div className="absolute top-0 left-0 h-1 w-full scale-x-0 bg-[#3f4940] transition-transform duration-200 ease-out group-hover:scale-x-100 motion-reduce:hidden" />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white text-lg transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:transform-none">
                          {habit.iconName}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-[#161A17] transition-colors duration-150 group-hover:text-[#004e27]">
                            {habit.name}
                          </h3>
                          <span className="text-[11px] font-medium text-[#3f4940]">
                            {habit.category}
                          </span>
                        </div>
                      </div>

                      <Badge
                        tone="neutral"
                        className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none"
                      >
                        <span>Paused</span>
                      </Badge>
                    </div>

                    {/* Date & Clock Metadata */}
                    <div className="space-y-1.5 border-t border-[var(--color-border-standard,#DDE5E1)] pt-3 text-xs text-[#3f4940]">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#161A17]">
                          <Calendar className="size-3.5 text-[#3f4940]" />
                          <span>Started: {habit.createdDate}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#3f4940]">
                        <Clock className="size-3.5 text-[#3f4940]" />
                        <span>{habit.schedule}</span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--color-border-standard,#DDE5E1)] pt-3 text-xs">
                      <Button
                        size="compact"
                        variant="secondary"
                        onClick={() => handleOpenDetail(habit.id)}
                        className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-2.5 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-150 hover:border-[#3f4940]/50 hover:bg-[#f3f4f4] hover:shadow-xs active:scale-[0.98] motion-reduce:transform-none"
                      >
                        <Eye className="size-3.5 shrink-0 text-[#3f4940]" />
                        <span className="truncate">View Details</span>
                      </Button>

                      <Button
                        size="compact"
                        variant="secondary"
                        onClick={() => handleTogglePause(habit.id)}
                        className="flex h-9 shrink-0 items-center gap-1.5 border-[#004e27]/40 px-3 py-2 text-xs font-semibold whitespace-nowrap text-[#004e27] transition-all duration-150 hover:bg-[#f0f4f3] hover:shadow-xs active:scale-[0.98] motion-reduce:transform-none"
                      >
                        <Play className="size-3.5 shrink-0 fill-current" />
                        <span>Resume</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compassionate Recovery Banner */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-5 shadow-xs sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]">
                <Leaf className="size-5 text-[#F59E0B]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-[#161A17]">
                  Noticing Friction in your Routine?
                </h4>
                <p className="max-w-xl text-xs leading-relaxed text-[#3f4940]">
                  Habits naturally evolve. You can lower minimum targets or redesign habits anytime
                  without breaking past streak achievements.
                </p>
              </div>
            </div>

            <Button
              size="compact"
              variant="secondary"
              onClick={() => setRedesignDialogOpen(true)}
              className="self-start border-[#004e27] text-xs font-semibold whitespace-nowrap text-[#004e27] sm:self-auto"
            >
              Redesign a Habit
            </Button>
          </div>
        </div>
      )}

      {/* VIEW 2: HABIT DETAIL OVERVIEW SCREEN */}
      {viewMode === 'detail' && activeHabit && (
        <div className="mx-auto w-full max-w-[1024px] space-y-6 px-4 py-6 sm:px-6">
          {/* Header Bar with Back to Habits Button */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-standard,#DDE5E1)] pb-4">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="group flex items-center gap-1.5 text-xs font-bold text-[#3f4940] transition-colors hover:text-[#004e27]"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Habits</span>
            </button>

            <div className="flex items-center gap-2">
              <Button
                size="compact"
                variant="primary"
                onClick={() => setCheckInDialogOpen(true)}
                className="text-xs font-semibold shadow-xs"
              >
                Check-in
              </Button>
            </div>
          </div>

          {/* Header Details */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#161A17] sm:text-3xl">
                  {activeHabit.name}
                </h1>

                <Badge
                  tone={activeHabit.status === 'Active' ? 'success' : 'neutral'}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                >
                  <span
                    className={`size-2 rounded-full ${
                      activeHabit.status === 'Active'
                        ? 'animate-pulse bg-[#004e27]'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span>{activeHabit.status}</span>
                </Badge>
              </div>

              {activeHabit.description &&
                activeHabit.description.trim() !== '' &&
                !activeHabit.description.startsWith('Target:') && (
                  <p className="max-w-2xl text-xs leading-relaxed text-[#3f4940] sm:text-sm">
                    {activeHabit.description}
                  </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 md:pt-0">
              <Button
                size="compact"
                variant="secondary"
                onClick={() => setEditDialogOpen(true)}
                className="flex items-center gap-1.5 border border-[var(--color-border-standard,#DDE5E1)] bg-white text-xs font-semibold text-[#161A17] hover:bg-[#f3f4f4]"
              >
                <Pencil className="size-4 text-[#3f4940]" />
                <span>Edit</span>
              </Button>

              <Button
                size="compact"
                variant="secondary"
                onClick={() => setRedesignDialogOpen(true)}
                className="flex items-center gap-1.5 border border-[var(--color-border-standard,#DDE5E1)] bg-white text-xs font-semibold text-[#004e27] hover:bg-[#f0f4f3]"
              >
                <Wrench className="size-3.5" />
                <span>Redesign</span>
              </Button>

              <button
                type="button"
                onClick={() => handleTogglePause(activeHabit.id)}
                title={activeHabit.status === 'Active' ? 'Pause Habit' : 'Resume Habit'}
                className="flex size-9 items-center justify-center rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] transition-colors hover:bg-[#f3f4f4]"
              >
                {activeHabit.status === 'Active' ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4 text-[#004e27]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setDeleteDialogOpen(true)}
                title="Delete Habit"
                className="flex size-9 items-center justify-center rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="custom-scrollbar flex overflow-x-auto border-b border-[var(--color-border-standard,#DDE5E1)]">
            <button
              type="button"
              onClick={() => setDetailTab('overview')}
              className={`border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
                detailTab === 'overview'
                  ? 'border-[#004e27] font-bold text-[#004e27]'
                  : 'border-transparent text-[#3f4940] hover:text-[#161A17]'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setDetailTab('history')}
              className={`border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                detailTab === 'history'
                  ? 'border-[#004e27] font-bold text-[#004e27]'
                  : 'border-transparent text-[#3f4940] hover:text-[#161A17]'
              }`}
            >
              History
            </button>
            <button
              type="button"
              onClick={() => setDetailTab('changes')}
              className={`border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                detailTab === 'changes'
                  ? 'border-[#004e27] font-bold text-[#004e27]'
                  : 'border-transparent text-[#3f4940] hover:text-[#161A17]'
              }`}
            >
              Insights & Changes
            </button>
          </div>

          {/* Tab Content */}
          {detailTab === 'overview' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="col-span-1 space-y-4 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-5 shadow-xs">
                <h2 className="flex items-center gap-2 text-base font-bold text-[#161A17]">
                  <Sparkles className="size-5 text-[#004e27]" />
                  <span>Current Definition</span>
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-4">
                    <span className="block text-[11px] font-semibold tracking-wider text-[#3f4940] uppercase">
                      Normal Target
                    </span>
                    <p className="flex items-center gap-2 text-xs font-bold text-[#161A17]">
                      <CheckCircle2 className="size-4 shrink-0 text-[#004e27]" />
                      <span>{activeHabit.normalTarget}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-4">
                    <span className="block text-[11px] font-semibold tracking-wider text-[#92400E] uppercase">
                      Minimum Target
                    </span>
                    <p className="flex items-center gap-2 text-xs font-bold text-[#92400E]">
                      <Leaf className="size-4 shrink-0 text-[#F59E0B]" />
                      <span>{activeHabit.minimumTarget}</span>
                    </p>
                    <p className="pt-0.5 text-[11px] text-[#92400E]/80">
                      Compassionate baseline for low-energy days.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-3.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#004e27]">
                      <Calendar className="size-4" />
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-[#3f4940]">Schedule</span>
                      <span className="text-xs font-bold text-[#161A17]">
                        {activeHabit.schedule}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-3.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3B82F6]">
                      <Sun className="size-4" />
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-[#3f4940]">
                        Cue & Reminder Summary
                      </span>
                      <span className="text-xs font-bold text-[#161A17]">{activeHabit.cue}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Continuity Card */}
              <div className="col-span-1 space-y-4 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-5 shadow-xs">
                <h2 className="flex items-center gap-2 text-base font-bold text-[#161A17]">
                  <TrendingUp className="size-5 text-[#004e27]" />
                  <span>Continuity</span>
                </h2>

                <div className="flex gap-3">
                  <div className="flex-1 rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-3 text-center">
                    <p className="text-2xl font-bold text-[#004e27]">{activeHabit.streak}</p>
                    <p className="text-[11px] font-medium text-[#3f4940]">Current Streak</p>
                  </div>
                  <div className="flex-1 rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-3 text-center">
                    <p className="text-2xl font-bold text-[#161A17]">
                      {activeHabit.consistency}
                      <span className="text-sm">%</span>
                    </p>
                    <p className="text-[11px] font-medium text-[#3f4940]">Consistency</p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="block text-[11px] font-semibold text-[#3f4940]">
                    Completion Distribution (Last 30 days)
                  </span>
                  <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-[#e1e3e3]">
                    <div className="h-full bg-[#004e27]" style={{ width: '70%' }} />
                    <div className="h-full bg-[#F59E0B]" style={{ width: '22%' }} />
                    <div className="h-full bg-[#9fa9a4]" style={{ width: '8%' }} />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#3f4940]">
                    <span className="flex items-center gap-1">
                      <span className="size-2 rounded-full bg-[#004e27]" /> Full (70%)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-2 rounded-full bg-[#F59E0B]" /> Min (22%)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-2 rounded-full bg-[#9fa9a4]" /> Skip (8%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: History (Interactive 28-Day Heatmap & Logs) */}
          {detailTab === 'history' && (
            <div className="space-y-6">
              <div className="space-y-4 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-6 shadow-xs">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-bold text-[#161A17]">
                      <RotateCcw className="size-5 text-[#004e27]" />
                      <span>Completion History Log</span>
                    </h2>
                    <p className="mt-0.5 text-xs text-[#3f4940]">
                      Interactive daily check-in log for {activeHabit.name}.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-[#3f4940]">
                    <span className="flex items-center gap-1">
                      <span className="size-2.5 rounded-full bg-[#004e27]" /> Full
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-2.5 rounded-full bg-[#F59E0B]" /> Minimum
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-2.5 rounded-full bg-[#cbd5e1]" /> Skipped
                    </span>
                  </div>
                </div>

                {/* 28-Day Heatmap Grid */}
                <div className="grid grid-cols-7 gap-2 pt-2">
                  {Array.from({ length: 28 }).map((_, idx) => {
                    const isMin = idx === 4 || idx === 11 || idx === 18;
                    const isSkip = idx === 8 || idx === 22;
                    const outcome = isSkip ? 'Skipped' : isMin ? 'Minimum Target' : 'Full Target';
                    const bg = isSkip
                      ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      : isMin
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                        : 'bg-[#e7f3ed] text-[#004e27] hover:bg-[#d5ebd0] border border-[#004e27]/20';
                    return (
                      <div
                        key={idx}
                        title={`Day ${28 - idx}: ${outcome}`}
                        className={cn(
                          'flex h-10 cursor-pointer flex-col items-center justify-center rounded-lg text-xs font-semibold shadow-2xs transition-all duration-150 hover:scale-105',
                          bg,
                        )}
                      >
                        <span className="text-[10px] opacity-70">Day {28 - idx}</span>
                        <span className="text-[11px] font-bold">
                          {isSkip ? '—' : isMin ? 'Min' : 'Full'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Outcome Log Items */}
              <div className="space-y-3 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-6 shadow-xs">
                <h3 className="text-sm font-bold text-[#161A17]">Recent Check-in Logs</h3>
                <div className="divide-y divide-[var(--color-border-standard,#DDE5E1)] text-xs">
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-7 items-center justify-center rounded-full bg-[#e7f3ed] text-[#004e27]">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#161A17]">Yesterday (08:15 AM)</p>
                        <p className="text-[#3f4940]">
                          Full Completion — {activeHabit.normalTarget}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md bg-[#e7f3ed] px-2.5 py-1 font-bold text-[#004e27]">
                      Full
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                        <Leaf className="size-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#161A17]">2 days ago (08:45 AM)</p>
                        <p className="text-[#3f4940]">
                          Minimum Baseline Used — {activeHabit.minimumTarget}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md bg-amber-100 px-2.5 py-1 font-bold text-amber-800">
                      Minimum
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <Calendar className="size-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#161A17]">3 days ago</p>
                        <p className="text-[#3f4940]">Planned Rest / Skipped Day (No penalty)</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 font-bold text-slate-600">
                      Skipped
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Insights & Changes */}
          {detailTab === 'changes' && (
            <div className="space-y-4">
              <div className="space-y-4 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-6 shadow-xs">
                <h2 className="flex items-center gap-2 text-base font-bold text-[#161A17]">
                  <TrendingUp className="size-5 text-[#004e27]" />
                  <span>Friction Analysis & Insights</span>
                </h2>
                <p className="text-xs text-[#3f4940]">
                  Automated insights derived from check-in timing and baseline outcomes over the
                  past 30 days.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 rounded-xl border border-[#004e27]/20 bg-[#f4f9f6] p-4 text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#004e27]">
                      <Sparkles className="size-4 text-[#004e27]" />
                      <span>Optimal Cue Window</span>
                    </div>
                    <p className="leading-relaxed text-[#161A17]">
                      You achieve Full Completions <strong>88% more reliably</strong> when checked
                      in between <strong>08:00 AM - 09:00 AM</strong> immediately after morning
                      coffee.
                    </p>
                  </div>

                  <div className="space-y-2 rounded-xl border border-amber-200 bg-[#FFFBEB] p-4 text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                      <Leaf className="size-4 text-amber-600" />
                      <span>Recovery Protection</span>
                    </div>
                    <p className="leading-relaxed text-amber-900">
                      Your Minimum Target ({activeHabit.minimumTarget}) was triggered 3 times on
                      low-energy days, preventing streak resets and maintaining positive momentum.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#161A17]">Need to adjust targets?</h4>
                    <p className="text-[11px] text-[#3f4940]">
                      Redesign your baseline anytime without deleting historical completion metrics.
                    </p>
                  </div>
                  <Button
                    size="compact"
                    variant="secondary"
                    onClick={() => setRedesignDialogOpen(true)}
                    className="border-[#004e27] text-xs font-semibold whitespace-nowrap text-[#004e27]"
                  >
                    <Wrench className="mr-1 size-3.5" />
                    <span>Redesign Baseline</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DIALOG 1: CREATE HABIT (Unified Rich Modal) */}
      <CreateHabitDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleCreateHabitSubmit}
        existingNames={habitsList.map((h) => h.name)}
      />

      {/* DIALOG 2: EDIT HABIT (Unified Rich Modal) */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <div className="flex flex-col gap-1 border-b border-[var(--color-border-standard,#DDE5E1)] pb-3">
            <div className="flex items-center gap-2">
              <Pencil className="size-5 text-[#004e27]" />
              <DialogTitle className="text-lg font-bold text-[#161A17]">Edit Habit</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-[#3f4940]">
              Modify parameters for habit: {activeHabit?.name || editName}
            </DialogDescription>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e8eee9]">
              <div className="h-full w-full rounded-full bg-[#004e27] transition-all" />
            </div>
          </div>

          <form onSubmit={handleSaveEditSubmit} className="space-y-4 pt-2 text-xs">
            {/* Habit Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#161A17]" htmlFor="editName">
                Habit Name <span className="text-red-500">*</span>
              </label>
              <input
                id="editName"
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Daily Walk & Fresh Air"
                className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs text-[#161A17] focus:border-[#004e27] focus:outline-none"
              />
            </div>

            {/* Category Grid */}
            <div className="space-y-2 border-t border-[var(--color-border-standard,#DDE5E1)] pt-3">
              <span className="block text-xs font-semibold text-[#161A17]">Category</span>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORY_OPTIONS.map((cat) => {
                  const IconComp = cat.Icon;
                  const isSelected = editCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEditCategory(cat.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-semibold transition-all',
                        isSelected
                          ? 'border-[#004e27] bg-[#96f4a8]/20 font-bold text-[#004e27] shadow-xs'
                          : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:border-[#004e27]/40',
                      )}
                    >
                      <IconComp
                        className={cn(
                          'size-4 shrink-0',
                          isSelected ? 'text-[#004e27]' : 'text-[#3f4940]',
                        )}
                      />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Definition Grid: Normal & Minimum Target */}
            <div className="space-y-3 border-t border-[var(--color-border-standard,#DDE5E1)] pt-3">
              <span className="block text-xs font-semibold text-[#161A17]">
                Define Your Habit Targets
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Normal Target */}
                <div className="space-y-1">
                  <label
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-[#161A17]"
                    htmlFor="editFull"
                  >
                    <CheckCircle2 className="size-4 text-[#004e27]" />
                    <span>Normal Target</span>
                  </label>
                  <input
                    id="editFull"
                    type="text"
                    required
                    value={editNormal}
                    onChange={(e) => setEditNormal(e.target.value)}
                    placeholder="e.g. 30 mins walk"
                    className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs text-[#161A17] focus:border-[#004e27] focus:outline-none"
                  />
                  <p className="text-[10px] text-[#3f4940]">Standard target for normal days</p>
                </div>

                {/* Minimum Target */}
                <div className="space-y-1">
                  <label
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-[#161A17]"
                    htmlFor="editMin"
                  >
                    <Leaf className="size-4 text-[#F59E0B]" />
                    <span>Minimum Target</span>
                  </label>
                  <div className="flex h-10 items-center rounded-lg border border-amber-300/70 bg-[#FFFBEB] px-3 transition-all focus-within:border-[#F59E0B] focus-within:ring-2 focus-within:ring-[#F59E0B]/20">
                    <Leaf className="mr-2 size-4 shrink-0 text-[#F59E0B]" />
                    <input
                      id="editMin"
                      type="text"
                      required
                      value={editMinimum}
                      onChange={(e) => setEditMinimum(e.target.value)}
                      placeholder="e.g. 5 mins walk"
                      className="w-full border-none bg-transparent text-xs text-[#161A17] focus:ring-0 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-[#3f4940]">Your non-zero effort for hard days</p>
                </div>
              </div>
            </div>

            {/* Choose Icon */}
            <div className="space-y-2 border-t border-[var(--color-border-standard,#DDE5E1)] pt-3">
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
                      className={cn(
                        'flex size-9 items-center justify-center rounded-lg transition-all',
                        isSelected
                          ? 'bg-[#004e27] font-bold text-white shadow-xs ring-2 ring-[#004e27]'
                          : 'text-[#3f4940] hover:bg-white hover:text-[#004e27]',
                      )}
                      title={opt.label}
                    >
                      <IconComp className="size-4.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clock Schedule */}
            <div className="space-y-3 border-t border-[var(--color-border-standard,#DDE5E1)] pt-3">
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
                    className={cn(
                      'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
                      editFromTime === p.from && editUntilTime === p.until
                        ? 'border-[#004e27] bg-[#96f4a8]/30 font-bold text-[#027235]'
                        : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:border-[#004e27]/40',
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description textarea */}
            <div className="space-y-1 border-t border-[var(--color-border-standard,#DDE5E1)] pt-3">
              <label className="font-semibold text-[#161A17]" htmlFor="editDesc">
                Description & Notes <span className="font-normal text-[#3f4940]">(optional)</span>
              </label>
              <textarea
                id="editDesc"
                rows={2}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="e.g. Personal motivations or cues for this habit..."
                className="w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white p-2.5 text-xs text-[#161A17] focus:border-[#004e27] focus:outline-none"
              />
            </div>

            {/* Start Date Calendar Section */}
            <div className="space-y-2 border-t border-[var(--color-border-standard,#DDE5E1)] pt-3">
              <label
                className="flex items-center gap-1.5 font-semibold text-[#161A17]"
                htmlFor="editStartDate"
              >
                <Calendar className="size-4 text-[#004e27]" />
                <span>Start Date (Calendar)</span>
              </label>
              <input
                id="editStartDate"
                type="date"
                required
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs font-semibold text-[#161A17] focus:border-[#004e27] focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setEditDate(getTodayDateStr())}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
                    editDate === getTodayDateStr()
                      ? 'border-[#004e27] bg-[#96f4a8]/30 font-bold text-[#027235]'
                      : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:border-[#004e27]/40',
                  )}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setEditDate(getTomorrowDateStr())}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
                    editDate === getTomorrowDateStr()
                      ? 'border-[#004e27] bg-[#96f4a8]/30 font-bold text-[#027235]'
                      : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:border-[#004e27]/40',
                  )}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setEditDate(getNextMondayDateStr())}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
                    editDate === getNextMondayDateStr()
                      ? 'border-[#004e27] bg-[#96f4a8]/30 font-bold text-[#027235]'
                      : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:border-[#004e27]/40',
                  )}
                >
                  Next Monday
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--color-border-standard,#DDE5E1)] pt-4">
              <Button
                type="button"
                size="compact"
                variant="secondary"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="compact" variant="primary">
                Save Specifications
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: DELETE HABIT */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-red-600">
            <AlertTriangle className="size-5 text-red-600" />
            <span>Delete Habit</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#3f4940]">
            Move {activeHabit?.name} to archive/trash.
          </DialogDescription>

          <div className="mt-4 space-y-4 text-xs">
            <p className="text-[#3f4940]">
              Are you sure you want to delete <strong>{activeHabit?.name}</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="compact" variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="compact" variant="danger" onClick={handleDeleteHabitConfirm}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: CHECK-IN */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#161A17]">
            <CheckCircle2 className="size-5 text-[#004e27]" />
            <span>Quick Check-in</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#3f4940]">
            Record today&apos;s participation level.
          </DialogDescription>

          <div className="mt-4 space-y-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setCheckInDialogOpen(false);
                showToast('Recorded Full Completion!');
              }}
              className="flex w-full items-center justify-between rounded-xl border border-[var(--color-border-standard,#DDE5E1)] p-3.5 text-left transition-all hover:border-[#004e27] hover:bg-[#f0f4f3]"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-[#004e27]" />
                <div>
                  <span className="block font-bold text-[#161A17]">Full Completion</span>
                  <span className="text-[#3f4940]">{activeHabit?.normalTarget}</span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setCheckInDialogOpen(false);
                showToast('Recorded Minimum Version!');
              }}
              className="flex w-full items-center justify-between rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3.5 text-left transition-all hover:border-[#F59E0B]"
            >
              <div className="flex items-center gap-3">
                <Leaf className="size-5 text-[#F59E0B]" />
                <div>
                  <span className="block font-bold text-[#92400E]">Minimum Version</span>
                  <span className="text-[#92400E]/90">{activeHabit?.minimumTarget}</span>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 5: REDESIGN HABIT */}
      <Dialog open={redesignDialogOpen} onOpenChange={setRedesignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#161A17]">
            <Wrench className="size-5 text-[#004e27]" />
            <span>Redesign Habit</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#3f4940]">
            Adjust habit parameters without losing past continuity history.
          </DialogDescription>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setRedesignDialogOpen(false);
              showToast('Habit redesigned and updated to version v4!');
            }}
            className="mt-4 space-y-3.5 text-xs"
          >
            <p className="leading-relaxed text-[#3f4940]">
              Redesigning creates a fresh version while preserving all past streak achievements and
              check-in logs.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                size="compact"
                variant="secondary"
                onClick={() => setRedesignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="compact" variant="primary">
                Confirm Redesign
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
