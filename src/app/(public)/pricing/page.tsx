'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, CheckCircle2, X } from 'lucide-react';

import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/navigation/route-definitions';
import { cn } from '@/lib/cn';

export default function PricingPage(): React.JSX.Element {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <ContentContainer className="flex flex-col items-center py-12 sm:py-16">
      {/* Header Section */}
      <header className="mb-12 max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)] sm:text-5xl">
          Simple, transparent pricing.
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
          Choose the plan that best fits your recovery journey. No hidden fees, no pressure.
        </p>

        {/* Toggle Monthly / Annually */}
        <div className="mt-8 inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-1">
          <button
            className={cn(
              'min-h-[44px] rounded-full px-6 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
              !isAnnual
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
            onClick={() => setIsAnnual(false)}
            type="button"
          >
            Monthly
          </button>
          <button
            className={cn(
              'min-h-[44px] rounded-full px-6 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
              isAnnual
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
            onClick={() => setIsAnnual(true)}
            type="button"
          >
            Annually <span className="ml-1 text-[var(--color-primary)]">-20%</span>
          </button>
        </div>
      </header>

      {/* Pricing Bento Grid */}
      <div className="relative z-10 mb-16 grid w-full grid-cols-1 items-start gap-8 md:grid-cols-3">
        {/* Guest Plan */}
        <Card className="flex h-full flex-col p-6 transition-colors hover:border-[var(--color-primary)]">
          <CardContent className="flex h-full flex-col p-0">
            <h3 className="text-2xl font-bold text-[var(--color-primary)]">Guest</h3>
            <div className="my-4">
              <span className="text-4xl font-bold text-[var(--color-text-primary)]">$0</span>
              <span className="text-sm text-[var(--color-text-secondary)]">/forever</span>
            </div>
            <p className="mb-6 flex-grow text-sm text-[var(--color-text-secondary)]">
              Local only. Good for trying it out.
            </p>
            <ul className="mb-8 space-y-3">
              <li className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 text-[var(--color-primary)]" />
                <span>3 active habits</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 text-[var(--color-primary)]" />
                <span>Local browser storage</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 text-[var(--color-primary)]" />
                <span>Basic recovery</span>
              </li>
            </ul>
            <Button asChild fullWidth variant="secondary">
              <Link href={routes.today}>Get Started</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Free Plan (Recommended) */}
        <div className="relative flex h-full flex-col rounded-[14px] border-2 border-[var(--color-primary)] bg-[var(--color-primary)] p-6 shadow-md md:-translate-y-3">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-emerald-700)] px-3 py-1 text-xs font-semibold text-white shadow-sm">
            Recommended
          </div>
          <h3 className="text-2xl font-bold text-white">Free</h3>
          <div className="my-4">
            <span className="text-4xl font-bold text-white">$0</span>
            <span className="text-sm text-emerald-100">/forever</span>
          </div>
          <p className="mb-6 flex-grow text-sm text-emerald-100">
            Cloud sync, full features, community support.
          </p>
          <ul className="mb-8 space-y-3">
            <li className="flex items-center gap-2 text-sm text-white">
              <CheckCircle2 className="size-5 text-emerald-200" />
              <span>5 active habits</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-white">
              <CheckCircle2 className="size-5 text-emerald-200" />
              <span>Cloud backup</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-white">
              <CheckCircle2 className="size-5 text-emerald-200" />
              <span>Cross-device sync</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-white">
              <CheckCircle2 className="size-5 text-emerald-200" />
              <span>Basic recovery</span>
            </li>
          </ul>
          <Button asChild fullWidth className="bg-white text-[var(--color-primary)] hover:bg-emerald-50">
            <Link href={routes.signIn}>Sign Up Free</Link>
          </Button>
        </div>

        {/* Premium Plan */}
        <Card className="flex h-full flex-col p-6 transition-colors hover:border-[var(--color-primary)]">
          <CardContent className="flex h-full flex-col p-0">
            <h3 className="text-2xl font-bold text-[var(--color-primary)]">Premium</h3>
            <div className="my-4">
              <span className="text-4xl font-bold text-[var(--color-text-primary)]">
                {isAnnual ? '$48' : '$5'}
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {isAnnual ? '/yr' : '/mo'}
              </span>
            </div>
            <p className="mb-6 flex-grow text-sm text-[var(--color-text-secondary)]">
              Advanced analytics and priority support.
            </p>
            <ul className="mb-8 space-y-3">
              <li className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 text-[var(--color-primary)]" />
                <span>20 active habits</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 text-[var(--color-primary)]" />
                <span>Enhanced recovery guidance</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 text-[var(--color-primary)]" />
                <span>Advanced insights</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <CheckCircle2 className="size-5 text-[var(--color-primary)]" />
                <span>Email reminders</span>
              </li>
            </ul>
            <Button asChild fullWidth className="!text-white" variant="primary">
              <Link className="!text-white" href={routes.today}>Start Trial</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Compare Features Section */}
      <div className="mb-8 w-full max-w-4xl">
        <h2 className="mb-4 text-2xl font-bold text-[var(--color-primary)]">Compare Features</h2>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
                    <th className="w-1/4 p-4 text-sm font-semibold text-[var(--color-text-secondary)]">Feature</th>
                    <th className="w-1/4 p-4 text-sm font-semibold text-[var(--color-text-secondary)]">Guest</th>
                    <th className="w-1/4 p-4 text-sm font-bold text-[var(--color-primary)]">Free</th>
                    <th className="w-1/4 p-4 text-sm font-semibold text-[var(--color-text-secondary)]">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-sm text-[var(--color-text-primary)]">
                  <tr className="transition-colors hover:bg-[var(--color-surface-subtle)]">
                    <td className="p-4 font-semibold">Habit Limits</td>
                    <td className="p-4">3 active habits</td>
                    <td className="p-4 font-semibold">5 active habits</td>
                    <td className="p-4">20 active habits</td>
                  </tr>
                  <tr className="transition-colors hover:bg-[var(--color-surface-subtle)]">
                    <td className="p-4 font-semibold">Storage</td>
                    <td className="p-4">Local browser</td>
                    <td className="p-4 font-semibold">Cloud sync</td>
                    <td className="p-4">Cloud sync</td>
                  </tr>
                  <tr className="transition-colors hover:bg-[var(--color-surface-subtle)]">
                    <td className="p-4 font-semibold">Recovery</td>
                    <td className="p-4">Basic</td>
                    <td className="p-4 font-semibold">Basic</td>
                    <td className="p-4 font-medium text-[var(--color-primary)]">Enhanced guidance</td>
                  </tr>
                  <tr className="transition-colors hover:bg-[var(--color-surface-subtle)]">
                    <td className="p-4 font-semibold">Reminders</td>
                    <td className="p-4 text-[var(--color-text-muted)]"><X className="size-4" /></td>
                    <td className="p-4 text-[var(--color-text-muted)]"><X className="size-4" /></td>
                    <td className="p-4 font-medium text-[var(--color-primary)]">
                      <span className="inline-flex items-center gap-1.5"><Check className="size-4" /> Email</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trial Disclosure */}
      <p className="text-center text-xs text-[var(--color-text-secondary)] max-w-lg">
        14-day trial available for all paid plans. Cancel anytime.
      </p>
    </ContentContainer>
  );
}
