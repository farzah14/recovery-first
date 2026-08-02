'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Bell, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateHabitDialog } from '@/features/habits/create-habit-dialog';

export default function RemindersPage(): React.JSX.Element {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <AppShell onOpenCreateHabit={() => setCreateDialogOpen(true)}>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)]">
              <Bell className="size-4" />
              <span>Gentle Notifications</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
              Habit Reminders
            </h1>
            <p className="mt-1 text-xs text-[var(--color-text-muted)] sm:text-sm">
              Manage your schedule alerts and non-intrusive reminder times.
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
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
            <div className="flex items-center gap-3">
              <Clock className="size-5 text-[var(--color-primary)]" />
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Morning Meditation
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Scheduled for 08:00 AM - 09:00 AM
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[var(--color-emerald-50)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="size-5 text-[var(--color-primary)]" />
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Hydration & Water
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Scheduled for 11:00 AM - 12:00 PM
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[var(--color-emerald-50)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              Active
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
