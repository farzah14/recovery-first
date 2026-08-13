'use client';

import * as LabelPrimitive from '@radix-ui/react-label';

import { cn } from '@/lib/cn';

export function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>): React.JSX.Element {
  return (
    <LabelPrimitive.Root
      className={cn(
        'text-xs font-semibold text-[var(--color-text-primary)] peer-disabled:cursor-not-allowed peer-disabled:opacity-55',
        className,
      )}
      {...props}
    />
  );
}
