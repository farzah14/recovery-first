import Link from 'next/link';

import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/navigation/route-definitions';

export default function SignInPage(): React.JSX.Element {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-page)]">
      <ContentContainer className="flex flex-1 items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardContent className="grid gap-6 pt-6">
            <PageHeader description="Sign in options and Guest mode entry point." title="Sign In" />
            <div className="grid gap-3">
              <Button asChild fullWidth size="touch"><Link href={routes.today}>Continue in Guest Mode</Link></Button>
              <Button asChild fullWidth size="touch" variant="secondary"><Link href={routes.home}>Return Home</Link></Button>
            </div>
          </CardContent>
        </Card>
      </ContentContainer>
    </div>
  );
}
