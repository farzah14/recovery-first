'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Cloud, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { routes } from '@/lib/navigation/route-definitions';

export default function SignInPage(): React.JSX.Element {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function continueWithGoogle(): Promise<void> {
    setPending(true);
    const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser');
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(routes.app)}`,
      },
    });
    if (error) {
      setMessage('Sign-in is unavailable right now. Please try again.');
      setPending(false);
    }
  }

  async function continueWithEmail(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');
    if (typeof email !== 'string' || email.trim() === '') {
      setMessage('Enter your email address to continue.');
      return;
    }

    setPending(true);
    const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser');
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(routes.app)}`,
      },
    });
    setMessage(
      error
        ? 'Sign-in is unavailable right now. Please try again.'
        : 'Check your email for a sign-in link.',
    );
    setPending(false);
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[var(--color-page)] p-4 sm:p-8">
      {/* Abstract supportive background elements */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-30">
        <div className="absolute -top-[200px] -right-[200px] h-[800px] w-[800px] rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="absolute -bottom-[100px] -left-[100px] h-[600px] w-[600px] rounded-full bg-emerald-300/15 blur-3xl" />
      </div>

      {/* Centered Glass Card */}
      <div className="relative z-10 w-full max-w-[440px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/85 p-6 shadow-xl backdrop-blur-md sm:p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Welcome back
          </h1>
          <p className="mt-2 text-base text-[var(--color-text-secondary)]">One day at a time.</p>
        </div>

        {/* Social Login Button */}
        <button
          className="group flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-primary)] shadow-2xs transition-colors hover:bg-[var(--color-surface-subtle)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
          type="button"
          onClick={continueWithGoogle}
          disabled={pending}
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
        <div className="my-6 flex items-center gap-4">
          <div className="flex-grow border-t border-[var(--color-border)]" />
          <span className="text-xs tracking-wider text-[var(--color-text-muted)] uppercase">
            or
          </span>
          <div className="flex-grow border-t border-[var(--color-border)]" />
        </div>

        {/* Email Form */}
        <form className="space-y-4" onSubmit={continueWithEmail}>
          <div>
            <label className="sr-only" htmlFor="email">
              Email address
            </label>
            <input
              className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
              id="email"
              name="email"
              placeholder="Sign in with Email"
              type="email"
            />
          </div>
          <Button disabled={pending} fullWidth size="touch" type="submit" variant="primary">
            Continue with Email
          </Button>
        </form>

        {message ? (
          <p
            aria-live="polite"
            className="mt-4 text-center text-sm text-[var(--color-text-secondary)]"
          >
            {message}
          </p>
        ) : null}

        {/* Supporting Text / Cloud Sync Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-surface-subtle)] px-3.5 py-2 text-xs text-[var(--color-text-secondary)]">
            <Cloud className="size-4 shrink-0 text-[var(--color-primary)]" />
            <span>Save your progress to the cloud and sync across devices.</span>
          </div>
        </div>

        {/* Secondary Action */}
        <div className="mt-8 border-t border-[var(--color-border)] pt-6 text-center">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Don&apos;t have an account?{' '}
            <Link
              className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] hover:underline"
              href={routes.signUp}
            >
              <span>Sign Up</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
