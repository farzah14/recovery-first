import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BasicHabitTemplate } from '@/features/templates/catalog';

export function TemplateCard({
  template,
  onSelect,
}: {
  template: BasicHabitTemplate;
  onSelect: (templateId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{template.title}</CardTitle>
        <p className="text-sm text-[var(--color-text-secondary)]">{template.description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium">Normal</dt>
            <dd>{template.normalTarget.action}</dd>
          </div>
          <div>
            <dt className="font-medium">Minimum</dt>
            <dd>{template.minimumTarget.action}</dd>
          </div>
        </dl>
        <Button type="button" onClick={() => onSelect(template.id)}>
          Use template
        </Button>
      </CardContent>
    </Card>
  );
}
