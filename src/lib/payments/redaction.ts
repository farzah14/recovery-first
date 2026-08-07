const blockedBillingMetadataKeys = new Set([
  'apikey',
  'authorization',
  'cardnumber',
  'clienttoken',
  'paymentmethod',
  'portalurl',
  'rawpayload',
  'signature',
  'webhooksecret',
]);

export function redactBillingMetadata(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => !blockedBillingMetadataKeys.has(key.toLowerCase())),
  );
}
