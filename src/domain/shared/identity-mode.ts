export const identityModes = ['account'] as const;

export type IdentityMode = (typeof identityModes)[number];

export function isIdentityMode(value: string): value is IdentityMode {
  return identityModes.includes(value as IdentityMode);
}
