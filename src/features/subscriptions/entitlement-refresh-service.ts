import type { NormalizedBillingEvent } from '@/domain/billing/normalized-event';
import type { BillingProductCode } from '@/domain/billing/product-catalog';
import type { EntitlementStatus } from '@/domain/subscriptions/entitlement';

export type StoredBillingSubscription = Readonly<{
  userId: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  planCode: Exclude<BillingProductCode, 'free' | 'lite' | 'premium'>;
  normalizedStatus: EntitlementStatus;
  currentPeriodEnd: string | null;
  updatedAt: string;
}>;

export type EntitlementRefreshResult = Readonly<{
  kind: 'none' | 'applied' | 'stale' | 'duplicate';
  eventId?: string;
}>;

type RefreshDependencies = Readonly<{
  readStoredSubscription: (userId: string) => Promise<StoredBillingSubscription | null>;
  fetchSubscription: (providerSubscriptionId: string) => Promise<NormalizedBillingEvent>;
  processEvent: (
    event: NormalizedBillingEvent,
  ) => Promise<Readonly<{ result: string; eventId?: string }>>;
  auditRefresh: (
    input: Readonly<{
      userId: string;
      providerSubscriptionId: string;
      result: EntitlementRefreshResult['kind'];
    }>,
  ) => Promise<void>;
}>;

function resultKind(value: string): EntitlementRefreshResult['kind'] {
  if (value === 'applied' || value === 'stale' || value === 'duplicate') {
    return value;
  }

  throw new Error('reconciliation_result_invalid');
}

export function createEntitlementRefreshService(dependencies: RefreshDependencies) {
  return {
    async refresh(userId: string): Promise<EntitlementRefreshResult> {
      const stored = await dependencies.readStoredSubscription(userId);
      if (!stored) {
        return { kind: 'none' };
      }

      if (stored.userId !== userId) {
        throw new Error('reconciliation_ownership_mismatch');
      }

      const event = await dependencies.fetchSubscription(stored.providerSubscriptionId);
      if (
        event.userId !== userId ||
        event.subscriptionId !== stored.providerSubscriptionId ||
        event.customerId !== stored.providerCustomerId
      ) {
        throw new Error('reconciliation_ownership_mismatch');
      }

      const processed = await dependencies.processEvent(event);
      const result: EntitlementRefreshResult = {
        kind: resultKind(processed.result),
        ...((processed.eventId ?? event.eventId)
          ? { eventId: processed.eventId ?? event.eventId }
          : {}),
      };

      await dependencies.auditRefresh({
        userId,
        providerSubscriptionId: stored.providerSubscriptionId,
        result: result.kind,
      });

      return result;
    },
  };
}
