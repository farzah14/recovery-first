import { Badge } from '@/components/ui/badge';

const statusConfiguration = {
  full: { label: 'Full', tone: 'success' },
  minimum: { label: 'Minimum', tone: 'minimum' },
  skipped: { label: 'Skipped', tone: 'neutral' },
  unrecorded: { label: 'Unrecorded', tone: 'neutral' },
  pendingSync: { label: 'Pending sync', tone: 'info' },
  syncFailed: { label: 'Retry needed', tone: 'danger' },
  recovery: { label: 'Recovery', tone: 'recovery' },
  premium: { label: 'Premium', tone: 'premium' },
} as const;

export type StatusBadgeStatus = keyof typeof statusConfiguration;

export function StatusBadge({
  status,
}: Readonly<{ status: StatusBadgeStatus }>): React.JSX.Element {
  const configuration = statusConfiguration[status];
  return <Badge tone={configuration.tone}>{configuration.label}</Badge>;
}
