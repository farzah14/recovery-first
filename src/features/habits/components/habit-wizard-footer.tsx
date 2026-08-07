import { Button } from '@/components/ui/button';

export function HabitWizardFooter({
  step,
  isSubmitting,
  onBack,
  onNext,
}: {
  step: number;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
}): React.JSX.Element {
  return (
    <nav
      aria-label="Wizard actions"
      className="sticky bottom-0 z-10 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_94%,transparent)] px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
    >
      <Button type="button" variant="ghost" onClick={onBack} disabled={step === 1}>
        Previous step
      </Button>
      {step < 5 ? (
        <Button type="button" onClick={onNext}>
          Next step
        </Button>
      ) : (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create Habit'}
        </Button>
      )}
    </nav>
  );
}
