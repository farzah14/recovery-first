import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { TodayEmptyState } from '@/features/today/today-types';

export function TodayEmptyState({
  state,
  nextSession,
}: {
  state: TodayEmptyState;
  nextSession?: { title: string; localDate: string };
}): React.JSX.Element | null {
  if (state === 'none') return null;
  const content = {
    no_habits: {
      title: 'Start with one adaptable habit',
      description: 'Create a habit with a Normal action and a Minimum option for difficult days.',
    },
    no_eligible_sessions: {
      title: 'No eligible sessions today',
      description: nextSession
        ? `Next session: ${nextSession.title} on ${nextSession.localDate}.`
        : 'Your next eligible session will appear here.',
    },
    all_recorded: {
      title: 'Today is recorded',
      description: 'Full and Minimum both support continuity.',
    },
    none: { title: '', description: '' },
  }[state];

  return (
    <Card>
      <CardContent className="grid justify-items-start gap-3 p-6">
        <h2 className="text-xl font-semibold">{content.title}</h2>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          {content.description}
        </p>
        {state === 'no_habits' ? (
          <Button asChild>
            <Link href="/app/habits/new">Create your first habit</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
