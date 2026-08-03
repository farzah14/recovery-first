'use client';

import type { PaidProductCode } from '@/features/subscriptions/checkout-service';

type PlanSelectorProps = Readonly<{
  value: PaidProductCode | null;
  onChange: (value: PaidProductCode) => void;
}>;

const plans: ReadonlyArray<Readonly<{ code: PaidProductCode; label: string; detail: string }>> = [
  { code: 'lite_monthly', label: 'Lite monthly', detail: '$5/month · 10 active habits' },
  { code: 'lite_annual', label: 'Lite annual', detail: '$48/year · 10 active habits' },
  { code: 'premium_monthly', label: 'Premium monthly', detail: '$10/month · 30 active habits' },
  { code: 'premium_annual', label: 'Premium annual', detail: '$96/year · 30 active habits' },
];

export function PlanSelector({ value, onChange }: PlanSelectorProps): React.JSX.Element {
  return (
    <div aria-label="Choose a plan" className="grid gap-3 sm:grid-cols-2" role="radiogroup">
      {plans.map((plan) => (
        <label
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition-colors hover:border-[var(--color-primary)] has-checked:border-[var(--color-primary)] has-checked:bg-[var(--color-emerald-50)]/40"
          key={plan.code}
        >
          <input
            checked={value === plan.code}
            className="mt-1 size-4 accent-[var(--color-primary)]"
            name="billing-plan"
            onChange={() => onChange(plan.code)}
            type="radio"
            value={plan.code}
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
              {plan.label}
            </span>
            <span className="mt-1 block text-xs text-[var(--color-text-secondary)]">
              {plan.detail}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}
