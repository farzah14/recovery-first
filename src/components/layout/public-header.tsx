'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, ArrowRight } from 'lucide-react';

import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/navigation/route-definitions';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';

const navLinkClasses =
  'relative inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--color-text-secondary)] transition-all duration-150 hover:!text-[var(--color-primary)] active:bg-[var(--color-border)]/40 active:opacity-80 active:scale-95 after:absolute after:bottom-0 after:left-3 after:h-[2px] after:w-0 after:bg-[var(--color-primary)] after:transition-all after:duration-300 hover:after:w-[calc(100%-24px)]';

export function PublicHeader(): React.JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 shadow-[0_1px_2px_rgba(22,26,23,0.04)] sm:px-8">
      <ContentContainer className="flex items-center justify-between gap-8 px-0">
        <div className="flex items-center gap-8">
          <Link
            className="text-xl font-bold tracking-tight text-[var(--color-primary)] transition-all active:scale-95 active:opacity-80"
            href={routes.home}
          >
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

        {/* Action buttons */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            className="relative inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--color-primary)] transition-all duration-150 after:absolute after:bottom-0 after:left-3 after:h-[2px] after:w-0 after:bg-[var(--color-primary)] after:transition-all after:duration-300 hover:!text-[var(--color-primary-hover)] hover:after:w-[calc(100%-24px)] active:scale-95 active:bg-[var(--color-border)]/40 active:opacity-80"
            href={routes.signIn}
          >
            Sign In
          </Link>
          <Button asChild size="large" variant="primary" className="shadow-md">
            <Link className="font-semibold !text-white" href={routes.today}>
              Join
            </Link>
          </Button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="flex size-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] md:hidden"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </ContentContainer>

      {/* Mobile Drawer Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="flex flex-col justify-between p-6">
          <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Navigation links to discover features, pricing, methodology, and sign in.
          </SheetDescription>

          <div>
            <div className="mb-6 flex items-center justify-between border-b border-[var(--color-border)] pb-4">
              <Link
                href={routes.home}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-bold text-[var(--color-primary)]"
              >
                RecoveryFirst
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={routes.features}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl p-3 font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]"
              >
                <span>Features</span>
                <ArrowRight className="size-4 text-[var(--color-text-muted)]" />
              </Link>
              <Link
                href={routes.pricing}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl p-3 font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]"
              >
                <span>Pricing</span>
                <ArrowRight className="size-4 text-[var(--color-text-muted)]" />
              </Link>
              <Link
                href={routes.howItWorks}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl p-3 font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]"
              >
                <span>How It Works</span>
                <ArrowRight className="size-4 text-[var(--color-text-muted)]" />
              </Link>
              <Link
                href={routes.about}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl p-3 font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]"
              >
                <span>About</span>
                <ArrowRight className="size-4 text-[var(--color-text-muted)]" />
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[var(--color-border)] pt-6">
            <Button asChild fullWidth variant="secondary" size="large">
              <Link href={routes.signIn} onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
            </Button>
            <Button asChild fullWidth variant="primary" size="large" className="shadow-md">
              <Link href={routes.today} onClick={() => setMobileMenuOpen(false)}>
                Join
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
