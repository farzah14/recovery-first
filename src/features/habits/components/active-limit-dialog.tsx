'use client';

import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { ActiveLimitResolution } from '@/features/habits/application/activate-habit';

export function ActiveLimitDialog({
  open,
  onOpenChange,
  planTier,
  activeHabits,
  onResolve,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planTier: 'guest' | 'free' | 'lite' | 'premium';
  activeHabits: Array<{ id: string; title: string }>;
  onResolve: (resolution: ActiveLimitResolution) => void;
}): React.JSX.Element {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const isGuest = planTier === 'guest';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby="active-limit-description"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
      >
        <DialogTitle>Active habit limit reached</DialogTitle>
        <DialogDescription id="active-limit-description" className="mt-2">
          {isGuest ? (
            <span>Guest allows 3 active habits</span>
          ) : (
            'Your plan has reached its active habit limit'
          )}
          . The new habit remains a draft unless you choose what to do next.
        </DialogDescription>
        <div className="mt-5 grid gap-3">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Active habits</p>
          {activeHabits.length > 0 ? (
            <ul className="grid gap-2 text-sm text-[var(--color-text-secondary)]">
              {activeHabits.map((habit) => (
                <li
                  key={habit.id}
                  className="rounded-md bg-[var(--color-surface-subtle)] px-3 py-2"
                >
                  {habit.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)]">
              No active habit list is available yet.
            </p>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              onResolve({ action: 'pause_existing', habitId: activeHabits[0]?.id ?? '' })
            }
          >
            Pause an Active Habit
          </Button>
          {isGuest ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onResolve({ action: 'create_account' })}
            >
              Create Account
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => onResolve({ action: 'keep_draft' })}
          >
            Keep as Draft
          </Button>
          <Button
            ref={cancelRef}
            type="button"
            variant="ghost"
            onClick={() => onResolve({ action: 'cancel' })}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
