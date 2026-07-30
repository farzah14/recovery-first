'use client';

import { Switch } from '@/components/ui/switch';

export function SwitchField({
  id,
  label,
  description,
}: Readonly<{ id: string; label: string; description?: string }>): React.JSX.Element {
  return (
    <div className="flex min-h-11 items-start justify-between gap-4">
      <div className="grid gap-1">
        <label className="cursor-pointer text-sm font-semibold" htmlFor={id}>{label}</label>
        {description ? <p className="text-sm text-[var(--color-text-secondary)]" id={`${id}-description`}>{description}</p> : null}
      </div>
      <Switch aria-describedby={description ? `${id}-description` : undefined} id={id} />
    </div>
  );
}
