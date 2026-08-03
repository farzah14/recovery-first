import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { HabitCard } from '@/features/habits/components/habit-card';
import type { HabitListItem } from '@/lib/repositories/product-repository';

export function HabitList({
  habits,
  activeHabitCount,
  activeHabitLimit,
}: {
  habits: HabitListItem[];
  activeHabitCount: number;
  activeHabitLimit: number;
}): React.JSX.Element {
  return (
    <section className="grid gap-6">
      <PageHeader
        title="Habits Library"
        description="Keep each habit adaptable with a Normal action and a Minimum option."
        actions={
          <Button asChild>
            <Link href="/app/habits/new">Add Habit</Link>
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm">
        <span className="font-semibold">{activeHabitLimit} active habits maximum</span>
        <span className="text-[var(--color-text-secondary)]">{activeHabitCount} currently active</span>
      </div>
      {habits.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {habits.map((habit) => <HabitCard key={habit.id} habit={habit} />)}
        </div>
      ) : (
        <Card>
          <CardContent className="grid justify-items-start gap-3 p-6">
            <h2 className="text-lg font-semibold">No habits yet</h2>
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">Create a first habit with a smaller option for difficult days.</p>
            <Button asChild><Link href="/app/habits/new">Create your first habit</Link></Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
