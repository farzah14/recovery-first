'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function RadioGroupField({
  label,
  name,
  options,
}: Readonly<{
  label: string;
  name: string;
  options: ReadonlyArray<{ label: string; value: string; description?: string }>;
}>): React.JSX.Element {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold">{label}</legend>
      <RadioGroup aria-label={label} name={name} className="grid gap-2">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          return (
            <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3" key={option.value}>
              <RadioGroupItem id={id} value={option.value} />
              <div className="grid gap-1">
                <label className="cursor-pointer text-sm font-semibold" htmlFor={id}>{option.label}</label>
                {option.description ? <p className="text-sm text-[var(--color-text-secondary)]">{option.description}</p> : null}
              </div>
            </div>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
