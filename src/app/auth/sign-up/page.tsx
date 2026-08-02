'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { routes } from '@/lib/navigation/route-definitions';

export default function SignUpPage(): React.JSX.Element {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[var(--color-page)] p-4 sm:p-8">
      {/* Background decoration circles */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-30">
        <div className="absolute -top-[200px] -right-[200px] h-[800px] w-[800px] rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="absolute -bottom-[100px] -left-[100px] h-[600px] w-[600px] rounded-full bg-emerald-300/15 blur-3xl" />
      </div>

      {/* Centered Glass Container */}
      <div className="relative z-10 w-full max-w-[480px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/85 p-6 shadow-xl backdrop-blur-md sm:p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-emerald-50)] text-[var(--color-primary)] shadow-2xs">
            <Sparkles className="size-6 text-[var(--color-primary)]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Start your journey
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Create an account to save your progress safely.
          </p>
        </div>

        {/* Google SSO Button */}
        <button
          className="group flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-primary)] shadow-2xs transition-colors hover:bg-[var(--color-surface-subtle)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
          type="button"
        >
          <svg className="size-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--color-border)]" />
          <span className="text-xs font-medium tracking-wider text-[var(--color-text-muted)] uppercase">
            or sign up with email
          </span>
          <div className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        {/* Manual Form */}
        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-[var(--color-text-primary)]"
              htmlFor="name"
            >
              First Name
            </label>
            <input
              className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
              id="name"
              name="name"
              placeholder="Alex"
              required
              type="text"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-[var(--color-text-primary)]"
              htmlFor="email"
            >
              Email address
            </label>
            <input
              className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
              id="email"
              name="email"
              placeholder="alex@example.com"
              required
              type="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-[var(--color-text-primary)]"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
              id="password"
              name="password"
              placeholder="••••••••"
              required
              type="password"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-[var(--color-text-primary)]"
              htmlFor="confirm-password"
            >
              Confirm Password
            </label>
            <input
              className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
              id="confirm-password"
              name="confirm-password"
              placeholder="••••••••"
              required
              type="password"
            />
          </div>

          <Button fullWidth size="touch" type="submit" variant="primary" className="mt-2">
            Create Account
          </Button>
        </form>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col items-center gap-2 border-t border-[var(--color-border)] pt-6 text-center text-xs">
          <p className="text-[var(--color-text-secondary)]">
            Already have an account?{' '}
            <Link
              className="font-semibold text-[var(--color-primary)] hover:underline"
              href={routes.signIn}
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
