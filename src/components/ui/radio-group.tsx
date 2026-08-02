'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@/lib/cn';

export const RadioGroup = RadioGroupPrimitive.Root;

export function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>): React.JSX.Element {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'flex size-5 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] disabled:opacity-55 data-[state=checked]:border-[var(--color-primary)]',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-[var(--color-primary)]" />
    </RadioGroupPrimitive.Item>
  );
}
