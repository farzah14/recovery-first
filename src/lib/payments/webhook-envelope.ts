export type RawWebhookEnvelope = Readonly<{
  rawBody: string;
  signature: string;
  headers?: Readonly<Record<string, string>>;
}>;

export async function readRawWebhook(request: Request): Promise<RawWebhookEnvelope> {
  const rawBody = await request.text();
  const signature =
    request.headers.get('signature') ?? request.headers.get('paddle-signature') ?? '';
  const headerNames = [
    'Client-Id',
    'Request-Id',
    'Request-Timestamp',
    'Request-Target',
    'Digest',
    'Signature',
  ] as const;
  const headers = Object.fromEntries(
    headerNames.flatMap((name) => {
      const value = request.headers.get(name);
      return value === null ? [] : [[name, value]];
    }),
  );

  return Object.keys(headers).length > 0 ? { rawBody, signature, headers } : { rawBody, signature };
}
