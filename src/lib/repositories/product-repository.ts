import type { FrictionReason, UserRecordableCheckInOutcome } from '@/domain/check-ins/check-in';
import type { HabitLifecycleState } from '@/domain/habits/habit-lifecycle';
import type { RecurrenceRule } from '@/domain/habits/recurrence';
import type { IdentityMode } from '@/domain/shared/identity-mode';
import type { PlanTier } from '@/domain/shared/plan-tier';
import type { WeekStartDay } from '@/lib/dates/local-week';

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
  label?: string;
};

export type HabitCue = {
  type: 'time' | 'after_activity' | 'location' | 'none';
  value: string | null;
};

export type HabitPresentation = {
  description: string;
  icon: string;
  fromTime: string;
  untilTime: string;
  timingContext: string;
  startLocalDate: string;
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
  presentation: HabitPresentation;
  reminderIntent: { enabled: boolean; localTime: string | null };
  startLocalDate: string;
  activate: boolean;
  clientCreatedAt: string;
};

export type UpdateHabitVersionCommand = {
  commandId: string;
  habitId: string;
  habitVersionId: string;
  owner: ProductOwner;
  title: string;
  category: string;
  expectedRevision: number;
  normalTarget: HabitTarget;
  minimumTarget: HabitTarget;
  recurrence: RecurrenceRule;
  cue: HabitCue;
  presentation: HabitPresentation;
  source: 'redesign' | 'recommendation' | 'restore';
};

export type SetHabitLifecycleCommand = {
  commandId: string;
  owner: ProductOwner;
  habitId: string;
  expectedRevision: number;
  nextState: HabitLifecycleState;
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
  category: string;
  icon: string;
  timingContext: string;
  habitRevision: number;
  currentVersionId: string | null;
  normalTarget: HabitTarget;
  minimumTarget: HabitTarget;
  cue: HabitCue;
  scheduledLocalDate: string;
  scheduledLocalTime: string | null;
  timezoneSnapshot: string;
  status: 'unrecorded' | 'full' | 'minimum' | 'manual_skipped' | 'automatic_skipped' | 'excused';
  revision: number;
  synchronizationState: 'local_only' | 'pending' | 'synced' | 'failed' | 'conflict';
};

export type TodayRepositoryRead = {
  localDate: string;
  sessions: SessionSummary[];
  activeHabitCount: number;
  activeHabitLimit: number;
};

export type WeeklyOverviewDay = {
  localDate: string;
  completedCount: number;
  totalCount: number;
};

export type WeeklyOverviewRead = {
  todayDate: string;
  startDate: string;
  endDate: string;
  days: WeeklyOverviewDay[];
};

export type ReflectionNoteRead = {
  localDate: string;
  note: string;
  timezone: string;
  updatedAt: string;
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
  category: string | null;
  description: string;
  normalTarget: HabitTarget;
  minimumTarget: HabitTarget;
  schedule: string;
  cue: string;
  status: 'Active' | 'Paused' | 'Archived';
  iconName: string;
  fromTime: string | null;
  untilTime: string | null;
  startLocalDate: string;
  createdDate: string;
  version: string;
  streak: number;
  consistency: number;
  lifecycleState: HabitLifecycleState;
  currentVersionId: string | null;
  revision: number;
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
    metadata: Record<string, unknown>;
    createdAt: string;
    revision: number;
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
  updateHabitVersion(command: UpdateHabitVersionCommand): Promise<void>;
  setHabitLifecycle(command: SetHabitLifecycleCommand): Promise<void>;
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
  getWeeklyOverview(
    owner: ProductOwner,
    localDate: string,
    weekStart?: WeekStartDay,
  ): Promise<WeeklyOverviewRead>;
  getReflectionNote(owner: ProductOwner, localDate: string): Promise<ReflectionNoteRead | null>;
  saveReflectionNote(owner: ProductOwner, localDate: string, note: string): Promise<void>;
  recordCheckIn(command: RecordCheckInRepositoryCommand): Promise<RecordCheckInResult>;
  editCheckIn(command: EditCheckInRepositoryCommand): Promise<RecordCheckInResult>;
}
