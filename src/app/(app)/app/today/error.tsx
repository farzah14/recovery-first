'use client';

import { RefreshCw, TriangleAlert } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function TodayError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Card>
          <CardContent className="grid gap-3 p-6">
            <TriangleAlert aria-hidden="true" className="size-7 text-[var(--color-warning)]" />
            <h1 className="text-xl font-semibold">Today could not load</h1>
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              Your local data is still safe. Try loading this view again.
            </p>
            <Button type="button" onClick={reset}>
              <RefreshCw aria-hidden="true" className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
