import { BarChart2, Check, Database, HeartPulse, Leaf, Lock, Shield, Sparkles } from 'lucide-react';

import { ContentContainer } from '@/components/layout/content-container';
import { Card, CardContent } from '@/components/ui/card';

export default function FeaturesPage(): React.JSX.Element {
  return (
    <ContentContainer className="py-16">
      {/* Hero Section (Matching Previous Clean Title Style) */}
      <section className="mx-auto mb-16 max-w-3xl text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-[var(--color-primary)] sm:text-5xl">
          Built for the reality of habit building.
        </h1>
        <p className="text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
          Most trackers punish you for missing a day. We help you get back on track with flexibility
          and compassion.
        </p>
      </section>

      {/* Features Grid (Compact & Refined Rectangles) */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Feature 1: Flexible Continuity */}
        <Card className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40 hover:shadow-md">
          <CardContent className="p-0">
            <div className="mb-4 flex items-start gap-4">
              <div className="shrink-0 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-emerald-50)] p-3 text-[var(--color-primary)]">
                <Leaf aria-hidden="true" className="size-6" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">
                  Flexible Continuity
                </h3>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  Completing a minimum version of a habit preserves your continuity. Life happens,
                  and showing up minimally is still showing up.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-emerald-50)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                <Check aria-hidden="true" className="size-4" /> Full Target
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#F6D38A] bg-[#FFF7E6] px-3 py-1 text-xs font-semibold text-[var(--color-minimum)]">
                <Sparkles aria-hidden="true" className="size-4" /> Minimum Target
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Feature 2: Supportive Recovery Mode */}
        <Card className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-purple)]/40 hover:shadow-md">
          <CardContent className="p-0">
            <div className="mb-4 flex items-start gap-4">
              <div className="shrink-0 rounded-xl border border-[var(--color-purple)]/20 bg-[var(--color-purple)]/10 p-3 text-[var(--color-purple)]">
                <Shield aria-hidden="true" className="size-6" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">
                  Supportive Recovery Mode
                </h3>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  A guided path back to consistency after a disruption. No guilt, no broken streaks,
                  just a gentle ramp back to your routine.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl border border-[var(--color-purple)]/20 bg-[var(--color-purple)]/5 p-3.5">
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                Recovery Phase Active
              </span>
              <HeartPulse
                aria-hidden="true"
                className="size-4 animate-pulse text-[var(--color-purple)]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature 3: Insightful Weekly Reviews */}
        <Card className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40 hover:shadow-md">
          <CardContent className="p-0">
            <div className="mb-4 flex items-start gap-4">
              <div className="shrink-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 text-[var(--color-primary)]">
                <BarChart2 aria-hidden="true" className="size-6" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">
                  Insightful Weekly Reviews
                </h3>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  Identify patterns and get smart recommendations to help you adapt your targets
                  based on your actual capacity.
                </p>
              </div>
            </div>
            <div className="mt-6 flex h-20 items-end gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3">
              <div className="h-1/2 w-full rounded-t-xs bg-[var(--color-emerald-200)]" />
              <div className="h-3/4 w-full rounded-t-xs bg-[var(--color-emerald-200)]" />
              <div className="h-1/4 w-full rounded-t-xs bg-[var(--color-minimum)]/50" />
              <div className="h-1/3 w-full rounded-t-xs bg-[var(--color-neutral-300)]" />
              <div className="h-full w-full rounded-t-xs bg-[var(--color-primary)]" />
            </div>
          </CardContent>
        </Card>

        {/* Feature 4: Privacy & Control */}
        <Card className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40 hover:shadow-md">
          <CardContent className="p-0">
            <div className="mb-4 flex items-start gap-4">
              <div className="shrink-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 text-[var(--color-primary)]">
                <Lock aria-hidden="true" className="size-6" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">
                  Privacy &amp; Control
                </h3>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  Guest-first mode with browser-local storage and safe account sync. Your habits are
                  yours alone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3.5">
              <Database
                aria-hidden="true"
                className="size-4 shrink-0 text-[var(--color-primary)]"
              />
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                Local Storage Active
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </ContentContainer>
  );
}
