export const repositoryErrorCodes = [
  'active_limit_reached',
  'draft_not_found',
  'habit_not_found',
  'session_not_found',
  'session_not_eligible',
  'same_day_edit_closed',
  'stale_revision',
  'idempotency_conflict',
  'repository_unavailable',
] as const;

export type RepositoryErrorCode = (typeof repositoryErrorCodes)[number];

export class ProductRepositoryError extends Error {
  constructor(
    public readonly code: RepositoryErrorCode,
    message = code,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ProductRepositoryError';
  }
}
