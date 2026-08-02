'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Check, CheckCircle2, X } from 'lucide-react';

import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/lib/navigation/route-definitions';
import { cn } from '@/lib/cn';

export default function PricingPage(): React.JSX.Element {
  const [isAnnual, setIsAnnual] = useState(false);
  const monthlyRef = useRef<HTMLButtonElement>(null);
  const annualRef = useRef<HTMLButtonElement>(null);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({
    left: 4,
    width: 0,
  });

  useEffect(() => {
    const updatePill = () => {
      const activeNode = isAnnual ? annualRef.current : monthlyRef.current;
      if (activeNode) {
        setPillStyle({
          left: activeNode.offsetLeft,
          width: activeNode.offsetWidth,
        });
      }
    };

    updatePill();
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [isAnnual]);

  return (
    <ContentContainer className="flex flex-col items-center py-12 sm:py-16">
      {/* Header Section */}
      <header className="mb-12 max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)] sm:text-5xl">
          Tracker Plan
        </h1>
        <p className="mt-2 text-lg font-medium text-[var(--color-text-secondary)]">
          Simple, transparent pricing.
        </p>

        {/* Animated Toggle Monthly / Annually */}
        <div className="relative mt-8 inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-1 shadow-inner">
          {/* Animated Dynamic Width & Sliding White Pill Background */}
          {pillStyle.width > 0 && (
            <div
              aria-hidden="true"
              className="absolute top-1 bottom-1 rounded-full bg-[var(--color-surface)] shadow-xs transition-all duration-300 ease-out motion-reduce:transition-none"
              style={{
                left: `${pillStyle.left}px`,
                width: `${pillStyle.width}px`,
              }}
            />
          )}

          <button
            ref={monthlyRef}
            className={cn(
              'relative z-10 min-h-[44px] rounded-full px-6 text-sm transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none',
              !isAnnual
                ? 'font-bold text-[var(--color-text-primary)]'
                : 'font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
            onClick={() => setIsAnnual(false)}
            type="button"
          >
            Monthly
          </button>
          <button
            ref={annualRef}
            className={cn(
              'relative z-10 min-h-[44px] rounded-full px-6 text-sm transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none',
              isAnnual
                ? 'font-bold text-[var(--color-text-primary)]'
                : 'font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
            onClick={() => setIsAnnual(true)}
            type="button"
          >
            Annually <span className="ml-1 font-bold text-[var(--color-primary)]">-20%</span>
          </button>
        </div>
      </header>

      {/* Pricing Cards (Free, Lite, Premium) */}
      <div className="relative z-10 mb-16 grid w-full grid-cols-1 items-stretch gap-8 md:grid-cols-3">
        {/* 1. Free Plan */}
        <div className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-emerald-50)/40,var(--color-surface))] p-6 shadow-sm transition-all duration-300 hover:border-[var(--color-primary)]/40 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-[var(--color-primary)]">Free</h3>
              <Badge
                tone="neutral"
                className="border border-[var(--color-border)] bg-white text-xs"
              >
                Free Forever
              </Badge>
            </div>
            <div className="my-4">
              <span className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
                $0
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]"> /forever</span>
            </div>
            <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
              Cloud backup, full features, community support.
            </p>

            <ul className="mb-8 space-y-3">
              <li className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--color-primary)]" />
                <span>5 active habits</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--color-primary)]" />
                <span>Cloud backup & sync</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--color-primary)]" />
                <span>Cross-device access</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--color-primary)]" />
                <span>Basic recovery guidance</span>
              </li>
            </ul>
          </div>

          <Button asChild fullWidth variant="secondary">
            <Link href={routes.signIn}>Sign Up Free</Link>
          </Button>
        </div>

        {/* 2. Lite Plan ($5/mo, 10 habits) - Most Popular / Recommended */}
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border-2 border-[var(--color-primary)] bg-[var(--color-surface)] p-6 shadow-xl transition-all duration-300 md:-translate-y-2">
          <div className="absolute -top-0 right-0 rounded-bl-xl bg-[var(--color-primary)] px-3.5 py-1 text-[11px] font-bold tracking-wider text-white uppercase shadow-xs">
            Most Popular
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-[var(--color-primary)]">Lite</h3>
              <Badge tone="success" className="text-xs">
                10 Active Habits
              </Badge>
            </div>

            <div className="my-4">
              <span className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {isAnnual ? '$48' : '$5'}
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {isAnnual ? ' /yr' : ' /mo'}
              </span>
            </div>

            <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
              Expanded habit capacity & capacity analysis for active builders.
            </p>

            <ul className="mb-8 space-y-3">
              <li className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--color-primary)]" />
                <span>10 active habits</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--color-primary)]" />
                <span>Cloud backup & sync</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--color-primary)]" />
                <span>Enhanced recovery guidance</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--color-primary)]" />
                <span>Weekly capacity analysis</span>
              </li>
            </ul>
          </div>

          <Button asChild fullWidth variant="primary" className="shadow-md">
            <Link className="font-semibold !text-white" href={routes.today}>
              Start Trial
            </Link>
          </Button>
        </div>

        {/* 3. Premium Plan ($10/mo, 30 habits) */}
        <div className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-surface),var(--color-emerald-50)/30)] p-6 shadow-sm transition-all duration-300 hover:border-[var(--color-primary)]/40 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-[var(--color-primary)]">Premium</h3>
              <Badge tone="premium" className="text-xs">
                Full Power
              </Badge>
            </div>

            <div className="my-4">
              <span className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {isAnnual ? '$96' : '$10'}
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {isAnnual ? ' /yr' : ' /mo'}
              </span>
            </div>

            <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
              Maximum habit limits, advanced friction diagnostics, & priority support.
            </p>

            <ul className="mb-8 space-y-3">
              <li className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--color-primary)]" />
                <span>30 active habits</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--color-primary)]" />
                <span>Friction redesign engine</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--color-primary)]" />
                <span>Advanced analytics & export</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--color-primary)]" />
                <span>Email reminders & priority support</span>
              </li>
            </ul>
          </div>

          <Button asChild fullWidth variant="primary">
            <Link className="font-semibold !text-white" href={routes.today}>
              Get Premium
            </Link>
          </Button>
        </div>
      </div>

      {/* Compare Features Section */}
      <div className="mb-8 w-full max-w-4xl">
        <h2 className="mb-4 text-2xl font-bold text-[var(--color-primary)]">Compare Features</h2>
        <Card className="overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
                    <th className="w-1/4 p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
                      Feature
                    </th>
                    <th className="w-1/4 p-4 text-sm font-bold text-[var(--color-primary)]">
                      Free
                    </th>
                    <th className="w-1/4 p-4 text-sm font-bold text-[var(--color-primary)]">
                      Lite ($5)
                    </th>
                    <th className="w-1/4 p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
                      Premium ($10)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-sm text-[var(--color-text-primary)]">
                  <tr className="transition-colors hover:bg-[var(--color-surface-subtle)]">
                    <td className="p-4 font-semibold">Habit Limits</td>
                    <td className="p-4 font-semibold">5 active habits</td>
                    <td className="p-4 font-semibold">10 active habits</td>
                    <td className="p-4 font-semibold">30 active habits</td>
                  </tr>
                  <tr className="transition-colors hover:bg-[var(--color-surface-subtle)]">
                    <td className="p-4 font-semibold">Storage</td>
                    <td className="p-4 font-semibold">Cloud sync</td>
                    <td className="p-4">Cloud sync</td>
                    <td className="p-4">Cloud sync</td>
                  </tr>
                  <tr className="transition-colors hover:bg-[var(--color-surface-subtle)]">
                    <td className="p-4 font-semibold">Recovery</td>
                    <td className="p-4 font-semibold">Basic</td>
                    <td className="p-4 font-medium text-[var(--color-primary)]">
                      Enhanced guidance
                    </td>
                    <td className="p-4 font-medium text-[var(--color-primary)]">
                      Full Friction Engine
                    </td>
                  </tr>
                  <tr className="transition-colors hover:bg-[var(--color-surface-subtle)]">
                    <td className="p-4 font-semibold">Reminders</td>
                    <td className="p-4 text-[var(--color-text-muted)]">
                      <X className="size-4" />
                    </td>
                    <td className="p-4 text-[var(--color-text-muted)]">
                      <X className="size-4" />
                    </td>
                    <td className="p-4 font-medium text-[var(--color-primary)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Check className="size-4" /> Email
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trial Disclosure */}
      <p className="max-w-lg text-center text-xs text-[var(--color-text-secondary)]">
        14-day trial available for paid plans. Cancel anytime.
      </p>
    </ContentContainer>
  );
}
