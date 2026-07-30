import { cn } from '@/lib/cn';

export function Section({
  children,
  className,
  labelledBy,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}>): React.JSX.Element {
  return (
    <section aria-labelledby={labelledBy} className={cn('py-6 sm:py-8', className)}>
      {children}
    </section>
  );
}
