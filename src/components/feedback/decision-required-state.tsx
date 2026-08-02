import { CircleHelp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function DecisionRequiredState(): React.JSX.Element {
  return (
    <Card>
      <CardContent className="grid gap-3 py-6">
        <CircleHelp aria-hidden="true" className="size-6 text-[var(--color-recovery)]" />
        <h2 className="text-lg font-semibold">Your decision is needed</h2>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          No recommendation will be applied until you review and approve it.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="recovery">Review recommendation</Button>
          <Button variant="ghost">Not now</Button>
        </div>
      </CardContent>
    </Card>
  );
}
