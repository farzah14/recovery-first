import { Input } from '@/components/ui/input';

export function InputField({
  id,
  label,
  description,
  error,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'id' | 'aria-describedby' | 'aria-invalid'> & {
  id: string;
  label: string;
  description?: string;
  error?: string;
}): React.JSX.Element {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      {description ? (
        <p className="text-sm text-[var(--color-text-secondary)]" id={descriptionId}>
          {description}
        </p>
      ) : null}
      <Input aria-describedby={describedBy} aria-invalid={Boolean(error)} id={id} {...props} />
      {error ? (
        <p className="text-sm font-medium text-[var(--color-danger)]" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
