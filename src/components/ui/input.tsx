import { cn } from '@/lib/cn';

export function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>): React.JSX.Element {
  return (
    <input
      className={cn(
        'min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-subtle)] disabled:text-[var(--color-text-disabled)] aria-invalid:border-[var(--color-danger)]',
        className,
      )}
      type={type}
      {...props}
    />
  );
}
