import Link from 'next/link';

import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { routes } from '@/lib/navigation/route-definitions';

export default function HomePage(): React.JSX.Element {
  return (
    <>
      <section className="border-b border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-emerald-50),var(--color-page))]">
        <ContentContainer className="grid gap-8 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">Recovery-first habit building</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Build habits that can recover when life changes.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">Plan a full action, define a realistic minimum, and continue without punishment-first streak pressure.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="large"><Link href={routes.today}>Start Free</Link></Button>
              <Button asChild size="large" variant="secondary"><Link href={routes.howItWorks}>How It Works</Link></Button>
            </div>
          </div>
          <Card>
            <CardHeader><CardTitle>Website foundation preview</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm text-[var(--color-text-secondary)]">
              <p>Responsive public and application shells are available.</p>
              <p>Habit data and check-in behavior begin in subsequent implementation plans.</p>
            </CardContent>
          </Card>
        </ContentContainer>
      </section>
    </>
  );
}
