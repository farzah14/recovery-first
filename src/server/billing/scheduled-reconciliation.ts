type EligibleSubscription = Readonly<{ userId: string }>;

type ScheduledDependencies = Readonly<{
  listEligible: (input: Readonly<{ afterUserId: string | null; batchSize: number }>) => Promise<{
    subscriptions: readonly EligibleSubscription[];
    nextCursor: string | null;
  }>;
  refresh: (userId: string) => Promise<Readonly<{ kind: string }>>;
}>;

type ScheduledOptions = Readonly<{
  batchSize: number;
  cursor?: string | null;
}>;

export async function runScheduledSubscriptionReconciliation(
  dependencies: ScheduledDependencies,
  options: ScheduledOptions,
): Promise<{
  processed: number;
  retried: readonly Readonly<{ userId: string; code: 'provider_unavailable' }>[];
  nextCursor: string | null;
}> {
  const batchSize = Math.max(1, Math.floor(options.batchSize));
  const batch = await dependencies.listEligible({
    afterUserId: options.cursor ?? null,
    batchSize,
  });
  let processed = 0;
  const retried: Array<{ userId: string; code: 'provider_unavailable' }> = [];

  for (const subscription of batch.subscriptions.slice(0, batchSize)) {
    try {
      await dependencies.refresh(subscription.userId);
      processed += 1;
    } catch {
      retried.push({ userId: subscription.userId, code: 'provider_unavailable' });
    }
  }

  return { processed, retried, nextCursor: batch.nextCursor };
}
