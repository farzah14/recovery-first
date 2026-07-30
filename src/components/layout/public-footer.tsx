import Link from 'next/link';

import { ContentContainer } from '@/components/layout/content-container';
import { routes } from '@/lib/navigation/route-definitions';

const footerLinkClasses =
  'relative text-sm text-[var(--color-text-secondary)] transition-colors hover:!text-[var(--color-primary)] after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:w-0 after:bg-[var(--color-primary)] after:transition-all after:duration-300 hover:after:w-full';

export function PublicFooter(): React.JSX.Element {
  return (
    <footer className="mt-auto w-full border-t border-[var(--color-border)] bg-[var(--color-surface-subtle)] py-8 shadow-sm">
      <ContentContainer className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <span className="text-xl font-bold text-[var(--color-primary)]">RecoveryFirst</span>
          <span className="text-sm text-[var(--color-text-secondary)]">© 2026 RecoveryFirst. Built on a Recovery-First philosophy.</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link className={footerLinkClasses} href={routes.privacy}>
            Privacy Policy
          </Link>
          <Link className={footerLinkClasses} href={routes.terms}>
            Terms of Service
          </Link>
          <Link className={footerLinkClasses} href={routes.help}>
            Support
          </Link>
          <Link className={footerLinkClasses} href={routes.help}>
            Contact
          </Link>
        </div>
      </ContentContainer>
    </footer>
  );
}
