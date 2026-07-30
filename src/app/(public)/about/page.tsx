import { AlertTriangle, CheckCircle2, Heart, Leaf, Sliders } from 'lucide-react';

import { ContentContainer } from '@/components/layout/content-container';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutPage(): React.JSX.Element {
  return (
    <ContentContainer className="py-16">
      {/* Hero Section */}
      <section className="mx-auto mb-16 max-w-3xl text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-[var(--color-primary)] sm:text-5xl">
          About Us
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
          Traditional habit trackers rely on rigid streaks that inevitably break. We believe in compassionate progress—focusing on psychological safety, long-term sustainability, and browser honesty over punitive gamification.
        </p>
      </section>

      {/* Section 1: The Problem with Streaks */}
      <section className="mb-16">
        <h2 className="mb-6 border-b border-[var(--color-border)] pb-3 text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
          The Problem with Streaks
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Traditional Trackers */}
          <Card className="relative overflow-hidden border-l-4 border-l-[var(--color-danger-coral)] p-6 shadow-sm">
            <CardContent className="p-0">
              <div className="mb-4 flex items-center gap-3">
                <AlertTriangle aria-hidden="true" className="size-6 text-[var(--color-danger-coral)]" />
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Traditional Trackers</h3>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Rely on gamified &apos;streaks&apos; that treat a missed day as a complete reset. This punitive approach creates immense pressure, leading to the &quot;what the hell&quot; effect where a single slip-up causes complete abandonment of the habit.
              </p>
            </CardContent>
          </Card>

          {/* Recovery-First */}
          <Card className="relative overflow-hidden border-l-4 border-l-[var(--color-primary)] p-6 shadow-sm">
            <CardContent className="p-0">
              <div className="mb-4 flex items-center gap-3">
                <Leaf aria-hidden="true" className="size-6 text-[var(--color-primary)]" />
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Recovery-First</h3>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Focuses on the long-term trend. A missed day is just a data point, not a failure. We celebrate &apos;minimum viable effort&apos; and prioritize the speed of recovery over the length of an unbroken chain.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 2: Our Core Principles */}
      <section className="mb-16">
        <h2 className="mb-6 border-b border-[var(--color-border)] pb-3 text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
          Our Core Principles
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Principle 1 */}
          <Card className="p-6 transition-shadow hover:shadow-md">
            <CardContent className="p-0">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-primary)]">
                <Heart aria-hidden="true" className="size-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">Recovery over Punishment</h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                We don&apos;t do red X&apos;s or broken streaks. Falling off the wagon is part of life; how quickly you get back on is what matters.
              </p>
            </CardContent>
          </Card>

          {/* Principle 2 */}
          <Card className="p-6 transition-shadow hover:shadow-md">
            <CardContent className="p-0">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-primary)]">
                <Sliders aria-hidden="true" className="size-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">User Control</h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                You set the parameters. You decide what constitutes a &apos;win&apos; for the day, allowing for flexibility when life gets chaotic.
              </p>
            </CardContent>
          </Card>

          {/* Principle 3 */}
          <Card className="p-6 transition-shadow hover:shadow-md">
            <CardContent className="p-0">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-primary)]">
                <CheckCircle2 aria-hidden="true" className="size-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">Smallest Useful Change</h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                We encourage defining a &apos;Minimum&apos; effort level. Doing 1 pushup on a bad day is infinitely better than doing 0.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 3: Our Story */}
      <section className="mb-12">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-6 md:p-8">
          <h2 className="mb-6 text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">Our Story</h2>
          <div className="space-y-4 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
            <p>
              The idea for Recovery-First was born out of frustration with existing habit-tracking tools. Our founders, a team of behavioral psychologists and software engineers, noticed a recurring pattern: users would start strong, maintain a streak for weeks, miss a single day due to unforeseen circumstances, and then completely abandon the app.
            </p>
            <p>
              These apps were inadvertently punishing users for being human. They were optimized for daily engagement metrics rather than long-term habit formation. We wanted to build something different—a tool that acts as a supportive partner rather than a strict taskmaster.
            </p>
            <p>
              We started with a blank slate, a greenfield project focused entirely on sustainability. We stripped away the confetti, the fire emojis, and the pressure-inducing mechanics. In their place, we built a system that recognizes nuance, values minimal effort on hard days, and celebrates the act of returning to a habit after a break. Our mission is to help you build habits that last a lifetime, not just until your next vacation.
            </p>
          </div>
        </div>
      </section>
    </ContentContainer>
  );
}
