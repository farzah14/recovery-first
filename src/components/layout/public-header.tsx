import Link from 'next/link';

import { ContentContainer } from '@/components/layout/content-container';
import { routes } from '@/lib/navigation/route-definitions';

const navLinkClasses =
  'relative inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--color-text-secondary)] transition-all duration-150 hover:!text-[var(--color-primary)] active:bg-[var(--color-border)]/40 active:opacity-80 active:scale-95 after:absolute after:bottom-0 after:left-3 after:h-[2px] after:w-0 after:bg-[var(--color-primary)] after:transition-all after:duration-300 hover:after:w-[calc(100%-24px)]';

export function PublicHeader(): React.JSX.Element {
  return (
    <nav className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 shadow-[0_1px_2px_rgba(22,26,23,0.04)] sm:px-8">
      <ContentContainer className="flex items-center justify-between gap-8 px-0">
        <div className="flex items-center gap-8">
          <Link className="text-xl font-bold tracking-tight text-[var(--color-primary)] transition-all active:opacity-80 active:scale-95" href={routes.home}>
            RecoveryFirst
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <Link className={navLinkClasses} href={routes.features}>
              Features
            </Link>
            <Link className={navLinkClasses} href={routes.pricing}>
              Pricing
            </Link>
            <Link className={navLinkClasses} href={routes.howItWorks}>
              How It Works
            </Link>
            <Link className={navLinkClasses} href={routes.about}>
              About
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link className="relative inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--color-primary)] transition-all duration-150 hover:!text-[var(--color-primary-hover)] active:bg-[var(--color-border)]/40 active:opacity-80 active:scale-95 after:absolute after:bottom-0 after:left-3 after:h-[2px] after:w-0 after:bg-[var(--color-primary)] after:transition-all after:duration-300 hover:after:w-[calc(100%-24px)]" href={routes.signIn}>
            Sign In
          </Link>
          <Link className="flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold !text-white transition-all hover:opacity-90 hover:shadow-md active:scale-95 active:opacity-80" href={routes.today}>
            Start Free
          </Link>
        </div>
      </ContentContainer>
    </nav>
  );
}
