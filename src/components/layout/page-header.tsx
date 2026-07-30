import { cn } from '@/lib/cn';

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: Readonly<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
  className?: string;
}>): React.JSX.Element {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-sm font-semibold text-[var(--color-primary)]">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </header>
  );
}
