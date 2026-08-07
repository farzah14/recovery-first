import type { UserRecordableCheckInOutcome } from '@/domain/check-ins/check-in';
import { frictionFormSchema } from '@/features/check-ins/forms/friction-form-schema';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

export async function editCheckIn(input: {
  repository: ProductRepository;
  owner: ProductOwner;
  commandId: string;
  currentCheckInId: string;
  sessionId: string;
  outcome: UserRecordableCheckInOutcome;
  friction: unknown;
  expectedSessionRevision: number;
  expectedCheckInRevision: number;
  now: string;
}) {
  const friction = frictionFormSchema.parse(input.friction);

  return input.repository.editCheckIn({
    commandId: input.commandId,
    owner: input.owner,
    currentCheckInId: input.currentCheckInId,
    sessionId: input.sessionId,
    outcome: input.outcome,
    frictionCode: friction.frictionCode,
    frictionNote: friction.frictionNote,
    expectedSessionRevision: input.expectedSessionRevision,
    expectedCheckInRevision: input.expectedCheckInRevision,
    clientRecordedAt: input.now,
  });
}
