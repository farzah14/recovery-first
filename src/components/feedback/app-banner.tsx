import { Alert } from '@/components/ui/alert';

export function AppBanner({
  title,
  description,
  tone = 'info',
}: Readonly<{
  title: string;
  description: string;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'recovery';
}>): React.JSX.Element {
  return (
    <Alert tone={tone}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
    </Alert>
  );
}
