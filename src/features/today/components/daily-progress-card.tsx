import { Card, CardContent } from '@/components/ui/card';

export function DailyProgressCard({
  successfulCount,
  minimumCount,
  remainingCount,
  totalCount,
}: {
  successfulCount: number;
  minimumCount: number;
  remainingCount: number;
  totalCount: number;
}): React.JSX.Element {
  const progress = totalCount === 0 ? 0 : Math.round((successfulCount / totalCount) * 100);
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-5 p-5">
        <div
          role="img"
          aria-label={`${progress}% of today's sessions recorded successfully`}
          className="grid size-20 shrink-0 place-items-center rounded-full border-[10px] border-[var(--color-emerald-100)] text-lg font-bold text-[var(--color-primary)]"
        >
          {progress}%
        </div>
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">Today’s progress</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{successfulCount} successful sessions · {minimumCount} Minimum</p>
          <p className="text-sm font-semibold">{remainingCount} remaining</p>
        </div>
      </CardContent>
    </Card>
  );
}
