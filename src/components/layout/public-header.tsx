import Link from 'next/link';

import { ContentContainer } from '@/components/layout/content-container';
import { routes } from '@/lib/navigation/route-definitions';

export function PublicHeader(): React.JSX.Element {
  return (
    <nav className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 shadow-[0_1px_2px_rgba(22,26,23,0.04)] sm:px-8">
      <ContentContainer className="flex items-center justify-between gap-8 px-0">
        <div className="flex items-center gap-8">
          <Link className="text-xl font-bold tracking-tight text-[var(--color-primary)]" href={routes.home}>
            RecoveryFirst
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link className="text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]" href={routes.features}>
              Features
            </Link>
            <Link className="text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]" href={routes.pricing}>
              Pricing
            </Link>
            <Link className="text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]" href={routes.howItWorks}>
              About
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link className="text-sm font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]" href={routes.signIn}>
            Sign In
          </Link>
          <Link className="flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold !text-white transition-opacity hover:opacity-90" href={routes.today}>
            Start Free
          </Link>
        </div>
      </ContentContainer>
    </nav>
  );
}
