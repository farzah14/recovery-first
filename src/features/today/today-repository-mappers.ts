import type { SessionSummary } from '@/lib/repositories/product-repository';
import { mapSessionStatusToOutcome } from '@/lib/repositories/habit-payload';

export type TodayRepositoryHabit = {
  id: string;
  habitId: string;
  habitVersionId: string;
  name: string;
  category: string;
  timingContext: string;
  habitRevision: number;
  currentVersionId: string | null;
  minimumSummary: string;
  fullSummary: string;
  outcome: 'unrecorded' | 'full' | 'minimum' | 'skipped';
  icon: string;
  sessionRevision: number;
};

function targetLabel(target: SessionSummary['normalTarget']): string {
  if (target.label) return target.label;
  if (target.quantity !== null && target.unit) return `${target.quantity} ${target.unit}`;
  if (target.quantity !== null) return String(target.quantity);
  return target.action;
}

function prefixTarget(prefix: string, value: string): string {
  return value.toLowerCase().startsWith(prefix.toLowerCase()) ? value : `${prefix} ${value}`;
}

export function mapSessionToTodayHabit(session: SessionSummary): TodayRepositoryHabit {
  return {
    id: session.id,
    habitId: session.habitId,
    habitVersionId: session.habitVersionId,
    name: session.title,
    category: session.category ?? 'Other',
    timingContext: session.timingContext ?? '',
    habitRevision: session.habitRevision ?? 1,
    currentVersionId: session.currentVersionId ?? session.habitVersionId,
    minimumSummary: prefixTarget('Minimum', targetLabel(session.minimumTarget)),
    fullSummary: prefixTarget('Full', targetLabel(session.normalTarget)),
    outcome: mapSessionStatusToOutcome(session.status),
    icon: session.icon ?? 'habit',
    sessionRevision: session.revision,
  };
}
