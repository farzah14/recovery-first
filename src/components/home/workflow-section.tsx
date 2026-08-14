import React from 'react';
import Link from 'next/link';
import { Compass, Flame, HeartPulse, ArrowRight, Check, Sparkles } from 'lucide-react';

import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/navigation/route-definitions';

export function WorkflowSection(): React.JSX.Element {
  return (
    <section className="relative w-full border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]/40 py-20 lg:py-24">
      <ContentContainer>
        {/* Section Heading */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-emerald-50)] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-primary)] uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>The Resilience Loop</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            How Continuity Overcomes All-or-Nothing Burnout
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
            Traditional trackers demand perfection. RecoveryFirst gives you a flexible 3-step loop
            designed for human energy fluctuations.
          </p>
        </div>

        {/* 3-Step Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Step 1 */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-primary)]/40 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--color-emerald-50)] text-[var(--color-primary)]">
                  <Compass className="size-6" aria-hidden="true" />
                </div>
                <span className="font-mono text-2xl font-black text-[var(--color-neutral-300)] transition-colors group-hover:text-[var(--color-primary)]/60">
                  01
                </span>
              </div>

              <div className="mt-6">
                <div className="text-xs font-bold tracking-wider text-[var(--color-primary)] uppercase">
                  Calibration
                </div>
                <h3 className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">
                  Dual-Target Design
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Set a{' '}
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    Full Target
                  </span>{' '}
                  for standard days and a{' '}
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    Minimum Floor
                  </span>{' '}
                  for exhausted days.
                </p>
              </div>

              {/* Visual Micro-Badge Example */}
              <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] p-3">
                <div className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Example: Morning Workout
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-emerald-50)] px-2.5 py-1 font-semibold text-[var(--color-primary)]">
                    <Check className="size-3.5" /> Full: 30 mins
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF7E6] px-2.5 py-1 font-semibold text-[var(--color-minimum)]">
                    <Sparkles className="size-3.5" /> Min: 5 mins
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-minimum)]/40 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#FFF7E6] text-[var(--color-minimum)]">
                  <Flame className="size-6" aria-hidden="true" />
                </div>
                <span className="font-mono text-2xl font-black text-[var(--color-neutral-300)] transition-colors group-hover:text-[var(--color-minimum)]/60">
                  02
                </span>
              </div>

              <div className="mt-6">
                <div className="text-xs font-bold tracking-wider text-[var(--color-minimum)] uppercase">
                  Execution
                </div>
                <h3 className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">
                  Frictionless Check-In
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Log in a single tap. Showing up at Minimum effort maintains neural momentum and
                  keeps your streak guilt-free.
                </p>
              </div>

              {/* Visual Micro-Badge Example */}
              <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] p-3">
                <div className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Check-In Status
                </div>
                <div className="mt-2 flex items-center justify-between rounded-lg bg-white p-2 text-xs font-semibold shadow-2xs">
                  <span className="text-[var(--color-text-primary)]">Low energy today?</span>
                  <span className="rounded bg-[#FFF7E6] px-2 py-0.5 text-[var(--color-minimum)]">
                    Min Counted ✓
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-purple)]/40 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#EEF5FF] text-[var(--color-blue)]">
                  <HeartPulse className="size-6" aria-hidden="true" />
                </div>
                <span className="font-mono text-2xl font-black text-[var(--color-neutral-300)] transition-colors group-hover:text-[var(--color-purple)]/60">
                  03
                </span>
              </div>

              <div className="mt-6">
                <div className="text-xs font-bold tracking-wider text-[var(--color-purple)] uppercase">
                  Continuity
                </div>
                <h3 className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">
                  Guided Recovery Ramp
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Missed several days due to sickness or travel? The system builds a gentle 3-day
                  ramp back rather than resetting you to zero.
                </p>
              </div>

              {/* Visual Micro-Badge Example */}
              <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] p-3">
                <div className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Recovery Ramp
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  <span className="rounded bg-purple-100 px-2 py-0.5 font-bold text-[var(--color-purple)]">
                    Day 1: 50%
                  </span>
                  <span className="text-[var(--color-text-muted)]">→</span>
                  <span className="rounded bg-purple-100 px-2 py-0.5 font-bold text-[var(--color-purple)]">
                    Day 2: 75%
                  </span>
                  <span className="text-[var(--color-text-muted)]">→</span>
                  <span className="rounded bg-[var(--color-emerald-50)] px-2 py-0.5 font-bold text-[var(--color-primary)]">
                    100%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Link to How It Works */}
        <div className="mt-12 text-center">
          <Button asChild variant="secondary" size="large">
            <Link href={routes.howItWorks} className="inline-flex items-center gap-2 font-semibold">
              Explore the Full 6-Step Loop <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </ContentContainer>
    </section>
  );
}
