import { CloudOff } from 'lucide-react';

import { Alert } from '@/components/ui/alert';

export function OfflineState(): React.JSX.Element {
  return (
    <Alert tone="warning">
      <div className="flex gap-3">
        <CloudOff aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="font-semibold">You are offline</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">Cached pages remain available. Changes that support offline entry will show a pending-sync label.</p>
        </div>
      </div>
    </Alert>
  );
}
