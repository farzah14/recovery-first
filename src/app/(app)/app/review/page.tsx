'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ClipboardCheck, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateHabitDialog } from '@/features/habits/create-habit-dialog';

export default function ReviewPage(): React.JSX.Element {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <AppShell onOpenCreateHabit={() => setCreateDialogOpen(true)}>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)]">
              <ClipboardCheck className="size-4" />
              <span>Weekly Review</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
              Weekly Review & Reset
            </h1>
            <p className="mt-1 text-xs text-[var(--color-text-muted)] sm:text-sm">
              Reflect on your routine, adjust minimum baselines, and reset without shame.
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            size="compact"
            variant="primary"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold shadow-xs"
          >
            <Plus className="size-4 shrink-0" />
            <span>Add Habit</span>
          </Button>
        </div>

        <CreateHabitDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

        <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-emerald-50)] text-[var(--color-primary)]">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Ready for your weekly check-in?
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Review your weekly resilience score and adjust habits for the upcoming week.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-center">
              <span className="text-2xl font-bold text-[var(--color-primary)]">85%</span>
              <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Weekly Resilience
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-center">
              <span className="text-2xl font-bold text-[var(--color-primary)]">14</span>
              <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Completed Sessions
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-center">
              <span className="text-2xl font-bold text-amber-500">2</span>
              <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Minimum Recovery Days
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
