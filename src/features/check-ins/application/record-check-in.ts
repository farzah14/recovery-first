import type { UserRecordableCheckInOutcome } from '@/domain/check-ins/check-in';
import { createRecordCheckInCommand } from '@/features/check-ins/check-in-command';
import { frictionFormSchema } from '@/features/check-ins/forms/friction-form-schema';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

export async function recordCheckIn(input: {
  repository: ProductRepository;
  owner: ProductOwner;
  commandId: string;
  sessionId: string;
  outcome: UserRecordableCheckInOutcome;
  friction: unknown;
  expectedSessionRevision: number;
  now: string;
}) {
  const friction = frictionFormSchema.parse(input.friction);
  const result = await input.repository.recordCheckIn(
    createRecordCheckInCommand({ ...input, ...friction }),
  );
  return {
    result,
    confirmation:
      result.outcome === 'minimum'
        ? 'Minimum completed — you kept the habit alive today.'
        : result.outcome === 'full'
          ? 'Full completed.'
          : 'Skipped recorded — your history remains intact.',
  };
}
