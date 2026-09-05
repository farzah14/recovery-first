export type AccountSessionOutcome =
  | 'unrecorded'
  | 'full'
  | 'minimum'
  | 'manual_skipped'
  | 'automatic_skipped'
  | 'excused';

export type SessionSurfaceMetrics = {
  resolvedSessions: number;
  successfulSessions: number;
  minimumSessions: number;
  fullSessions: number;
  fullTargetRate: number | null;
  nonZeroRate: number | null;
};

function percentage(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 10000) / 100;
}

export function summarizeSessionOutcomes(
  rows: ReadonlyArray<{ status: AccountSessionOutcome }>,
): SessionSurfaceMetrics {
  const resolvedRows = rows.filter(({ status }) =>
    ['full', 'minimum', 'manual_skipped', 'automatic_skipped'].includes(status),
  );
  const fullSessions = rows.filter(({ status }) => status === 'full').length;
  const minimumSessions = rows.filter(({ status }) => status === 'minimum').length;
  const successfulSessions = fullSessions + minimumSessions;

  return {
    resolvedSessions: resolvedRows.length,
    successfulSessions,
    minimumSessions,
    fullSessions,
    fullTargetRate: percentage(fullSessions, resolvedRows.length),
    nonZeroRate: percentage(successfulSessions, resolvedRows.length),
  };
}

export function normalizeRecommendation(row: {
  explanation_key: string;
  evidence: unknown;
}): string | null {
  if (!row || typeof row.evidence !== 'object' || row.evidence === null) return null;
  const evidence = row.evidence as { summary?: unknown; message?: unknown };
  for (const value of [evidence.summary, evidence.message]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function mapReminderRegistration(
  channel: string,
  hasGrantedPushSubscription: boolean,
): 'registered' | 'needs_permission' | 'not_applicable' {
  if (channel !== 'web_push') return 'not_applicable';
  return hasGrantedPushSubscription ? 'registered' : 'needs_permission';
}
