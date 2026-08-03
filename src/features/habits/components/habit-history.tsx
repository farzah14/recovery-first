import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  MinusCircle,
  SkipForward,
} from 'lucide-react';

import type { SessionSummary } from '@/lib/repositories/product-repository';

const historyStatus = {
  full: { label: 'Full', Icon: CheckCircle2 },
  minimum: { label: 'Minimum', Icon: MinusCircle },
  manual_skipped: { label: 'Manual Skipped', Icon: SkipForward },
  automatic_skipped: { label: 'Automatic Skipped', Icon: Clock3 },
  unrecorded: { label: 'Unrecorded', Icon: CircleDashed },
  excused: { label: 'Excused', Icon: AlertCircle },
} satisfies Record<SessionSummary['status'], { label: string; Icon: typeof CheckCircle2 }>;

export function HabitHistory({ sessions }: { sessions: SessionSummary[] }): React.JSX.Element {
  return (
    <div className="grid gap-3">
      {sessions.length === 0 ? <p className="text-sm text-[var(--color-text-secondary)]">No session history yet.</p> : null}
      {sessions.map((session) => {
        const { label, Icon } = historyStatus[session.status];
        return (
          <div key={session.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{session.scheduledLocalDate}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{session.title}</p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold" aria-label={label}>
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
