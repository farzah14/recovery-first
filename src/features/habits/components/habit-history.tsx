'use client';

import { useState } from 'react';

import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  MinusCircle,
  SkipForward,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EditCheckInDialog } from '@/features/check-ins/components/edit-check-in-dialog';
import type { FrictionReason, UserRecordableCheckInOutcome } from '@/domain/check-ins/check-in';
import type { SessionSummary } from '@/lib/repositories/product-repository';

const historyStatus = {
  full: { label: 'Full', Icon: CheckCircle2 },
  minimum: { label: 'Minimum', Icon: MinusCircle },
  manual_skipped: { label: 'Manual Skipped', Icon: SkipForward },
  automatic_skipped: { label: 'Automatic Skipped', Icon: Clock3 },
  unrecorded: { label: 'Unrecorded', Icon: CircleDashed },
  excused: { label: 'Excused', Icon: AlertCircle },
} satisfies Record<SessionSummary['status'], { label: string; Icon: typeof CheckCircle2 }>;

function isEditableOutcome(status: SessionSummary['status']): status is UserRecordableCheckInOutcome {
  return status === 'full' || status === 'minimum' || status === 'manual_skipped' || status === 'excused';
}

type EditChange = {
  outcome: UserRecordableCheckInOutcome;
  friction: { frictionCode: FrictionReason | null; frictionNote: string | null };
};

export function HabitHistory({
  sessions,
  currentLocalDate,
  onEdit,
}: {
  sessions: SessionSummary[];
  currentLocalDate?: string;
  onEdit?: (session: SessionSummary, change: EditChange) => void;
}): React.JSX.Element {
  const [editingSession, setEditingSession] = useState<SessionSummary | null>(null);
  return (
    <div className="grid gap-3">
      {onEdit ? <p className="text-sm text-[var(--color-text-secondary)]">Today&apos;s record changes while prior history remains preserved.</p> : null}
      {sessions.length === 0 ? <p className="text-sm text-[var(--color-text-secondary)]">No session history yet.</p> : null}
      {sessions.map((session) => {
        const { label, Icon } = historyStatus[session.status];
        const canEdit = Boolean(
          onEdit &&
          currentLocalDate &&
          session.scheduledLocalDate === currentLocalDate &&
          isEditableOutcome(session.status),
        );
        return (
          <div key={session.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{session.scheduledLocalDate}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{session.title}</p>
              {session.status === 'automatic_skipped' ? <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Automatically marked skipped after the check-in window closed</p> : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-semibold" aria-label={label}>
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </span>
              {canEdit ? <Button type="button" variant="secondary" size="compact" onClick={() => setEditingSession(session)}>Edit</Button> : null}
            </div>
          </div>
        );
      })}
      {editingSession && isEditableOutcome(editingSession.status) ? (
        <EditCheckInDialog
          open
          onOpenChange={(open) => { if (!open) setEditingSession(null); }}
          currentOutcome={editingSession.status}
          onCancel={() => setEditingSession(null)}
          onSave={(outcome, friction) => {
            onEdit?.(editingSession, { outcome, friction });
            setEditingSession(null);
          }}
        />
      ) : null}
    </div>
  );
}
