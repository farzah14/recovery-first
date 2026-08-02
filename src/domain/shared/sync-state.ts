export const synchronizationStates = [
  'local_only',
  'pending',
  'synchronized',
  'blocked',
  'failed',
] as const;

export type SynchronizationState = (typeof synchronizationStates)[number];
