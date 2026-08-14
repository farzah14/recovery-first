import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/lib/navigation/route-definitions';

export function PlanSummarySection(): React.JSX.Element {
  return (
    <section className="relative w-full border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]/30 py-20 lg:py-24">
      <ContentContainer>
        {/* Section Heading */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-emerald-50)] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-primary)] uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>Transparent Plans</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Simple Plans for Every Stage
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
            Start completely free with zero commitment. Upgrade when you need cross-device cloud
            sync and advanced friction analysis.
          </p>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Free Tier */}
          <div className="flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm transition-all duration-200 hover:border-[var(--color-primary)]/40 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[var(--color-primary)]">Free</h3>
                <Badge tone="neutral" className="text-xs">
                  Free Forever
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-[var(--color-text-primary)]">Rp0</span>
                <span className="text-xs text-[var(--color-text-secondary)]"> /forever</span>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                Perfect for getting started with local habit tracking.
              </p>

              <ul className="mt-6 space-y-2.5 text-xs text-[var(--color-text-secondary)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-[var(--color-primary)]" />
                  <span>Up to 5 active habits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-[var(--color-primary)]" />
                  <span>100% Private local storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-[var(--color-primary)]" />
                  <span>Basic recovery guidance</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 border-t border-[var(--color-border)] pt-4">
              <Button asChild fullWidth variant="secondary" size="compact">
                <Link href={routes.today}>Start Free Plan</Link>
              </Button>
            </div>
          </div>

          {/* Lite Tier */}
          <div className="relative flex flex-col justify-between rounded-2xl border-2 border-[var(--color-primary)] bg-white p-6 shadow-lg transition-all duration-200 md:-translate-y-1">
            <div className="absolute -top-3 right-4 rounded-full bg-[var(--color-primary)] px-3 py-0.5 text-[10px] font-bold text-white uppercase shadow-xs">
              Popular
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[var(--color-primary)]">Lite</h3>
                <Badge tone="success" className="text-xs">
                  10 Habits
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-[var(--color-text-primary)]">
                  Rp25.000
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]"> /month</span>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                For individuals seeking seamless cross-device cloud sync.
              </p>

              <ul className="mt-6 space-y-2.5 text-xs text-[var(--color-text-secondary)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-[var(--color-primary)]" />
                  <span>Up to 10 active habits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-[var(--color-primary)]" />
                  <span>Cloud backup &amp; sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-[var(--color-primary)]" />
                  <span>Weekly capacity analysis</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 border-t border-[var(--color-border)] pt-4">
              <Button asChild fullWidth variant="primary" size="compact" className="shadow-xs">
                <Link href={routes.pricing}>View Trial Details</Link>
              </Button>
            </div>
          </div>

          {/* Premium Tier */}
          <div className="flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm transition-all duration-200 hover:border-[var(--color-primary)]/40 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[var(--color-primary)]">Premium</h3>
                <Badge tone="premium" className="text-xs">
                  30 Habits
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-[var(--color-text-primary)]">
                  Rp50.000
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]"> /month</span>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                Maximum capacity with advanced behavioral friction diagnostics.
              </p>

              <ul className="mt-6 space-y-2.5 text-xs text-[var(--color-text-secondary)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-[var(--color-primary)]" />
                  <span>Up to 30 active habits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-[var(--color-primary)]" />
                  <span>Friction redesign engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-[var(--color-primary)]" />
                  <span>Priority support &amp; analytics export</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 border-t border-[var(--color-border)] pt-4">
              <Button asChild fullWidth variant="secondary" size="compact">
                <Link href={routes.pricing}>See Full Comparison</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Link to Full Pricing */}
        <div className="mt-10 text-center">
          <Link
            href={routes.pricing}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:underline"
          >
            Compare all plan features and 14-day trial terms <ArrowRight className="size-4" />
          </Link>
        </div>
      </ContentContainer>
    </section>
  );
}
