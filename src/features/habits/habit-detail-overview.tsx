'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Leaf,
  Sun,
  Pencil,
  Pause,
  Play,
  Trash2,
  Sparkles,
  TrendingUp,
  Info,
  Calendar,
  Wrench,
  RotateCcw,
  AlertTriangle,
  Plus,
} from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { CreateHabitDialog } from '@/features/habits/create-habit-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { routes } from '@/lib/navigation/route-definitions';
import { cn } from '@/lib/cn';

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

export function HabitDetailOverview(): React.JSX.Element {
  // Habit lifecycle state
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'changes'>('overview');

  // Habit details state
  const [habitName, setHabitName] = useState('Daily Meditation');
  const [habitDescription, setHabitDescription] = useState(
    'A moment of grounding to start the day with clarity and intention.',
  );
  const [normalTarget, setNormalTarget] = useState('30 mins meditation');
  const [minimumTarget, setMinimumTarget] = useState('5 mins stretching');
  const [scheduleContext] = useState('Daily (08:00 AM - 09:00 AM)');
  const [cueContext] = useState('After morning coffee / 08:00 AM Notification');

  // Dialog States
  const [createHabitDialogOpen, setCreateHabitDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [redesignDialogOpen, setRedesignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);

  // Edit Form Fields
  const [editNameInput, setEditNameInput] = useState(habitName);
  const [editDescInput, setEditDescInput] = useState(habitDescription);
  const [editNormalInput, setEditNormalInput] = useState(normalTarget);
  const [editMinimumInput, setEditMinimumInput] = useState(minimumTarget);
  const [editDateInput, setEditDateInput] = useState(getTodayDateStr());

  // Toast Feedback State
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

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNameInput.trim()) return;
    setHabitName(editNameInput.trim());
    setHabitDescription(editDescInput.trim());
    setNormalTarget(editNormalInput.trim());
    setMinimumTarget(editMinimumInput.trim());
    setEditDialogOpen(false);
    showToast(`Habit "${editNameInput.trim()}" specifications updated!`);
  };

  const handleRedesignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRedesignDialogOpen(false);
    showToast('New habit version v4 generated based on Recovery parameters!');
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    showToast('Habit moved to archive/trash');
  };

  return (
    <AppShell onOpenCreateHabit={() => setCreateHabitDialogOpen(true)}>
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

      <CreateHabitDialog open={createHabitDialogOpen} onOpenChange={setCreateHabitDialogOpen} />

      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={routes.habits}
              className="group flex items-center gap-1 text-xs font-semibold text-[#3f4940] transition-colors hover:text-[#004e27]"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Habits</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="compact"
              variant="primary"
              onClick={() => setCreateHabitDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold shadow-xs"
            >
              <Plus className="size-3.5 shrink-0" />
              <span>Add Habit</span>
            </Button>
            <Button
              size="compact"
              variant="secondary"
              className="hidden text-xs font-semibold sm:inline-flex"
              onClick={() => showToast('Filters applied')}
            >
              Filter
            </Button>
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
      </header>

      {/* Main Page Canvas (Max 1024px as per UI-SPEC.md & Stitch design) */}
      <div className="mx-auto w-full max-w-[1024px] space-y-6 px-4 py-6 sm:px-6">
        {/* Header Section: Title, Status Badge, Description & Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#161A17] sm:text-3xl">{habitName}</h1>

              {/* Status Badge using Labels and Dot Indicator (Not color alone) */}
              <Badge
                tone={isPaused ? 'neutral' : 'success'}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              >
                <span
                  className={`size-2 rounded-full ${
                    isPaused ? 'bg-amber-500' : 'animate-pulse bg-[#004e27]'
                  }`}
                />
                <span>{isPaused ? 'Paused' : 'Active'}</span>
              </Badge>
            </div>

            <p className="max-w-2xl text-xs leading-relaxed text-[#3f4940] sm:text-sm">
              {habitDescription}
            </p>
          </div>

          {/* Action Button Hierarchy (Destructive action is subtle, not dominant) */}
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

            <button
              type="button"
              onClick={() => {
                setIsPaused(!isPaused);
                showToast(`Habit ${isPaused ? 'resumed' : 'paused'}`);
              }}
              title={isPaused ? 'Resume Habit' : 'Pause Habit'}
              className="flex size-9 items-center justify-center rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] transition-colors hover:bg-[#f3f4f4]"
            >
              {isPaused ? <Play className="size-4 text-[#004e27]" /> : <Pause className="size-4" />}
            </button>

            <button
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              title="Delete Habit"
              className="flex size-9 items-center justify-center rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white text-red-600 transition-colors hover:border-red-200 hover:bg-red-50"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Approved Stitch Tab Style) */}
        <div className="custom-scrollbar flex overflow-x-auto border-b border-[var(--color-border-standard,#DDE5E1)]">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'border-[#004e27] text-[#004e27]'
                : 'border-transparent text-[#3f4940] hover:text-[#161A17]'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'history'
                ? 'border-[#004e27] font-bold text-[#004e27]'
                : 'border-transparent text-[#3f4940] hover:text-[#161A17]'
            }`}
          >
            History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('changes')}
            className={`border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'changes'
                ? 'border-[#004e27] font-bold text-[#004e27]'
                : 'border-transparent text-[#3f4940] hover:text-[#161A17]'
            }`}
          >
            Insights & Changes
          </button>
        </div>

        {/* Overview Tab Content (Bento Content Grid) */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Bento Card 1: Current Definition (Spans 2 cols on md+) */}
            <div className="col-span-1 space-y-4 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-5 shadow-xs md:col-span-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#161A17]">
                <Sparkles className="size-5 text-[#004e27]" />
                <span>Current Definition</span>
              </h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Normal Target Box */}
                <div className="space-y-1.5 rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-4">
                  <span className="block text-[11px] font-semibold tracking-wider text-[#3f4940] uppercase">
                    Normal Target
                  </span>
                  <p className="flex items-center gap-2 text-xs font-bold text-[#161A17]">
                    <CheckCircle2 className="size-4 shrink-0 text-[#004e27]" />
                    <span>{normalTarget}</span>
                  </p>
                </div>

                {/* Minimum Target Box (Recovery First Amber Theme) */}
                <div className="space-y-1.5 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-4">
                  <span className="block text-[11px] font-semibold tracking-wider text-[#92400E] uppercase">
                    Minimum Target
                  </span>
                  <p className="flex items-center gap-2 text-xs font-bold text-[#92400E]">
                    <Leaf className="size-4 shrink-0 text-[#F59E0B]" />
                    <span>{minimumTarget}</span>
                  </p>
                  <p className="pt-0.5 text-[11px] text-[#92400E]/80">
                    Compassionate baseline for low-energy days.
                  </p>
                </div>

                {/* Schedule Box */}
                <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#004e27]">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-medium text-[#3f4940]">Schedule</span>
                    <span className="text-xs font-bold text-[#161A17]">{scheduleContext}</span>
                  </div>
                </div>

                {/* Cue & Reminder Box */}
                <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3B82F6]">
                    <Sun className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-medium text-[#3f4940]">
                      Cue & Reminder Summary
                    </span>
                    <span className="text-xs font-bold text-[#161A17]">{cueContext}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Continuity & Consistency */}
            <div className="col-span-1 space-y-4 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-5 shadow-xs">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#161A17]">
                <TrendingUp className="size-5 text-[#004e27]" />
                <span>Continuity</span>
              </h2>

              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-3 text-center">
                  <p className="text-2xl font-bold text-[#004e27]">12</p>
                  <p className="text-[11px] font-medium text-[#3f4940]">Current Streak</p>
                </div>
                <div className="flex-1 rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-3 text-center">
                  <p className="text-2xl font-bold text-[#161A17]">
                    92<span className="text-sm">%</span>
                  </p>
                  <p className="text-[11px] font-medium text-[#3f4940]">Consistency</p>
                </div>
              </div>

              {/* 30-Day Completion Distribution */}
              <div className="space-y-2 pt-1">
                <span className="block text-[11px] font-semibold text-[#3f4940]">
                  Completion Distribution (Last 30 days)
                </span>
                <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-[#e1e3e3]">
                  <div
                    className="h-full bg-[#004e27]"
                    style={{ width: '70%' }}
                    title="Full Completions: 70%"
                  />
                  <div
                    className="h-full bg-[#F59E0B]"
                    style={{ width: '22%' }}
                    title="Minimum Completions: 22%"
                  />
                  <div
                    className="h-full bg-[#9fa9a4]"
                    style={{ width: '8%' }}
                    title="Skipped: 8%"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#3f4940]">
                  <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-[#004e27]" />
                    <span>Full (70%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-[#F59E0B]" />
                    <span>Minimum (22%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-[#9fa9a4]" />
                    <span>Skipped (8%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Lifecycle Metadata */}
            <div className="col-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-5 shadow-xs md:col-span-2 lg:col-span-1">
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#161A17]">
                  <Info className="size-5 text-[#3f4940]" />
                  <span>Lifecycle</span>
                </h2>

                <ul className="space-y-3 text-xs">
                  <li className="flex items-center justify-between border-b border-[var(--color-border-standard,#DDE5E1)] pb-2">
                    <span className="font-medium text-[#3f4940]">Created</span>
                    <span className="font-semibold text-[#161A17]">Oct 12, 2023</span>
                  </li>
                  <li className="flex items-center justify-between border-b border-[var(--color-border-standard,#DDE5E1)] pb-2">
                    <span className="font-medium text-[#3f4940]">Current Version</span>
                    <span className="rounded bg-[#f0f4f3] px-2 py-0.5 text-xs font-bold text-[#004e27]">
                      v3
                    </span>
                  </li>
                  <li className="flex items-center justify-between border-b border-[var(--color-border-standard,#DDE5E1)] pb-2">
                    <span className="font-medium text-[#3f4940]">Last Modified</span>
                    <span className="font-semibold text-[#161A17]">2 weeks ago</span>
                  </li>
                </ul>
              </div>

              {/* Redesign Callout Box */}
              <div className="space-y-3 rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-4 text-center">
                <p className="text-xs leading-relaxed text-[#3f4940]">
                  Habits evolve. If this isn’t working for you anymore, consider a redesign rather
                  than giving up.
                </p>
                <Button
                  size="compact"
                  variant="secondary"
                  fullWidth
                  onClick={() => setRedesignDialogOpen(true)}
                  className="flex items-center justify-center gap-1.5 border-[#004e27] text-xs font-semibold text-[#004e27] hover:bg-emerald-50"
                >
                  <Wrench className="size-3.5" />
                  <span>Redesign Habit</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* History Tab View (28-Day Heatmap & Logs) */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="space-y-4 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-6 shadow-xs">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-[#161A17]">
                    <RotateCcw className="size-5 text-[#004e27]" />
                    <span>Completion History Log</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-[#3f4940]">
                    Historical check-in logs for {habitName}.
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
                      <p className="text-[#3f4940]">Full Completion — {normalTarget}</p>
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
                      <p className="text-[#3f4940]">Minimum Baseline Used — {minimumTarget}</p>
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

        {/* Insights & Changes Tab View */}
        {activeTab === 'changes' && (
          <div className="space-y-4">
            <div className="space-y-4 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-6 shadow-xs">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#161A17]">
                <TrendingUp className="size-5 text-[#004e27]" />
                <span>Friction Analysis & Insights</span>
              </h2>
              <p className="text-xs text-[#3f4940]">
                Automated insights derived from check-in timing and baseline outcomes over the past
                30 days.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-[#004e27]/20 bg-[#f4f9f6] p-4 text-xs">
                  <div className="flex items-center gap-2 font-bold text-[#004e27]">
                    <Sparkles className="size-4 text-[#004e27]" />
                    <span>Optimal Cue Window</span>
                  </div>
                  <p className="leading-relaxed text-[#161A17]">
                    You achieve Full Completions <strong>88% more reliably</strong> when checked in
                    between <strong>08:00 AM - 09:00 AM</strong> immediately after morning coffee.
                  </p>
                </div>

                <div className="space-y-2 rounded-xl border border-amber-200 bg-[#FFFBEB] p-4 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <Leaf className="size-4 text-amber-600" />
                    <span>Recovery Protection</span>
                  </div>
                  <p className="leading-relaxed text-amber-900">
                    Your Minimum Target ({minimumTarget}) was triggered 3 times on low-energy days,
                    preventing streak resets and maintaining positive momentum.
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

      {/* Dialog 1: Edit Specifications */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#161A17]">
            <Pencil className="size-5 text-[#004e27]" />
            <span>Edit Habit Specifications</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#3f4940]">
            Update parameters for {habitName}.
          </DialogDescription>

          <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#161A17]" htmlFor="editNameField">
                Habit Name
              </label>
              <input
                id="editNameField"
                type="text"
                required
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs text-[#161A17] focus:border-[#004e27] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#161A17]" htmlFor="editDescField">
                Description
              </label>
              <textarea
                id="editDescField"
                rows={2}
                value={editDescInput}
                onChange={(e) => setEditDescInput(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white p-2.5 text-xs text-[#161A17] focus:border-[#004e27] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#161A17]" htmlFor="editNormalField">
                Normal Target
              </label>
              <input
                id="editNormalField"
                type="text"
                value={editNormalInput}
                onChange={(e) => setEditNormalInput(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs text-[#161A17] focus:border-[#004e27] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#161A17]" htmlFor="editMinimumField">
                Minimum Target
              </label>
              <input
                id="editMinimumField"
                type="text"
                value={editMinimumInput}
                onChange={(e) => setEditMinimumInput(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 text-xs text-[#92400E] focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            {/* Start Date Calendar Section */}
            <div className="space-y-2 border-t border-[var(--color-border-standard,#DDE5E1)] pt-3">
              <label
                className="flex items-center gap-1.5 font-semibold text-[#161A17]"
                htmlFor="editStartDateField"
              >
                <Calendar className="size-4 text-[#004e27]" />
                <span>Start Date (Calendar)</span>
              </label>
              <input
                id="editStartDateField"
                type="date"
                required
                value={editDateInput}
                onChange={(e) => setEditDateInput(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs font-semibold text-[#161A17] focus:border-[#004e27] focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setEditDateInput(getTodayDateStr())}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
                    editDateInput === getTodayDateStr()
                      ? 'border-[#004e27] bg-[#96f4a8]/30 font-bold text-[#027235]'
                      : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:border-[#004e27]/40',
                  )}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setEditDateInput(getTomorrowDateStr())}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
                    editDateInput === getTomorrowDateStr()
                      ? 'border-[#004e27] bg-[#96f4a8]/30 font-bold text-[#027235]'
                      : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:border-[#004e27]/40',
                  )}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setEditDateInput(getNextMondayDateStr())}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
                    editDateInput === getNextMondayDateStr()
                      ? 'border-[#004e27] bg-[#96f4a8]/30 font-bold text-[#027235]'
                      : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:border-[#004e27]/40',
                  )}
                >
                  Next Monday
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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

      {/* Dialog 2: Redesign Habit */}
      <Dialog open={redesignDialogOpen} onOpenChange={setRedesignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#161A17]">
            <Wrench className="size-5 text-[#004e27]" />
            <span>Redesign Habit</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#3f4940]">
            Create a fresh version without losing past continuity history.
          </DialogDescription>

          <form onSubmit={handleRedesignSubmit} className="mt-4 space-y-3.5 text-xs">
            <p className="leading-relaxed text-[#3f4940]">
              Redesigning creates <strong>Version v4</strong>. Your past check-in history and streak
              records remain permanently preserved.
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

      {/* Dialog 3: Delete Habit Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-red-600">
            <AlertTriangle className="size-5 text-red-600" />
            <span>Delete Habit</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#3f4940]">
            Move {habitName} to trash/archive.
          </DialogDescription>

          <div className="mt-4 space-y-4 text-xs">
            <p className="text-[#3f4940]">
              Are you sure you want to delete <strong>{habitName}</strong>? This action can be
              reversed from settings archive.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="compact" variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="compact" variant="danger" onClick={handleDeleteConfirm}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog 4: Quick Check-in Dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#161A17]">
            <CheckCircle2 className="size-5 text-[#004e27]" />
            <span>Quick Check-in</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#3f4940]">
            Record today&apos;s participation level for {habitName}.
          </DialogDescription>

          <div className="mt-4 space-y-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setCheckInDialogOpen(false);
                showToast('Recorded Full Completion!');
              }}
              className="flex w-full items-center justify-between rounded-xl border border-[var(--color-border-standard,#DDE5E1)] p-3.5 text-left transition-all hover:border-[#004e27] hover:bg-emerald-50/50"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-[#004e27]" />
                <div>
                  <span className="block font-bold text-[#161A17]">Full Completion</span>
                  <span className="text-[#3f4940]">{normalTarget}</span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setCheckInDialogOpen(false);
                showToast('Recorded Minimum Version!');
              }}
              className="flex w-full items-center justify-between rounded-xl border border-amber-300/70 bg-[#FFFBEB] p-3.5 text-left transition-all hover:border-[#F59E0B]"
            >
              <div className="flex items-center gap-3">
                <Leaf className="size-5 text-[#F59E0B]" />
                <div>
                  <span className="block font-bold text-[#92400E]">Minimum Version</span>
                  <span className="text-[#92400E]/90">{minimumTarget}</span>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
