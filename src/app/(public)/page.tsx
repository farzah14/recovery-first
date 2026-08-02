import Link from 'next/link';
import {
  Compass,
  Infinity,
  HeartPulse,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FaqSection } from '@/components/home/faq-section';
import { HeroMockup } from '@/components/home/hero-mockup';
import { routes } from '@/lib/navigation/route-definitions';

export default function HomePage(): React.JSX.Element {
  return (
    <>
      {/* 1. Hero Section */}
      <section className="relative w-full border-b border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-emerald-50),var(--color-page))] py-16 lg:py-20">
        <ContentContainer className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl leading-[1.1] font-bold tracking-tight text-[var(--color-primary)] sm:text-5xl lg:text-6xl">
              Build habits that actually stick.
              <br />
              <span className="text-[var(--color-text-primary)]">Even on your worst days.</span>
            </h1>

            <p className="max-w-[600px] text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
              The only habit tracker designed for recovery, not punishment. Switch between Full and
              Minimum targets without streak shame.
            </p>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button asChild size="large" variant="primary" className="shadow-md">
                <Link className="font-semibold !text-white" href={routes.today}>
                  Start Free
                </Link>
              </Button>
              <Button asChild size="large" variant="secondary">
                <Link href={routes.howItWorks}>
                  See How It Works <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </div>

            {/* Quick Micro Trust Signals */}
            <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-[var(--color-text-muted)]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[var(--color-primary)]" />
                <span>No sign-up needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-[var(--color-primary)]" />
                <span>100% Private local storage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="size-4 text-[var(--color-primary)]" />
                <span>Zero streak penalties</span>
              </div>
            </div>
          </div>

          {/* Interactive Hero App Mockup Component */}
          <HeroMockup />
        </ContentContainer>
      </section>

      {/* 2. Recovery-First Philosophy Section */}
      <section className="relative border-b border-[var(--color-border)] bg-[var(--color-surface)] py-20 lg:py-24">
        <ContentContainer className="relative z-10">
          <div className="mx-auto mb-16 max-w-[800px] text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-[var(--color-primary)] sm:text-4xl">
              The Recovery-First Philosophy
            </h2>
            <p className="text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
              Traditional trackers punish failure, breaking your motivation when life happens.
              RecoveryFirst uses misses as data to help you adapt, ensuring long-term sustainability
              over brittle streaks.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Column 1: Design Realistically */}
            <Card className="border-[var(--color-border)] p-6 transition-all hover:border-[var(--color-primary)]/40 hover:shadow-md">
              <CardContent className="p-0">
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-[var(--color-emerald-50)] text-[var(--color-primary)]">
                  <Compass aria-hidden="true" className="size-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">
                  Design Realistically
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Plan for days when you only have 10% to give. A minimum viable habit keeps the
                  neural pathway alive without overwhelming effort.
                </p>
              </CardContent>
            </Card>

            {/* Column 2: Maintain Continuity */}
            <Card className="border-[var(--color-border)] p-6 transition-all hover:border-[var(--color-minimum)]/40 hover:shadow-md">
              <CardContent className="p-0">
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-[#FFF7E6] text-[var(--color-minimum)]">
                  <Infinity aria-hidden="true" className="size-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">
                  Maintain Continuity
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Streaks are fragile. Continuity is resilient. Celebrate showing up in any
                  capacity, breaking the toxic all-or-nothing mindset forever.
                </p>
              </CardContent>
            </Card>

            {/* Column 3: Recover Guided */}
            <Card className="border-[var(--color-border)] p-6 transition-all hover:border-[var(--color-blue)]/40 hover:shadow-md">
              <CardContent className="p-0">
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-[#EEF5FF] text-[var(--color-blue)]">
                  <HeartPulse aria-hidden="true" className="size-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">
                  Recover Guided
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  When life derails you, the system provides gentle on-ramps and friction analysis
                  to get back on track without guilt or shame.
                </p>
              </CardContent>
            </Card>
          </div>
        </ContentContainer>
      </section>

      {/* 3. Privacy & Control Section */}
      <section className="w-full border-b border-[var(--color-border)] bg-[var(--color-surface)] py-20 lg:py-24">
        <ContentContainer>
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-emerald-50)]/50 p-8 lg:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
                  Your Data Stays Yours. Always.
                </h2>
                <p className="mb-6 text-base leading-relaxed text-[var(--color-text-secondary)]">
                  We believe personal habits are personal. RecoveryFirst is built on local-first
                  principles—your habit history is stored securely on your device, not on ad
                  networks.
                </p>

                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                        IndexedDB Local Storage
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Works completely offline and stores records in your browser.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                        Full Export & Erasure
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Export your complete JSON history or delete local data with one tap.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-[var(--color-text-primary)]">
                  Privacy & Data Guarantee
                </h3>
                <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                  <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                    <span>Ad Tracking</span>
                    <span className="font-semibold text-[var(--color-primary)]">Zero / None</span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                    <span>Data Selling</span>
                    <span className="font-semibold text-[var(--color-primary)]">Never</span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                    <span>Offline Usage</span>
                    <span className="font-semibold text-[var(--color-primary)]">
                      100% Functional
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Ownership</span>
                    <span className="font-semibold text-[var(--color-primary)]">
                      100% User Owned
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ContentContainer>
      </section>

      {/* 4. FAQ Section */}
      <section className="w-full border-b border-[var(--color-border)] bg-[var(--color-page)] py-20 lg:py-24">
        <ContentContainer>
          <div className="mx-auto mb-16 max-w-[800px] text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
              Everything you need to know about the Recovery-First philosophy and platform.
            </p>
          </div>

          <FaqSection />
        </ContentContainer>
      </section>
    </>
  );
}
