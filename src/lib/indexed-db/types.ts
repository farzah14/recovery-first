import type { CheckInOutcome, FrictionReason } from '@/domain/check-ins/check-in';
import type { HabitLifecycleState } from '@/domain/habits/habit-lifecycle';
import type { RecurrenceRule } from '@/domain/habits/recurrence';
import type { RecoveryPlanStatus } from '@/domain/recovery/recovery';
import type { RecommendationStatus } from '@/domain/recovery/recommendation';
import type { IdentityMode } from '@/domain/shared/identity-mode';
import type { PlanTier } from '@/domain/shared/plan-tier';
import type { SynchronizationState } from '@/domain/shared/sync-state';

export type LocalOwnerType = 'guest' | 'account';

export type LocalProfileRecord = {
  id: string;
  identityMode: IdentityMode;
  planTier: PlanTier;
  locale: string;
  timezone: string;
  weekStart: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  createdAt: string;
  updatedAt: string;
};

export type BrowserInstallationRecord = {
  id: string;
  userId: string | null;
  displayName: string;
  pushCapability: 'supported' | 'unsupported' | 'denied' | 'granted' | 'expired';
  lastSeenAt: string;
  revokedAt: string | null;
  createdAt: string;
};

export type LocalHabitRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  title: string;
  lifecycleState: HabitLifecycleState;
  currentVersionId: string | null;
  revision: number;
  synchronizationState: SynchronizationState;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type LocalHabitVersionRecord = {
  id: string;
  habitId: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  versionNumber: number;
  normalTarget: Record<string, unknown>;
  minimumTarget: Record<string, unknown>;
  scheduleRule: RecurrenceRule;
  cue: Record<string, unknown> | null;
  recoveryStructure: Record<string, unknown>;
  source: 'creation' | 'redesign' | 'recommendation' | 'restore';
  parentVersionId: string | null;
  createdAt: string;
};

export type LocalSessionRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  habitId: string;
  habitVersionId: string;
  scheduledLocalDate: string;
  scheduledLocalTime: string | null;
  timezoneSnapshot: string;
  eligibleAt: string;
  resolutionDueAt: string;
  status: CheckInOutcome;
  revision: number;
  synchronizationState: SynchronizationState;
};

export type LocalCheckInRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  sessionId: string;
  outcome: Exclude<CheckInOutcome, 'automatic_skipped' | 'unrecorded'>;
  frictionCode: FrictionReason | null;
  frictionNote: string | null;
  recordedLocalAt: string;
  timezoneSnapshot: string;
  revision: number;
  synchronizationState: SynchronizationState;
};

export type LocalRecommendationRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  habitId: string;
  habitVersionId: string;
  status: RecommendationStatus;
  signalCode: string;
  evidence: Record<string, unknown>;
  proposedChange: Record<string, unknown>;
  createdAt: string;
};

export type LocalRecoveryPlanRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  habitId: string;
  habitVersionId: string;
  status: RecoveryPlanStatus;
  targetDefinition: Record<string, unknown>;
  durationSessions: number;
  successThreshold: number;
  createdAt: string;
};

export type LocalReviewItemRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  habitId: string | null;
  itemType: string;
  status: 'pending' | 'resolved' | 'dismissed';
  priority: number;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type LocalReminderConfigRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  habitId: string;
  channel: 'web_push' | 'email';
  localTime: string;
  timezone: string;
  enabled: boolean;
  revision: number;
};

export type DraftRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  draftType: 'habit_wizard' | 'habit_edit' | 'recommendation_customize';
  payload: Record<string, unknown>;
  updatedAt: string;
};

export type PendingOperationRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  operationType: string;
  entityType: string;
  entityId: string;
  idempotencyKey: string;
  expectedRevision?: number;
  payload: unknown;
  createdAt: string;
  attemptCount: number;
  nextAttemptAt: string;
  status: 'pending' | 'processing' | 'blocked' | 'failed';
  lastErrorCode?: string;
};

export type SyncMetadataRecord = {
  key: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  cursor: string | null;
  lastSuccessfulAt: string | null;
  leaseOwner: string | null;
  leaseExpiresAt: string | null;
};

export type QueryCacheRecord = {
  key: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  payload: unknown;
  expiresAt: string;
  updatedAt: string;
};

export type SettingRecord = {
  key: string;
  value: unknown;
  updatedAt: string;
};
