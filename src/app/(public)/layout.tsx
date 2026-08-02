import { PublicFooter } from '@/components/layout/public-footer';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicPageWrapper } from '@/components/layout/public-page-wrapper';

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-page)]">
      <PublicHeader />
      <PublicPageWrapper>{children}</PublicPageWrapper>
      <PublicFooter />
    </div>
  );
}
