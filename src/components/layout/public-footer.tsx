import Link from 'next/link';

import { ContentContainer } from '@/components/layout/content-container';
import { routes } from '@/lib/navigation/route-definitions';

export function PublicFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <ContentContainer className="grid gap-6 py-8 sm:grid-cols-2 sm:items-center">
        <div>
          <p className="font-semibold text-[var(--color-emerald-800)]">Recovery First</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Sustainable habits without punishment-first design.</p>
        </div>
        <nav aria-label="Legal and support" className="flex flex-wrap gap-x-5 gap-y-3 text-sm sm:justify-end">
          <Link href={routes.help}>Help</Link>
          <Link href={routes.status}>Status</Link>
          <Link href={routes.privacy}>Privacy</Link>
          <Link href={routes.terms}>Terms</Link>
        </nav>
      </ContentContainer>
    </footer>
  );
}
