import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ContentContainer } from '@/components/layout/content-container';
import { publicNavigation, routes } from '@/lib/navigation/route-definitions';

export function PublicHeader(): React.JSX.Element {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_94%,transparent)] backdrop-blur">
      <ContentContainer className="flex min-h-16 items-center justify-between gap-4">
        <Link className="font-semibold text-[var(--color-emerald-800)]" href={routes.home}>Recovery First</Link>
        <nav aria-label="Public navigation" className="hidden items-center gap-1 md:flex">
          {publicNavigation.map((item) => (
            <Button asChild key={item.href} variant="ghost"><Link href={item.href}>{item.label}</Link></Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden sm:inline-flex bg-[var(--color-primary)] !text-white hover:bg-[var(--color-primary-hover)]" variant="primary">
            <Link className="!text-white" href={routes.signIn}>Sign In</Link>
          </Button>
          <Button asChild size="compact" className="bg-[var(--color-primary)] !text-white hover:bg-[var(--color-primary-hover)]" variant="primary">
            <Link className="!text-white" href={routes.today}>Start Free</Link>
          </Button>
        </div>
      </ContentContainer>
    </header>
  );
}
