import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { HabitListItem } from '@/lib/repositories/product-repository';

function lifecycleLabel(state: HabitListItem['lifecycleState']): string {
  return state.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function HabitCard({ habit }: { habit: HabitListItem }): React.JSX.Element {
  const tone = habit.lifecycleState === 'active' || habit.lifecycleState === 'starting' ? 'success' : 'neutral';
  return (
    <Link href={`/app/habits/${habit.id}`} aria-label={habit.title} className="block rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-focus)_24%,transparent)]">
      <Card className="h-full transition-shadow hover:shadow-[var(--shadow-overlay)]">
        <CardContent className="grid gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{habit.title}</h2>
            <Badge tone={tone}>{lifecycleLabel(habit.lifecycleState)}</Badge>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">Updated {habit.updatedAt.slice(0, 10)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
