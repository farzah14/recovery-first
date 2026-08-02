import { CirclePlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function EmptyState({
  title,
  description,
  actionLabel,
}: Readonly<{ title: string; description: string; actionLabel: string }>): React.JSX.Element {
  return (
    <Card>
      <CardContent className="grid justify-items-center gap-3 py-10 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-[var(--color-emerald-50)] text-[var(--color-primary)]">
          <CirclePlus aria-hidden="true" className="size-6" />
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
          {description}
        </p>
        <Button className="mt-2">{actionLabel}</Button>
      </CardContent>
    </Card>
  );
}
