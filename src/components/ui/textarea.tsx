import { cn } from '@/lib/cn';

export function Textarea({
  className,
  ...props
}: React.ComponentProps<'textarea'>): React.JSX.Element {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-xs leading-5 text-[var(--color-text-primary)] placeholder:text-xs placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-subtle)] aria-invalid:border-[var(--color-danger)]',
        className,
      )}
      {...props}
    />
  );
}
