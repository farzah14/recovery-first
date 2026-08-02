import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      tone: {
        neutral:
          'border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]',
        success:
          'border-[var(--color-emerald-200)] bg-[var(--color-emerald-50)] text-[var(--color-emerald-800)]',
        minimum: 'border-[#F6D38A] bg-[#FFF7E6] text-[#8A5700]',
        recovery: 'border-[#D9C8FA] bg-[#F5F0FF] text-[#6840B8]',
        info: 'border-[#BED5FA] bg-[#EEF5FF] text-[#245DAF]',
        danger: 'border-[#F3B6B6] bg-[#FFF1F1] text-[#B62E2E]',
        premium: 'border-[#F0D86C] bg-[#FFF9DB] text-[#7A6200]',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>): React.JSX.Element {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
