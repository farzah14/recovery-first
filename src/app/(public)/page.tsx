import Link from 'next/link';
import { Compass, Infinity, HeartPulse, Info, Minus, Leaf, Check } from 'lucide-react';

import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/navigation/route-definitions';

export default function HomePage(): React.JSX.Element {
  return (
    <>
      {/* Hero Section */}
      <section className="w-full border-b border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-emerald-50),var(--color-page))] py-16 lg:py-24">
        <ContentContainer className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)] sm:text-5xl lg:text-6xl">
              Build habits that actually stick.<br />
              <span className="text-[var(--color-text-primary)]">Even on your worst days.</span>
            </h1>
            <p className="max-w-[600px] text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
              The only habit tracker designed for recovery, not punishment. Switch between Full and Minimum targets to keep your continuity alive without the shame of broken streaks.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button asChild size="large">
                <Link href={routes.today}>Start Free - No Account Required</Link>
              </Button>
              <Button asChild size="large" variant="secondary">
                <Link href={routes.howItWorks}>See How It Works</Link>
              </Button>
            </div>
          </div>

          {/* Hero App Mockup */}
          <div className="group relative w-full">
            <div className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rounded-2xl bg-[var(--color-primary)]/10 transition-transform group-hover:translate-x-1.5 group-hover:translate-y-1.5" />
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
              {/* Browser Chrome Header */}
              <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-3">
                <div className="size-3 rounded-full bg-[var(--color-danger)]/80" />
                <div className="size-3 rounded-full bg-[var(--color-minimum)]/80" />
                <div className="size-3 rounded-full bg-[var(--color-primary)]/80" />
              </div>

              {/* App Content Mockup */}
              <div className="flex flex-col gap-4 p-6 bg-[var(--color-page)]">
                <div className="flex items-center gap-3 rounded-lg border border-[var(--color-primary)]/15 bg-[var(--color-emerald-50)] p-4 text-[var(--color-primary)]">
                  <Info aria-hidden="true" className="size-5 shrink-0" />
                  <span className="text-sm font-medium">Today is about continuity. Minimum targets are perfectly fine.</span>
                </div>

                {/* Habit Card Mockup 1 (Minimum Target Met) */}
                <div className="relative flex items-center justify-between overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[var(--color-minimum)]" />
                  <div className="pl-2">
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Morning Walk</h3>
                    <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">Minimum target met today</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex size-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]">
                      <Minus aria-hidden="true" className="size-4" />
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-full border border-[var(--color-minimum)]/40 bg-[var(--color-minimum)]/15 text-[var(--color-minimum)]">
                      <Leaf aria-hidden="true" className="size-4" />
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]">
                      <Check aria-hidden="true" className="size-4" />
                    </div>
                  </div>
                </div>

                {/* Habit Card Mockup 2 (Full Target Met) */}
                <div className="flex items-center justify-between rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Deep Work</h3>
                    <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">Target: 2 Hours</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex size-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]">
                      <Minus aria-hidden="true" className="size-4" />
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]">
                      <Leaf aria-hidden="true" className="size-4" />
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                      <Check aria-hidden="true" className="size-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ContentContainer>
      </section>

      {/* Philosophy Section */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] py-20 lg:py-24">
        <ContentContainer className="relative z-10">
          <div className="mx-auto max-w-[800px] text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--color-primary)] sm:text-4xl mb-4">
              The Recovery-First Philosophy
            </h2>
            <p className="text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
              Traditional trackers punish failure, breaking your motivation when life happens. RecoveryFirst uses misses as data to help you adapt, ensuring long-term sustainability over brittle streaks.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Column 1: Design Realistically */}
            <Card className="p-6 transition-shadow hover:shadow-md">
              <CardContent className="p-0">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[var(--color-emerald-50)] text-[var(--color-primary)]">
                  <Compass aria-hidden="true" className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Design Realistically</h3>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  Plan for days when you only have 10% to give. A minimum viable habit keeps the neural pathway alive.
                </p>
              </CardContent>
            </Card>

            {/* Column 2: Maintain Continuity */}
            <Card className="p-6 transition-shadow hover:shadow-md">
              <CardContent className="p-0">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[#FFF7E6] text-[var(--color-minimum)]">
                  <Infinity aria-hidden="true" className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Maintain Continuity</h3>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  Streaks are fragile. Continuity is resilient. Celebrate showing up in any capacity, breaking the all-or-nothing mindset.
                </p>
              </CardContent>
            </Card>

            {/* Column 3: Recover Guided */}
            <Card className="p-6 transition-shadow hover:shadow-md">
              <CardContent className="p-0">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[#EEF5FF] text-[var(--color-blue)]">
                  <HeartPulse aria-hidden="true" className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Recover Guided</h3>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  When life derails you, the system provides gentle on-ramps to get back on track without overwhelming guilt.
                </p>
              </CardContent>
            </Card>
          </div>
        </ContentContainer>
      </section>
    </>
  );
}
