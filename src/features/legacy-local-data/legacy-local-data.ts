import type { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import type { LegacyLocalDataRecord, LegacyLocalDataStatus } from '@/lib/indexed-db/types';

const ownerScopedTables = [
  'habits',
  'habitVersions',
  'sessions',
  'checkIns',
  'recommendations',
  'recoveryPlans',
  'reviewItems',
  'reminderConfigs',
  'drafts',
  'pendingOperations',
  'syncMetadata',
  'queryCache',
] as const;

type AcknowledgedStatus = Extract<LegacyLocalDataStatus, 'exported' | 'transferred'>;

export class LegacyLocalDataService {
  constructor(private readonly database: RecoveryFirstDatabase) {}

  markExported(markerId: string): Promise<LegacyLocalDataRecord> {
    return this.acknowledge(markerId, 'exported');
  }

  markTransferred(markerId: string): Promise<LegacyLocalDataRecord> {
    return this.acknowledge(markerId, 'transferred');
  }

  async clearAfterAcknowledgement(markerId: string): Promise<void> {
    await this.database.transaction(
      'rw',
      [
        this.database.legacyLocalData,
        this.database.localProfiles,
        this.database.habits,
        this.database.habitVersions,
        this.database.sessions,
        this.database.checkIns,
        this.database.recommendations,
        this.database.recoveryPlans,
        this.database.reviewItems,
        this.database.reminderConfigs,
        this.database.drafts,
        this.database.pendingOperations,
        this.database.syncMetadata,
        this.database.queryCache,
      ],
      async () => {
        const marker = await this.requireMarker(markerId);
        if (marker.status === 'cleared') {
          return;
        }
        if (marker.status !== 'exported' && marker.status !== 'transferred') {
          throw new Error('legacy_data_acknowledgement_required');
        }

        for (const tableName of ownerScopedTables) {
          await this.database
            .table(tableName)
            .where('[ownerType+ownerId]')
            .equals(['legacy', marker.sourceOwnerId])
            .delete();
        }

        const profile = await this.database.localProfiles.get(marker.sourceOwnerId);
        if (profile?.identityMode === 'legacy') {
          await this.database.localProfiles.delete(marker.sourceOwnerId);
        }

        await this.database.legacyLocalData.put({
          ...marker,
          status: 'cleared',
          updatedAt: new Date().toISOString(),
          clearedAt: new Date().toISOString(),
        });
      },
    );
  }

  private async acknowledge(
    markerId: string,
    status: AcknowledgedStatus,
  ): Promise<LegacyLocalDataRecord> {
    return this.database.transaction('rw', this.database.legacyLocalData, async () => {
      const marker = await this.requireMarker(markerId);
      if (marker.status === 'cleared') {
        return marker;
      }

      const updated = {
        ...marker,
        status,
        updatedAt: new Date().toISOString(),
      } satisfies LegacyLocalDataRecord;
      await this.database.legacyLocalData.put(updated);
      return updated;
    });
  }

  private async requireMarker(markerId: string): Promise<LegacyLocalDataRecord> {
    const marker = await this.database.legacyLocalData.get(markerId);
    if (!marker) {
      throw new Error('legacy_data_marker_not_found');
    }
    return marker;
  }
}
