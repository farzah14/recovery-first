import { BellOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function PermissionState(): React.JSX.Element {
  return (
    <Card>
      <CardContent className="grid gap-3 py-6">
        <BellOff aria-hidden="true" className="size-6 text-[var(--color-warning)]" />
        <h2 className="text-lg font-semibold">Browser reminders are not enabled</h2>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          Habit tracking remains available. Enable reminders only when you are ready.
        </p>
        <Button className="w-fit" variant="secondary">
          Review reminder options
        </Button>
      </CardContent>
    </Card>
  );
}
