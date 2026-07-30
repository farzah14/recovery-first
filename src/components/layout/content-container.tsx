import { cn } from '@/lib/cn';

export function ContentContainer({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>): React.JSX.Element {
  return (
    <div className={cn('mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}
