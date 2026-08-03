'use client';

import { useState } from 'react';
import { CircleAlert, CircleCheck, CircleDashed, Clock3, HelpCircle, PauseCircle, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckInActionGroup } from '@/features/check-ins/components/check-in-action-group';
import { FrictionDialog } from '@/features/check-ins/components/friction-dialog';
import type { SessionSummary } from '@/lib/repositories/product-repository';

type Action = 'full' | 'minimum' | 'manual_skipped';

const syncLabels = {
  local_only: 'Saved in this browser',
  pending: 'Pending',
  synced: 'Synced',
  failed: 'Failed',
  conflict: 'Conflict needs attention',
} satisfies Record<SessionSummary['synchronizationState'], string>;

export function TodaySessionCard({
  session,
  onAction,
  onEdit,
  isSameDay = false,
  habitState,
  isRecovery = false,
}: {
  session: SessionSummary;
  onAction: (action: Action, session: SessionSummary, friction?: { frictionCode: string | null; frictionNote: string | null }) => void;
  onEdit?: (session: SessionSummary) => void;
  isSameDay?: boolean;
  habitState?: 'paused' | 'active';
  isRecovery?: boolean;
}): React.JSX.Element {
  const [frictionOpen, setFrictionOpen] = useState(false);
  const recorded = session.status !== 'unrecorded';
  const statusLabel = session.status === 'manual_skipped' ? 'Manual Skipped' : session.status === 'automatic_skipped' ? 'Automatic Skipped' : session.status === 'full' ? 'Full' : session.status === 'minimum' ? 'Minimum' : session.status === 'excused' ? 'Excused' : 'Unrecorded';
  const StatusIcon = session.status === 'full' ? CircleCheck : session.status === 'minimum' ? ShieldCheck : session.status === 'unrecorded' ? CircleDashed : CircleAlert;

  return (
    <Card>
      <CardContent className="grid gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{session.title}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{session.normalTarget.action}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Minimum: <span>{session.minimumTarget.action}</span></p>
            <p className="mt-2 text-sm">{session.cue.value ?? (session.scheduledLocalTime ? `Scheduled at ${session.scheduledLocalTime}` : 'No cue')}</p>
          </div>
          <button type="button" aria-label="Help with check-in" className="rounded-md p-2 text-[var(--color-text-secondary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-focus)_24%,transparent)]"><HelpCircle aria-hidden="true" className="size-5" /></button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold"><StatusIcon aria-hidden="true" className="size-4" />{statusLabel}</span>
          <span className="inline-flex items-center gap-2 text-[var(--color-text-secondary)]"><Clock3 aria-hidden="true" className="size-4" />{syncLabels[session.synchronizationState]}</span>
          {habitState === 'paused' ? <span className="inline-flex items-center gap-2"><PauseCircle aria-hidden="true" className="size-4" />Paused</span> : null}
          {isRecovery ? <span className="inline-flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-4" />Recovery</span> : null}
        </div>
        {recorded ? (
          isSameDay ? <Button type="button" variant="secondary" onClick={() => onEdit?.(session)}>Edit</Button> : null
        ) : (
          <CheckInActionGroup
            onFull={() => onAction('full', session)}
            onMinimum={() => onAction('minimum', session)}
            onSkipped={() => setFrictionOpen(true)}
          />
        )}
        <FrictionDialog
          open={frictionOpen}
          onOpenChange={setFrictionOpen}
          onCancel={() => setFrictionOpen(false)}
          onSubmit={(friction) => {
            setFrictionOpen(false);
            onAction('manual_skipped', session, friction);
          }}
        />
      </CardContent>
    </Card>
  );
}
