import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';

export function PublicPlaceholder({
  title,
  description,
}: Readonly<{ title: string; description: string }>): React.JSX.Element {
  return (
    <ContentContainer className="py-12 sm:py-16">
      <PageHeader description={description} title={title} />
      <Card className="mt-8">
        <CardContent className="py-8 text-sm leading-6 text-[var(--color-text-secondary)]">
          This page establishes the approved route and responsive shell. Product content is not connected in Plan 02.
        </CardContent>
      </Card>
    </ContentContainer>
  );
}
