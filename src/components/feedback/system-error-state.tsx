import { TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function SystemErrorState(): React.JSX.Element {
  return (
    <div className="grid min-h-64 place-items-center rounded-[var(--radius-lg)] border border-[#F3B6B6] bg-[#FFF1F1] p-6 text-center">
      <div className="grid max-w-md justify-items-center gap-3">
        <TriangleAlert aria-hidden="true" className="size-7 text-[var(--color-danger)]" />
        <h2 className="text-lg font-semibold">This section could not load</h2>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">Your existing data has not been changed. Retry the request or return to Today.</p>
        <Button variant="secondary">Retry</Button>
      </div>
    </div>
  );
}
