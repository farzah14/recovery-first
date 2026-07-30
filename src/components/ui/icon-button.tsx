import { cn } from '@/lib/cn';

export function IconButton({
  label,
  className,
  children,
  type = 'button',
  ...props
}: React.ComponentProps<'button'> & { label: string }): React.JSX.Element {
  return (
    <button
      aria-label={label}
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)] disabled:pointer-events-none disabled:opacity-55',
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
