import Link from 'next/link';

import { ContentContainer } from '@/components/layout/content-container';
import { routes } from '@/lib/navigation/route-definitions';

export function PublicFooter(): React.JSX.Element {
  return (
    <footer className="mt-auto w-full border-t border-[var(--color-border)] bg-[var(--color-surface-subtle)] py-8 shadow-sm">
      <ContentContainer className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <span className="text-xl font-bold text-[var(--color-primary)]">RecoveryFirst</span>
          <span className="text-sm text-[var(--color-text-secondary)]">© 2026 RecoveryFirst. Built on a Recovery-First philosophy.</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link className="text-sm text-[var(--color-text-secondary)] transition-all hover:text-[var(--color-primary)] hover:underline" href={routes.privacy}>
            Privacy Policy
          </Link>
          <Link className="text-sm text-[var(--color-text-secondary)] transition-all hover:text-[var(--color-primary)] hover:underline" href={routes.terms}>
            Terms of Service
          </Link>
          <Link className="text-sm text-[var(--color-text-secondary)] transition-all hover:text-[var(--color-primary)] hover:underline" href={routes.help}>
            Support
          </Link>
          <Link className="text-sm text-[var(--color-text-secondary)] transition-all hover:text-[var(--color-primary)] hover:underline" href={routes.help}>
            Contact
          </Link>
        </div>
      </ContentContainer>
    </footer>
  );
}
