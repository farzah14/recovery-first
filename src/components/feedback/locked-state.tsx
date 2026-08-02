import { LockKeyhole } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function LockedState(): React.JSX.Element {
  return (
    <Card>
      <CardContent className="grid justify-items-start gap-3 py-6">
        <LockKeyhole aria-hidden="true" className="size-6 text-[var(--color-premium)]" />
        <h2 className="text-lg font-semibold">Premium feature</h2>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          Review the plan details before choosing whether to upgrade.
        </p>
        <Button variant="secondary">Compare plans</Button>
      </CardContent>
    </Card>
  );
}
