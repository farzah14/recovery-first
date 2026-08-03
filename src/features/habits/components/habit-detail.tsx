'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HabitHistory } from '@/features/habits/components/habit-history';
import type { HabitDetailRead } from '@/lib/repositories/product-repository';

const tabs = ['Overview', 'History', 'Insights', 'Versions'] as const;
type DetailTab = (typeof tabs)[number];

function displayState(state: HabitDetailRead['habit']['lifecycleState']): string {
  return state.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function HabitDetail({ detail, initialTab = 'Overview' }: { detail: HabitDetailRead; initialTab?: DetailTab }): React.JSX.Element {
  const [tab, setTab] = useState<DetailTab>(initialTab);
  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <Link href="/app/habits" className="text-sm font-semibold text-[var(--color-primary)]">Back to Habits</Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{detail.habit.title}</h1>
            <Badge tone="success">{displayState(detail.habit.lifecycleState)}</Badge>
          </div>
        </div>
      </div>
      <nav aria-label="Habit detail tabs" className="overflow-x-auto border-b border-[var(--color-border)]">
        <div className="flex min-w-max gap-1" role="tablist">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              onClick={() => setTab(item)}
              className="min-h-11 rounded-t-md px-4 text-sm font-semibold aria-selected:border-b-2 aria-selected:border-[var(--color-primary)] aria-selected:text-[var(--color-primary)]"
            >
              {item}
            </button>
          ))}
        </div>
      </nav>
      <div role="tabpanel" tabIndex={0}>
        {tab === 'Overview' ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <Card><CardContent className="grid gap-4 p-6"><h2 className="text-lg font-semibold">Overview</h2><dl className="grid gap-3 text-sm"><div><dt className="font-semibold">Normal</dt><dd>{detail.currentVersion.normalTarget.action}</dd></div><div><dt className="font-semibold">Minimum</dt><dd>{detail.currentVersion.minimumTarget.action}</dd></div><div><dt className="font-semibold">Schedule</dt><dd>{detail.currentVersion.recurrence.kind}</dd></div><div><dt className="font-semibold">Cue</dt><dd>{detail.currentVersion.cue.value ?? 'None'}</dd></div></dl></CardContent></Card>
            <Card><CardContent className="grid gap-3 p-6"><h2 className="text-lg font-semibold">Summary</h2><p className="text-sm text-[var(--color-text-secondary)]">Version {detail.currentVersion.versionNumber} is the current definition.</p><Button asChild variant="secondary"><Link href={`/app/habits/${detail.habit.id}/history`}>View history</Link></Button></CardContent></Card>
          </div>
        ) : null}
        {tab === 'History' ? <HabitHistory sessions={detail.sessions} /> : null}
        {tab === 'Insights' ? <Card><CardContent className="p-6"><h2 className="text-lg font-semibold">Insights unavailable for now</h2><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Keep recording sessions to prepare future insights.</p></CardContent></Card> : null}
        {tab === 'Versions' ? <ol className="grid gap-3">{detail.versions.map((version) => <li key={version.id} className="rounded-lg border border-[var(--color-border)] px-4 py-3"><p className="font-semibold">Version {version.versionNumber}</p><p className="text-sm text-[var(--color-text-secondary)]">{version.source} · {version.createdAt.slice(0, 10)}</p></li>)}</ol> : null}
      </div>
    </section>
  );
}
