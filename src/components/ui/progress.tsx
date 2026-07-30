'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/cn';

export function Progress({
  className,
  value = 0,
  label,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { label: string }): React.JSX.Element {
  const boundedValue = Math.min(100, Math.max(0, value ?? 0));
  return (
    <ProgressPrimitive.Root
      aria-label={label}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-[var(--color-neutral-150)]', className)}
      value={boundedValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-[var(--color-primary)] transition-transform duration-[var(--motion-standard)]"
        style={{ transform: `translateX(-${100 - boundedValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
