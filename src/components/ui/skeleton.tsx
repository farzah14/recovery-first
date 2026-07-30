import { cn } from '@/lib/cn';

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-[var(--color-neutral-150)]', className)}
      {...props}
    />
  );
}
