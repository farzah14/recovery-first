export type ProviderBillingIdentity = Readonly<{
  providerCustomerId: string;
  providerSubscriptionId: string;
}>;

type SubscriptionManagementDependencies = Readonly<{
  readProviderIdentity: (userId: string) => Promise<ProviderBillingIdentity | null>;
  createPortal: (input: ProviderBillingIdentity) => Promise<{ url: string }>;
}>;

export function createSubscriptionManagementService(
  dependencies: SubscriptionManagementDependencies,
) {
  return {
    async createPortalSession(userId: string) {
      const identity = await dependencies.readProviderIdentity(userId);
      if (!identity) {
        return { kind: 'unavailable' } as const;
      }

      const result = await dependencies.createPortal(identity);
      const url = new URL(result.url);
      if (url.protocol !== 'https:') {
        throw new Error('Portal URL invalid');
      }

      return { kind: 'ready', url: url.toString() } as const;
    },
  };
}
