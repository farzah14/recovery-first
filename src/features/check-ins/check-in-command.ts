import type { FrictionReason, UserRecordableCheckInOutcome } from '@/domain/check-ins/check-in';
import type {
  ProductOwner,
  RecordCheckInRepositoryCommand,
} from '@/lib/repositories/product-repository';

export function createRecordCheckInCommand(input: {
  commandId: string;
  owner: ProductOwner;
  sessionId: string;
  outcome: UserRecordableCheckInOutcome;
  frictionCode?: FrictionReason | null;
  frictionNote?: string | null;
  expectedSessionRevision: number;
  now: string;
}): RecordCheckInRepositoryCommand {
  return {
    commandId: input.commandId,
    owner: input.owner,
    sessionId: input.sessionId,
    outcome: input.outcome,
    frictionCode: input.frictionCode ?? null,
    frictionNote: input.frictionNote ?? null,
    expectedSessionRevision: input.expectedSessionRevision,
    clientRecordedAt: input.now,
  };
}
