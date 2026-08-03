import type {
  FrictionReason,
  UserRecordableCheckInOutcome,
} from '@/domain/check-ins/check-in';
import type { HabitLifecycleState } from '@/domain/habits/habit-lifecycle';
import type { RecurrenceRule } from '@/domain/habits/recurrence';
import type { IdentityMode } from '@/domain/shared/identity-mode';
import type { PlanTier } from '@/domain/shared/plan-tier';

export type ProductOwner = {
  ownerId: string;
  identityMode: IdentityMode;
  planTier: PlanTier;
  timezone: string;
};

export type HabitTarget = {
  action: string;
  quantity: number | null;
  unit: string | null;
  estimatedMinutes: number | null;
};

export type HabitCue = {
  type: 'time' | 'after_activity' | 'location' | 'none';
  value: string | null;
};

export type CreateHabitCommand = {
  commandId: string;
  habitId: string;
  habitVersionId: string;
  owner: ProductOwner;
  title: string;
  category: string;
  normalTarget: HabitTarget;
  minimumTarget: HabitTarget;
  recurrence: RecurrenceRule;
  cue: HabitCue;
  reminderIntent: {
    enabled: boolean;
    localTime: string | null;
  };
  startLocalDate: string;
  activate: boolean;
  clientCreatedAt: string;
};

export type CreateHabitResult = {
  habitId: string;
  habitVersionId: string;
  lifecycleState: HabitLifecycleState;
  activeCount: number;
  firstEligibleSessionId: string | null;
};

export type SessionSummary = {
  id: string;
  habitId: string;
  habitVersionId: string;
  title: string;
  normalTarget: HabitTarget;
  minimumTarget: HabitTarget;
  cue: HabitCue;
  scheduledLocalDate: string;
  scheduledLocalTime: string | null;
  timezoneSnapshot: string;
  status:
    | 'unrecorded'
    | 'full'
    | 'minimum'
    | 'manual_skipped'
    | 'automatic_skipped'
    | 'excused';
  revision: number;
  synchronizationState: 'local_only' | 'pending' | 'synced' | 'failed' | 'conflict';
};

export type TodayRepositoryRead = {
  localDate: string;
  sessions: SessionSummary[];
  activeHabitCount: number;
  activeHabitLimit: number;
};

export type RecordCheckInRepositoryCommand = {
  commandId: string;
  owner: ProductOwner;
  sessionId: string;
  outcome: UserRecordableCheckInOutcome;
  frictionCode: FrictionReason | null;
  frictionNote: string | null;
  expectedSessionRevision: number;
  clientRecordedAt: string;
};

export type RecordCheckInResult = {
  checkInId: string;
  sessionId: string;
  outcome: UserRecordableCheckInOutcome;
  sessionRevision: number;
  synchronizationState: SessionSummary['synchronizationState'];
};

export type EditCheckInRepositoryCommand = RecordCheckInRepositoryCommand & {
  currentCheckInId: string;
  expectedCheckInRevision: number;
};

export type HabitListItem = {
  id: string;
  title: string;
  lifecycleState: HabitLifecycleState;
  currentVersionId: string | null;
  updatedAt: string;
};

export type HabitDetailRead = {
  habit: HabitListItem;
  currentVersion: {
    id: string;
    versionNumber: number;
    normalTarget: HabitTarget;
    minimumTarget: HabitTarget;
    recurrence: RecurrenceRule;
    cue: HabitCue;
    createdAt: string;
  };
  versions: Array<{
    id: string;
    versionNumber: number;
    createdAt: string;
    source: 'creation' | 'redesign' | 'recommendation' | 'restore';
  }>;
  sessions: SessionSummary[];
};

export interface ProductRepository {
  createHabit(command: CreateHabitCommand): Promise<CreateHabitResult>;
  saveHabitDraft(
    owner: ProductOwner,
    draftId: string,
    payload: unknown,
    updatedAt: string,
  ): Promise<void>;
  getHabitDraft(owner: ProductOwner, draftId: string): Promise<unknown | null>;
  deleteHabitDraft(owner: ProductOwner, draftId: string): Promise<void>;
  listHabits(owner: ProductOwner): Promise<HabitListItem[]>;
  getHabitDetail(owner: ProductOwner, habitId: string): Promise<HabitDetailRead | null>;
  ensureSessionHorizon(owner: ProductOwner, throughLocalDate: string): Promise<number>;
  resolveExpiredUnrecorded(owner: ProductOwner, now: string): Promise<number>;
  getToday(owner: ProductOwner, localDate: string): Promise<TodayRepositoryRead>;
  recordCheckIn(
    command: RecordCheckInRepositoryCommand,
  ): Promise<RecordCheckInResult>;
  editCheckIn(command: EditCheckInRepositoryCommand): Promise<RecordCheckInResult>;
}
