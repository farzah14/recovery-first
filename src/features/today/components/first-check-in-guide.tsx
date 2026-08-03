'use client';

import { useEffect, useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const guideDismissedKey = 'recovery-first.first-check-in-guide-dismissed';

export function FirstCheckInGuide(): React.JSX.Element | null {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(window.localStorage.getItem(guideDismissedKey) !== 'true');
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return (
    <Alert tone="info" className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="font-semibold">Choose the outcome that fits today</p>
        <p className="mt-1 text-sm leading-6">Full and Minimum both support continuity. Skipped is available when you need to record a deliberate pause.</p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">More help remains available from a session card’s help menu.</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          window.localStorage.setItem(guideDismissedKey, 'true');
          setVisible(false);
        }}
      >
        Dismiss
      </Button>
    </Alert>
  );
}
