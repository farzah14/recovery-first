import { Button } from '@/components/ui/button';

export function CheckInActionGroup({
  onFull,
  onMinimum,
  onSkipped,
  disabled = false,
}: {
  onFull: () => void;
  onMinimum: () => void;
  onSkipped: () => void;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Check-in actions">
      <Button type="button" onClick={onFull} disabled={disabled}>
        Full
      </Button>
      <Button type="button" variant="secondary" onClick={onMinimum} disabled={disabled}>
        Minimum
      </Button>
      <Button type="button" variant="ghost" onClick={onSkipped} disabled={disabled}>
        Skipped
      </Button>
    </div>
  );
}
