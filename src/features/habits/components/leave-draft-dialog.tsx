'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function LeaveDraftDialog({
  open,
  onOpenChange,
  onSave,
  onDiscard,
  onContinue,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onDiscard: () => void;
  onContinue: () => void;
  isSaving: boolean;
}): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="leave-draft-description">
        <DialogTitle>Leave habit creation?</DialogTitle>
        <DialogDescription id="leave-draft-description" className="mt-2">
          Your changes are not submitted yet. Guest drafts stay in this browser and do not use an
          active habit slot.
        </DialogDescription>
        <div className="mt-6 grid gap-2">
          <Button type="button" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving draft…' : 'Save draft and leave'}
          </Button>
          <Button type="button" variant="secondary" onClick={onDiscard}>
            Discard changes
          </Button>
          <Button type="button" variant="ghost" onClick={onContinue}>
            Continue editing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
