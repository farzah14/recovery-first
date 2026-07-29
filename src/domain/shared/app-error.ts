export type AppErrorCode =
  | 'validation_failed'
  | 'not_found'
  | 'conflict'
  | 'unauthenticated'
  | 'forbidden'
  | 'rate_limited'
  | 'dependency_unavailable'
  | 'unexpected';

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly details: Readonly<Record<string, unknown>> = {},
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'AppError';
  }
}
