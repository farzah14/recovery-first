'use client';

import { useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { basicHabitTemplates, findHabitTemplates } from '@/features/templates/catalog';
import { TemplateCard } from '@/features/templates/template-card';

export function TemplatePicker({ onSelect }: { onSelect: (templateId: string) => void }) {
  const [query, setQuery] = useState('');
  const templates = useMemo(
    () => (query ? findHabitTemplates(query) : basicHabitTemplates),
    [query],
  );

  return (
    <section aria-labelledby="template-heading" className="space-y-4">
      <div>
        <h2 id="template-heading" className="text-xl font-semibold">
          Start from a basic template
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Every template remains fully editable.
        </p>
      </div>
      <Input
        aria-label="Search templates"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
