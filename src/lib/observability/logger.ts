export type LogLevel = 'info' | 'warn' | 'error';

export type LogEvent = Readonly<{
  level: LogLevel;
  event: string;
  context: Readonly<Record<string, unknown>>;
}>;

export interface Logger {
  info(event: string, context?: Readonly<Record<string, unknown>>): void;
  warn(event: string, context?: Readonly<Record<string, unknown>>): void;
  error(event: string, context?: Readonly<Record<string, unknown>>): void;
}

const sensitiveKeyPattern = /(authorization|cookie|email|habitName|note|password|secret|token)/i;

function redact(context: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      sensitiveKeyPattern.test(key) ? '[REDACTED]' : value,
    ]),
  );
}

export function createConsoleLogger({
  write = (event) => console.warn(JSON.stringify(event)),
}: Readonly<{
  write?: (event: LogEvent) => void;
}> = {}): Logger {
  const emit = (
    level: LogLevel,
    event: string,
    context: Readonly<Record<string, unknown>> = {},
  ) => {
    write({ level, event, context: redact(context) });
  };

  return {
    info: (event, context) => emit('info', event, context),
    warn: (event, context) => emit('warn', event, context),
    error: (event, context) => emit('error', event, context),
  };
}
