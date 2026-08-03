'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { frictionReasons } from '@/domain/check-ins/check-in';
import type { FrictionReason, UserRecordableCheckInOutcome } from '@/domain/check-ins/check-in';

type EditFriction = {
  frictionCode: FrictionReason | null;
  frictionNote: string | null;
};

function outcomeLabel(outcome: UserRecordableCheckInOutcome): string {
  if (outcome === 'manual_skipped') return 'Skipped';
  return outcome === 'full' ? 'Full' : outcome === 'minimum' ? 'Minimum' : 'Excused';
}

function metricImpact(outcome: UserRecordableCheckInOutcome): string {
  if (outcome === 'full') return 'Full counts as a complete step for today.';
  if (outcome === 'minimum') return 'Minimum keeps the habit alive without requiring the full target.';
  if (outcome === 'excused') return 'Excused preserves context without counting a completed step.';
  return 'Skipped records what happened without erasing the day from history.';
}

export function EditCheckInDialog({
  open,
  onOpenChange,
  currentOutcome,
  onSave,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentOutcome: UserRecordableCheckInOutcome;
  onSave: (outcome: UserRecordableCheckInOutcome, friction: EditFriction) => void;
  onCancel: () => void;
}): React.JSX.Element {
  const [outcome, setOutcome] = useState<UserRecordableCheckInOutcome>(currentOutcome);
  const [frictionCode, setFrictionCode] = useState<FrictionReason | null>(null);
  const [frictionNote, setFrictionNote] = useState('');
  const save = () => onSave(
    outcome,
    {
      frictionCode: outcome === 'manual_skipped' ? frictionCode : null,
      frictionNote: outcome === 'manual_skipped' ? frictionNote.trim() || null : null,
    },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="edit-check-in-dialog-description">
        <DialogTitle>Edit today&apos;s check-in</DialogTitle>
        <DialogDescription id="edit-check-in-dialog-description" className="mt-2">
          Today&apos;s record can change while prior history remains preserved.
        </DialogDescription>
        <div className="mt-5 grid gap-4">
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">Outcome</legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Check-in outcome">
              {(['full', 'minimum', 'manual_skipped'] as const).map((nextOutcome) => (
                <Button
                  key={nextOutcome}
                  type="button"
                  variant={outcome === nextOutcome ? 'primary' : 'secondary'}
                  aria-pressed={outcome === nextOutcome}
                  onClick={() => setOutcome(nextOutcome)}
                >
                  {outcomeLabel(nextOutcome)}
                </Button>
              ))}
            </div>
          </fieldset>
          <p className="text-sm text-[var(--color-text-secondary)]" role="status">{metricImpact(outcome)}</p>
          {outcome === 'manual_skipped' ? (
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold" htmlFor="edit-friction-reason">
                Reason (optional)
                <select
                  id="edit-friction-reason"
                  value={frictionCode ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFrictionCode(frictionReasons.includes(value as FrictionReason) ? value as FrictionReason : null);
                  }}
                  className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm"
                >
                  <option value="">No reason</option>
                  {frictionReasons.map((reason) => <option key={reason} value={reason}>{reason.replaceAll('_', ' ')}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold" htmlFor="edit-friction-note">
                Private note (optional)
                <Input id="edit-friction-note" maxLength={240} value={frictionNote} onChange={(event) => setFrictionNote(event.target.value)} />
              </label>
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="button" onClick={save}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
