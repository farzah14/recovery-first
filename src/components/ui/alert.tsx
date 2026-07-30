import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const alertVariants = cva('rounded-[var(--radius-md)] border p-4', {
  variants: {
    tone: {
      neutral: 'border-[var(--color-border)] bg-[var(--color-surface)]',
      info: 'border-[#BED5FA] bg-[#EEF5FF]',
      success: 'border-[var(--color-emerald-200)] bg-[var(--color-emerald-50)]',
      warning: 'border-[#F6D38A] bg-[#FFF7E6]',
      danger: 'border-[#F3B6B6] bg-[#FFF1F1]',
      recovery: 'border-[#D9C8FA] bg-[#F5F0FF]',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export function Alert({
  className,
  tone,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>): React.JSX.Element {
  return <div className={cn(alertVariants({ tone }), className)} role="status" {...props} />;
}
