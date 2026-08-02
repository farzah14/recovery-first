'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info, Minus, Leaf, Check, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type TargetStatus = 'unrecorded' | 'minimum' | 'full';

interface HabitItem {
  id: string;
  name: string;
  minimumLabel: string;
  fullLabel: string;
  status: TargetStatus;
}

interface ToastState {
  message: string;
  visible: boolean;
  isFadingOut: boolean;
}

export function HeroMockup(): React.JSX.Element {
  const [habits, setHabits] = useState<HabitItem[]>([
    {
      id: 'h1',
      name: 'Morning Walk',
      minimumLabel: 'Minimum 10m',
      fullLabel: 'Full 30m',
      status: 'minimum',
    },
    {
      id: 'h2',
      name: 'Deep Reading',
      minimumLabel: 'Minimum 5 pgs',
      fullLabel: 'Full 30m',
      status: 'full',
    },
    {
      id: 'h3',
      name: 'Evening Stretch',
      minimumLabel: 'Minimum 2m',
      fullLabel: 'Full 15m',
      status: 'unrecorded',
    },
  ]);

  const [toast, setToast] = useState<ToastState>({
    message: '',
    visible: false,
    isFadingOut: false,
  });

  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = (msg: string) => {
    // Clear previous timers if present
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    setToast({ message: msg, visible: true, isFadingOut: false });

    // Start fade out after 2000ms
    fadeTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, isFadingOut: true }));
    }, 2000);

    // Hide completely after 2700ms
    hideTimerRef.current = setTimeout(() => {
      setToast({ message: '', visible: false, isFadingOut: false });
    }, 2700);
  };

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleCheckIn = (id: string, newStatus: TargetStatus) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id === id) {
          return { ...habit, status: newStatus };
        }
        return habit;
      }),
    );

    const habit = habits.find((h) => h.id === id);
    if (habit) {
      if (newStatus === 'full') {
        triggerToast(`Full target recorded for ${habit.name}! 🎉`);
      } else if (newStatus === 'minimum') {
        triggerToast(`Minimum target met for ${habit.name}! Neural pathway active ✨`);
      } else {
        triggerToast(`Session reset to unrecorded.`);
      }
    }
  };

  const completedCount = habits.filter((h) => h.status !== 'unrecorded').length;

  return (
    <div className="group relative w-full">
      {/* Background glow shadow */}
      <div className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rounded-2xl bg-[var(--color-primary)]/10 transition-transform duration-300 group-hover:translate-x-2 group-hover:translate-y-2" />

      {/* Main App Mockup Card Rectangle (Anchored Steadily Without Moving Position) */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg transition-all duration-300 hover:shadow-xl">
        {/* Browser Chrome Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-[var(--color-danger)]/80" />
            <div className="size-3 rounded-full bg-[var(--color-minimum)]/80" />
            <div className="size-3 rounded-full bg-[var(--color-primary)]/80" />
          </div>
          <span className="font-mono text-xs text-[var(--color-text-muted)]">
            today.habit-tracker.app
          </span>
        </div>

        {/* App Body Content */}
        <div className="flex flex-col gap-4 bg-[var(--color-page)] p-6">
          {/* Single-Line Continuity Status Banner */}
          <div className="flex flex-nowrap items-center justify-between gap-3 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-emerald-50)] px-3.5 py-2.5 text-[var(--color-primary)] transition-all sm:px-4 sm:py-3">
            <div className="flex min-w-0 items-center gap-2">
              <Info aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate text-xs font-medium sm:text-sm">
                {completedCount} of 3 habits logged
              </span>
            </div>
            <span className="shrink-0 rounded bg-[var(--color-primary)] px-2 py-0.5 font-mono text-[11px] font-bold whitespace-nowrap text-white">
              {Math.round((completedCount / habits.length) * 100)}% Resilient
            </span>
          </div>

          {/* Interactive Habit Cards */}
          <div className="flex flex-col gap-3">
            {habits.map((habit) => {
              const isMinimum = habit.status === 'minimum';
              const isFull = habit.status === 'full';
              const isUnrecorded = habit.status === 'unrecorded';

              return (
                <div
                  key={habit.id}
                  className={`relative flex items-center justify-between overflow-hidden rounded-xl border p-4 shadow-sm transition-all duration-200 ${
                    isFull
                      ? 'border-[var(--color-primary)]/40 bg-white'
                      : isMinimum
                        ? 'border-[var(--color-minimum)]/40 bg-white'
                        : 'border-[var(--color-border)] bg-white/70'
                  }`}
                >
                  {/* Left Edge Accent Bar */}
                  <div
                    className={`absolute top-0 bottom-0 left-0 w-1.5 transition-all duration-300 ${
                      isFull
                        ? 'bg-[var(--color-primary)]'
                        : isMinimum
                          ? 'bg-[var(--color-minimum)]'
                          : 'bg-[var(--color-border)]'
                    }`}
                  />

                  <div className="pl-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                        {habit.name}
                      </h3>
                      {isMinimum && (
                        <Badge
                          tone="minimum"
                          className="animate-in fade-in zoom-in-95 px-2 text-[10px] font-semibold duration-200"
                        >
                          {habit.minimumLabel}
                        </Badge>
                      )}
                      {isFull && (
                        <Badge
                          tone="success"
                          className="animate-in fade-in zoom-in-95 px-2 text-[10px] font-semibold duration-200"
                        >
                          {habit.fullLabel}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                      {isFull
                        ? 'Full target completed • Great job!'
                        : isMinimum
                          ? 'Minimum target met • Neural pathway active'
                          : 'Not logged yet • Click buttons to check in'}
                    </p>
                  </div>

                  {/* Interactive Button Group */}
                  <div className="flex gap-2">
                    {/* Unrecord Button */}
                    <button
                      type="button"
                      onClick={() => handleCheckIn(habit.id, 'unrecorded')}
                      title="Reset status"
                      className={`flex size-9 items-center justify-center rounded-full border transition-all duration-150 active:scale-90 ${
                        isUnrecorded
                          ? 'border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)] shadow-inner'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                      <Minus aria-hidden="true" className="size-4" />
                    </button>

                    {/* Minimum Button */}
                    <button
                      type="button"
                      onClick={() => handleCheckIn(habit.id, 'minimum')}
                      title="Check in Minimum Target"
                      className={`flex size-9 items-center justify-center rounded-full border transition-all duration-150 active:scale-90 ${
                        isMinimum
                          ? 'border-[var(--color-minimum)]/60 bg-[var(--color-minimum)]/20 font-bold text-[var(--color-minimum)] shadow-sm ring-2 ring-[var(--color-minimum)]/30'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-minimum)]/40 hover:text-[var(--color-minimum)]'
                      }`}
                    >
                      <Leaf aria-hidden="true" className="size-4" />
                    </button>

                    {/* Full Button */}
                    <button
                      type="button"
                      onClick={() => handleCheckIn(habit.id, 'full')}
                      title="Check in Full Target"
                      className={`flex size-9 items-center justify-center rounded-full border transition-all duration-150 active:scale-90 ${
                        isFull
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] font-bold text-white shadow-sm ring-2 ring-[var(--color-primary)]/30'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]'
                      }`}
                    >
                      <Check aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reserved Slot Under Rectangles: Prevents layout shift of today.habit-tracker.app while text slides in from right */}
      <div className="mt-4 flex min-h-[52px] w-full items-center justify-center">
        {toast.visible && (
          <div
            className={`flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-surface)] px-4 py-3 text-xs font-semibold text-[var(--color-text-primary)] shadow-md transition-all duration-700 ease-out ${
              toast.isFadingOut
                ? 'translate-x-12 opacity-0 transition-all duration-700 ease-in'
                : 'animate-in fade-in slide-in-from-right-16 translate-x-0 opacity-100 duration-500 ease-out'
            }`}
          >
            <span className="flex items-center gap-2 overflow-hidden">
              <Sparkles className="size-4 shrink-0 animate-pulse text-[var(--color-primary)]" />
              <span className="truncate tracking-wide">{toast.message}</span>
            </span>
            <button
              type="button"
              onClick={() => setToast({ message: '', visible: false, isFadingOut: false })}
              className="shrink-0 text-xs font-bold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
