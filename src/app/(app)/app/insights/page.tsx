'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { BarChart3, TrendingUp, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateHabitDialog } from '@/features/habits/create-habit-dialog';

export default function InsightsPage(): React.JSX.Element {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <AppShell onOpenCreateHabit={() => setCreateDialogOpen(true)}>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)]">
              <BarChart3 className="size-4" />
              <span>Friction & Consistency</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
              Habit Insights & Trends
            </h1>
            <p className="mt-1 text-xs text-[var(--color-text-muted)] sm:text-sm">
              Understand your routine patterns, identify friction factors, and celebrate steady
              progress.
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                Consistency Breakdown
              </h2>
              <TrendingUp className="size-5 text-[var(--color-primary)]" />
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Your overall habit completion rate across normal and minimum targets.
            </p>
            <div className="flex items-center justify-around pt-4 text-center">
              <div>
                <span className="text-3xl font-extrabold text-[var(--color-primary)]">92%</span>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Normal Target Rate</p>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-amber-500">98%</span>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Non-Zero Baseline Rate
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
              <Sparkles className="size-5 text-[var(--color-primary)]" />
              <span>Smart Recommendations</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
              You maintain high consistency on morning routines. Consider adjusting evening habit
              timings to match your peak energy hours.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
