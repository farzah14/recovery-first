'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { frictionReasons } from '@/domain/check-ins/check-in';
import type { FrictionReason } from '@/domain/check-ins/check-in';

export function FrictionDialog({
  open,
  onOpenChange,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (friction: { frictionCode: FrictionReason | null; frictionNote: string | null }) => void;
  onCancel: () => void;
}): React.JSX.Element {
  const [frictionCode, setFrictionCode] = useState<FrictionReason | null>(null);
  const [frictionNote, setFrictionNote] = useState('');
  const submit = () => onSubmit({ frictionCode, frictionNote: frictionNote.trim() || null });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="friction-dialog-description">
        <DialogTitle>What made today harder?</DialogTitle>
        <DialogDescription id="friction-dialog-description" className="mt-2">This optional note stays private and helps you reflect later.</DialogDescription>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold" htmlFor="friction-reason">Reason (optional)
            <select id="friction-reason" value={frictionCode ?? ''} onChange={(event) => setFrictionCode((event.target.value || null) as FrictionReason | null)} className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm">
              <option value="">No reason</option>
              {frictionReasons.map((reason) => <option key={reason} value={reason}>{reason.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold" htmlFor="friction-note">Private note
            <Input id="friction-note" maxLength={240} value={frictionNote} onChange={(event) => setFrictionNote(event.target.value)} />
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="button" variant="secondary" onClick={() => onSubmit({ frictionCode: null, frictionNote: null })}>Skip explanation</Button>
            <Button type="button" onClick={submit}>Save Skipped</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
