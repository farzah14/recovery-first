export const recoveryFirstStoresV1 = {
  localProfiles: 'id, identityMode, planTier',
  browserInstallations: 'id, userId, lastSeenAt',
  habits: 'id, [ownerType+ownerId], lifecycleState, updatedAt, deletedAt',
  habitVersions: 'id, habitId, [ownerType+ownerId], [habitId+versionNumber]',
  sessions: 'id, [ownerType+ownerId], habitId, habitVersionId, scheduledLocalDate, status',
  checkIns: 'id, sessionId, [ownerType+ownerId], outcome, recordedLocalAt',
  recommendations: 'id, habitId, [ownerType+ownerId], status, createdAt',
  recoveryPlans: 'id, habitId, [ownerType+ownerId], status, createdAt',
  reviewItems: 'id, [ownerType+ownerId], habitId, status, priority',
  reminderConfigs: 'id, habitId, [ownerType+ownerId], enabled',
  drafts: 'id, [ownerType+ownerId], draftType, updatedAt',
  pendingOperations:
    'id, [ownerType+ownerId], [entityType+entityId], status, nextAttemptAt, createdAt',
  settings: 'key, updatedAt',
} as const;

export const recoveryFirstStoresV2 = {
  ...recoveryFirstStoresV1,
  syncMetadata: 'key, [ownerType+ownerId], lastSuccessfulAt, leaseExpiresAt',
  queryCache: 'key, [ownerType+ownerId], expiresAt, updatedAt',
} as const;

export const recoveryFirstStoresV3 = {
  ...recoveryFirstStoresV2,
  commandResults: 'id, [ownerType+ownerId], operationType, expiresAt',
  legacyLocalData: 'id, [sourceOwnerType+sourceOwnerId], status, updatedAt',
} as const;

export const currentIndexedDbVersion = 3;
