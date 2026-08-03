export function CheckInConfirmation({ message }: { message: string }): React.JSX.Element {
  return <p role="status" aria-live="polite" className="rounded-md bg-[var(--color-emerald-50)] px-3 py-2 text-sm font-semibold text-[var(--color-emerald-800)]">{message}</p>;
}
