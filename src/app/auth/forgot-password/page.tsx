'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { routes } from '@/lib/navigation/route-definitions';

export default function ForgotPasswordPage(): React.JSX.Element {
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function requestReset(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');
    if (typeof email !== 'string' || email.trim() === '') {
      setMessage('Enter your email address to continue.');
      return;
    }

    setPending(true);
    const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser');
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    setMessage(
      error
        ? 'We could not send a reset link right now. Please try again.'
        : 'Check your email for a password reset link.',
    );
    if (!error) {
      setSent(true);
    }
    setPending(false);
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[var(--color-page)] p-4 sm:p-8">
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-30">
        <div className="absolute -top-[200px] -right-[200px] h-[800px] w-[800px] rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="absolute -bottom-[100px] -left-[100px] h-[600px] w-[600px] rounded-full bg-emerald-300/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/85 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-emerald-50)] text-[var(--color-primary)]">
            <KeyRound className="size-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Reset your password
          </h1>
          <p className="mt-2 text-base text-[var(--color-text-secondary)]">
            We&apos;ll email you a secure reset link.
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-6 text-center">
            <MailCheck className="size-8 text-[var(--color-primary)]" />
            <p aria-live="polite" className="text-sm text-[var(--color-text-secondary)]">
              {message}
            </p>
            <Button asChild size="compact" variant="secondary">
              <Link href={routes.signIn}>Back to Sign In</Link>
            </Button>
          </div>
        ) : (
          <>
            <form className="space-y-4" onSubmit={requestReset}>
              <div>
                <label className="sr-only" htmlFor="email">
                  Email address
                </label>
                <Input id="email" name="email" placeholder="alex@example.com" type="email" />
              </div>
              <Button disabled={pending} fullWidth size="touch" type="submit" variant="primary">
                Send reset link
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

            <div className="mt-8 border-t border-[var(--color-border)] pt-6 text-center">
              <p className="text-xs text-[var(--color-text-secondary)]">
                Remembered your password?{' '}
                <Link
                  className="font-semibold text-[var(--color-primary)] hover:underline"
                  href={routes.signIn}
                >
                  Sign In
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
