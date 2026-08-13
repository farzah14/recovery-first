'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { routes } from '@/lib/navigation/route-definitions';

export default function UpdatePasswordPage(): React.JSX.Element {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function updatePassword(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = form.get('password');
    const confirmPassword = form.get('confirm-password');
    if (
      typeof password !== 'string' ||
      typeof confirmPassword !== 'string' ||
      password.length < 8
    ) {
      setMessage('Your new password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('The passwords do not match. Try again.');
      return;
    }

    setPending(true);
    const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser');
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage('We could not update your password right now. Please try again.');
      setPending(false);
      return;
    }
    router.push(routes.today);
    router.refresh();
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
            Choose a new password
          </h1>
          <p className="mt-2 text-base text-[var(--color-text-secondary)]">
            Use at least 8 characters.
          </p>
        </div>

        <form className="space-y-4" onSubmit={updatePassword}>
          <div>
            <label className="sr-only" htmlFor="password">
              New password
            </label>
            <Input id="password" name="password" placeholder="New password" type="password" />
          </div>
          <div>
            <label className="sr-only" htmlFor="confirm-password">
              Confirm new password
            </label>
            <Input
              id="confirm-password"
              name="confirm-password"
              placeholder="Confirm new password"
              type="password"
            />
          </div>
          <Button disabled={pending} fullWidth size="touch" type="submit" variant="primary">
            Update password
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
            Changed your mind?{' '}
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
