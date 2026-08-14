import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/navigation/route-definitions';

export function FinalCtaSection(): React.JSX.Element {
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[linear-gradient(135deg,#187040_0%,#106038_50%,#0d522f_100%)] py-20 text-white lg:py-24">
      {/* Decorative ambient background circles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-white/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-emerald-300/10 blur-3xl"
      />

      <ContentContainer className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-100 backdrop-blur-xs">
          <Zap className="size-3.5" aria-hidden="true" />
          <span>Zero Risk • No Credit Card Needed</span>
        </div>

        <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Build habits that actually survive your hardest days.
        </h2>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-emerald-100 sm:text-lg">
          Join thousands who have left punitive streak anxiety behind. Start with your first habit
          in 60 seconds.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="large"
            className="border border-white/20 bg-white font-bold text-[var(--color-primary)] shadow-lg hover:bg-emerald-50 active:scale-95"
          >
            <Link href={routes.today} className="inline-flex items-center gap-2">
              Start Tracking Now (Free) <ArrowRight className="size-4" />
            </Link>
          </Button>

          <Button
            asChild
            size="large"
            variant="secondary"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Link href={routes.howItWorks}>See How Recovery Works</Link>
          </Button>
        </div>

        {/* Micro Trust Signals in CTA */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-emerald-200">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-300" />
            <span>Instant guest access</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-300" />
            <span>100% Private local storage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-300" />
            <span>No streak shaming</span>
          </div>
        </div>
      </ContentContainer>
    </section>
  );
}
