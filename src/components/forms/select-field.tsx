'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SelectField({
  id,
  label,
  placeholder,
  options,
}: Readonly<{
  id: string;
  label: string;
  placeholder: string;
  options: ReadonlyArray<{ label: string; value: string }>;
}>): React.JSX.Element {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      <Select>
        <SelectTrigger aria-label={label} id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
