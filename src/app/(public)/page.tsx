import Link from 'next/link';
import {
  Compass,
  Infinity,
  HeartPulse,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Check,
  Database,
  Download,
  EyeOff,
  FileJson,
  HardDrive,
  Lock,
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
      <section className="w-full border-b border-[var(--color-border)] bg-[var(--color-surface)] py-20 lg:py-28">
        <ContentContainer>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left Column: Core Value Proposition */}
            <div className="flex flex-col lg:col-span-6 xl:col-span-7">
              <div className="mb-4 inline-flex items-center gap-2 self-start rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-emerald-50)] px-3.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                <span>Privacy &amp; Data Sovereignty</span>
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
                Your Data Stays Yours.
                <br />
                <span className="text-[var(--color-primary)]">Always.</span>
              </h2>

              <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
                We believe personal habits are personal. RecoveryFirst is built on local-first
                principles—your habit history is stored securely on your device, not on ad networks.
              </p>

              {/* Feature Highlights Grid */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {/* Feature 1: IndexedDB */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)]/60 p-5 transition-all duration-200 hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-subtle)]">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-primary)] shadow-2xs">
                    <Database className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    IndexedDB Local Storage
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    Works completely offline and stores records in your browser.
                  </p>
                </div>

                {/* Feature 2: Full Export & Erasure */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)]/60 p-5 transition-all duration-200 hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-subtle)]">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-primary)] shadow-2xs">
                    <Download className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    Full Export &amp; Erasure
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    Export your complete JSON history or delete local data with one tap.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Privacy Architecture Card */}
            <div className="lg:col-span-6 xl:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]">
                {/* Header bar with simulated live status */}
                <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]/80 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-75"></span>
                      <span className="relative inline-flex size-2.5 rounded-full bg-[var(--color-primary)]"></span>
                    </span>
                    <span className="text-xs font-semibold tracking-wide text-[var(--color-text-primary)]">
                      Privacy &amp; Data Guarantee
                    </span>
                  </div>
                  <span className="rounded-md border border-[var(--color-emerald-200)] bg-[var(--color-emerald-50)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-primary)]">
                    Active Protection
                  </span>
                </div>

                {/* Architecture Matrix Details */}
                <div className="divide-y divide-[var(--color-border)] p-5">
                  <div className="flex items-center justify-between py-3 first:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-emerald-50)] text-[var(--color-primary)]">
                        <HardDrive className="size-4" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                          Offline Usage
                        </div>
                        <div className="text-sm font-bold text-[var(--color-text-primary)]">
                          100% Functional
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                      <Check className="size-3.5 stroke-[2.5]" aria-hidden="true" /> Zero Latency
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]">
                        <EyeOff className="size-4" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                          Ad Tracking
                        </div>
                        <div className="text-sm font-bold text-[var(--color-text-primary)]">
                          Zero / None
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                      <Check className="size-3.5 stroke-[2.5]" aria-hidden="true" /> 0 Trackers
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]">
                        <Lock className="size-4" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                          Data Selling
                        </div>
                        <div className="text-sm font-bold text-[var(--color-text-primary)]">
                          Never
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                      <Check className="size-3.5 stroke-[2.5]" aria-hidden="true" /> Guaranteed
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-emerald-50)] text-[var(--color-primary)]">
                        <FileJson className="size-4" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[var(--color-text-secondary)]">
                          Data Ownership
                        </div>
                        <div className="text-sm font-bold text-[var(--color-text-primary)]">
                          100% User-Owned
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                      <Check className="size-3.5 stroke-[2.5]" aria-hidden="true" /> Direct Export
                    </span>
                  </div>
                </div>

                {/* Footer Callout */}
                <div className="border-t border-[var(--color-border)] bg-[var(--color-emerald-50)]/40 p-4 text-center">
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      Local-first architecture:
                    </span>{' '}
                    Your habits remain safe on your device, private and tamper-resistant.
                  </p>
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
