export function ProgressRing({
  value,
  label,
  size = 72,
}: Readonly<{ value: number; label: string; size?: number }>): React.JSX.Element {
  const boundedValue = Math.min(100, Math.max(0, value));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (boundedValue / 100) * circumference;

  return (
    <div className="relative inline-grid place-items-center" style={{ height: size, width: size }}>
      <svg aria-hidden="true" className="-rotate-90" height={size} viewBox="0 0 64 64" width={size}>
        <circle
          cx="32"
          cy="32"
          fill="none"
          r={radius}
          stroke="var(--color-neutral-150)"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          fill="none"
          r={radius}
          stroke="var(--color-primary)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="6"
        />
      </svg>
      <span aria-label={`${label}: ${boundedValue}%`} className="absolute text-sm font-semibold">
        {boundedValue}%
      </span>
    </div>
  );
}
