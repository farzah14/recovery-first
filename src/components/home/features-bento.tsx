import React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CheckCircle2,
  HardDrive,
  HeartPulse,
  Leaf,
  Shield,
  Sparkles,
  ArrowRight,
  Sliders,
} from 'lucide-react';

import { ContentContainer } from '@/components/layout/content-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/navigation/route-definitions';

export function FeaturesBento(): React.JSX.Element {
  return (
    <section className="relative w-full border-b border-[var(--color-border)] bg-[var(--color-surface)] py-20 lg:py-24">
      <ContentContainer>
        {/* Section Heading */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-emerald-50)] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-primary)] uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>Built For Real Life</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Features Designed to Support, Never Shame
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
            Every feature in RecoveryFirst is engineered around behavioral psychology and human
            resilience.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Bento Item 1: Flexible Targets (Col span 7) */}
          <Card className="overflow-hidden border-[var(--color-border)] p-6 transition-all duration-200 hover:border-[var(--color-primary)]/40 hover:shadow-md md:col-span-7">
            <CardContent className="flex h-full flex-col justify-between p-0">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--color-emerald-50)] text-[var(--color-primary)]">
                  <Leaf className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-[var(--color-text-primary)]">
                  Dual-Scale Continuity
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Log either Full or Minimum targets on your terms. When you only have 10% energy,
                  giving your minimum keeps the neural pathway alive and preserves continuity.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-emerald-50)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)]">
                  <CheckCircle2 className="size-4" /> Full Target (100%)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#F6D38A] bg-[#FFF7E6] px-3 py-1.5 text-xs font-semibold text-[var(--color-minimum)]">
                  <Sparkles className="size-4" /> Minimum Floor (Active)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                  Neutral Skip (Data Point)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Bento Item 2: Guided Recovery Mode (Col span 5) */}
          <Card className="overflow-hidden border-[var(--color-border)] p-6 transition-all duration-200 hover:border-[var(--color-purple)]/40 hover:shadow-md md:col-span-5">
            <CardContent className="flex h-full flex-col justify-between p-0">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--color-purple)]/10 text-[var(--color-purple)]">
                  <HeartPulse className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-[var(--color-text-primary)]">
                  Supportive Recovery Mode
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  A personalized on-ramp back to your routine after disruptions. No guilt or streak
                  shame.
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-[var(--color-purple)]/20 bg-[var(--color-purple)]/5 p-3.5">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--color-purple)]">
                  <span>Guided Recovery Active</span>
                  <span className="animate-pulse">● Live</span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Targets scaled down temporarily to ease you back gently.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bento Item 3: Weekly Friction Analysis (Col span 5) */}
          <Card className="overflow-hidden border-[var(--color-border)] p-6 transition-all duration-200 hover:border-[var(--color-primary)]/40 hover:shadow-md md:col-span-5">
            <CardContent className="flex h-full flex-col justify-between p-0">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--color-emerald-50)] text-[var(--color-primary)]">
                  <Sliders className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-[var(--color-text-primary)]">
                  Weekly Friction Review
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Identify patterns, see what got in the way, and receive 1-click recommendations to
                  adjust habit targets.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] p-3">
                <BarChart3 className="size-5 text-[var(--color-primary)]" />
                <div className="text-xs">
                  <span className="font-bold text-[var(--color-text-primary)]">
                    Recommendation:
                  </span>{' '}
                  <span className="text-[var(--color-text-secondary)]">
                    Shift reading to morning slot
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bento Item 4: Private & Local-First (Col span 7) */}
          <Card className="overflow-hidden border-[var(--color-border)] p-6 transition-all duration-200 hover:border-[var(--color-primary)]/40 hover:shadow-md md:col-span-7">
            <CardContent className="flex h-full flex-col justify-between p-0">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--color-emerald-50)] text-[var(--color-primary)]">
                  <HardDrive className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-[var(--color-text-primary)]">
                  Local-First &amp; Private by Design
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Start instantly with browser IndexedDB storage. No sign-up required. Your habits
                  are stored on your device, with optional zero-friction encrypted cloud sync
                  whenever you are ready.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-[var(--color-text-primary)]">
                <div className="flex items-center gap-1.5">
                  <Shield className="size-4 text-[var(--color-primary)]" />
                  <span>Zero trackers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HardDrive className="size-4 text-[var(--color-primary)]" />
                  <span>100% Offline ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[var(--color-primary)]" />
                  <span>Direct JSON export</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Link to Full Features */}
        <div className="mt-12 text-center">
          <Button asChild variant="secondary" size="large">
            <Link href={routes.features} className="inline-flex items-center gap-2 font-semibold">
              View All Feature Capabilities <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </ContentContainer>
    </section>
  );
}
