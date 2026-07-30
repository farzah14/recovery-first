'use client';

import { Checkbox } from '@/components/ui/checkbox';

export function CheckboxField({
  id,
  label,
  description,
}: Readonly<{ id: string; label: string; description?: string }>): React.JSX.Element {
  return (
    <div className="flex items-start gap-3">
      <Checkbox aria-describedby={description ? `${id}-description` : undefined} id={id} />
      <div className="grid gap-1">
        <label className="cursor-pointer text-sm font-semibold" htmlFor={id}>{label}</label>
        {description ? <p className="text-sm text-[var(--color-text-secondary)]" id={`${id}-description`}>{description}</p> : null}
      </div>
    </div>
  );
}
