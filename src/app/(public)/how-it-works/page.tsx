import { CheckCircle2, Flame, LifeBuoy, PencilRuler, Search, Sliders } from 'lucide-react';

import { ContentContainer } from '@/components/layout/content-container';
import { Card, CardContent } from '@/components/ui/card';

export default function HowItWorksPage(): React.JSX.Element {
  return (
    <ContentContainer className="flex flex-col items-center py-16">
      {/* Hero Section */}
      <section className="mb-20 max-w-3xl text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-[var(--color-primary)] sm:text-5xl">
          How the 6-Step Loop Works.
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
          Our 6-step loop is designed to adapt to your fluctuating energy levels, ensuring that even
          on your hardest days, you can maintain momentum without the guilt.
        </p>
      </section>

      {/* The 6-Step Loop Bento Grid */}
      <section className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Step 1 */}
        <Card className="flex flex-col p-6 transition-colors hover:border-[var(--color-primary)]">
          <CardContent className="flex h-full flex-col p-0">
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[var(--color-surface-subtle)] text-[var(--color-primary)]">
              <PencilRuler aria-hidden="true" className="size-6" />
            </div>
            <div className="mb-2 text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">
              Step 1
            </div>
            <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">Design</h3>
            <p className="flex-grow text-sm leading-6 text-[var(--color-text-secondary)]">
              Set realistic targets. Define both your &quot;Normal&quot; goal for good days and a
              &quot;Minimum&quot; viable effort for when energy is low.
            </p>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card className="flex flex-col p-6 transition-colors hover:border-[var(--color-primary)]">
          <CardContent className="flex h-full flex-col p-0">
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[var(--color-surface-subtle)] text-[var(--color-primary)]">
              <Flame aria-hidden="true" className="size-6" />
            </div>
            <div className="mb-2 text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">
              Step 2
            </div>
            <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">Do</h3>
            <p className="flex-grow text-sm leading-6 text-[var(--color-text-secondary)]">
              Execute your habit based on today&apos;s reality. Listen to your body and mind to
              decide which level of effort is sustainable today.
            </p>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card className="flex flex-col p-6 transition-colors hover:border-[var(--color-primary)]">
          <CardContent className="flex h-full flex-col p-0">
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[var(--color-surface-subtle)] text-[var(--color-primary)]">
              <CheckCircle2 aria-hidden="true" className="size-6" />
            </div>
            <div className="mb-2 text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">
              Step 3
            </div>
            <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">Check-In</h3>
            <p className="flex-grow text-sm leading-6 text-[var(--color-text-secondary)]">
              One-tap logging. Easily record whether you hit your Full target or your Minimum
              target. Both count as a success.
            </p>
          </CardContent>
        </Card>

        {/* Step 4 */}
        <Card className="flex flex-col p-6 transition-colors hover:border-[var(--color-primary)]">
          <CardContent className="flex h-full flex-col p-0">
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[var(--color-surface-subtle)] text-[var(--color-primary)]">
              <Search aria-hidden="true" className="size-6" />
            </div>
            <div className="mb-2 text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">
              Step 4
            </div>
            <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">
              Identify Friction
            </h3>
            <p className="flex-grow text-sm leading-6 text-[var(--color-text-secondary)]">
              Missed a day? That&apos;s data, not failure. Briefly note what got in the way in a
              completely judgment-free environment.
            </p>
          </CardContent>
        </Card>

        {/* Step 5 */}
        <Card className="flex flex-col p-6 transition-colors hover:border-[var(--color-primary)]">
          <CardContent className="flex h-full flex-col p-0">
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[var(--color-surface-subtle)] text-[var(--color-primary)]">
              <Sliders aria-hidden="true" className="size-6" />
            </div>
            <div className="mb-2 text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">
              Step 5
            </div>
            <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">Adapt</h3>
            <p className="flex-grow text-sm leading-6 text-[var(--color-text-secondary)]">
              Receive smart, explained suggestions to adjust your targets based on your friction
              points. You are always in control of the changes.
            </p>
          </CardContent>
        </Card>

        {/* Step 6 */}
        <Card className="flex flex-col p-6 transition-colors hover:border-[var(--color-primary)]">
          <CardContent className="flex h-full flex-col p-0">
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[var(--color-surface-subtle)] text-[var(--color-primary)]">
              <LifeBuoy aria-hidden="true" className="size-6" />
            </div>
            <div className="mb-2 text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">
              Step 6
            </div>
            <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">Recover</h3>
            <p className="flex-grow text-sm leading-6 text-[var(--color-text-secondary)]">
              A gentle bridge back to your routine after a major disruption. We help you restart
              smoothly without the pressure of &apos;catching up&apos;.
            </p>
          </CardContent>
        </Card>
      </section>
    </ContentContainer>
  );
}
