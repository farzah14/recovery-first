export const recommendationStatuses = [
  'pending',
  'applied',
  'customized',
  'kept_current',
  'expired',
] as const;

export type RecommendationStatus = (typeof recommendationStatuses)[number];

export const recommendationDecisions = ['apply', 'customize', 'keep_current', 'defer'] as const;

export type RecommendationDecision = (typeof recommendationDecisions)[number];
