import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold transition-colors duration-[var(--motion-fast)] disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-focus)_24%,transparent)]',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-pressed)]',
        secondary:
          'border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]',
        ghost:
          'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]',
        danger:
          'bg-[var(--color-danger)] text-white hover:bg-[#D93636] active:bg-[#C52E2E]',
        recovery:
          'bg-[var(--color-recovery)] text-white hover:bg-[#7848E7] active:bg-[#6739D5]',
      },
      size: {
        default: 'h-10',
        touch: 'min-h-11',
        large: 'min-h-12 px-5 text-base',
        compact: 'h-9 min-h-9 px-3',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      fullWidth: false,
    },
  },
);

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  asChild = false,
  className,
  variant,
  size,
  fullWidth,
  type = 'button',
  ...props
}: ButtonProps): React.JSX.Element {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...(!asChild ? { type } : {})}
      {...props}
    />
  );
}
