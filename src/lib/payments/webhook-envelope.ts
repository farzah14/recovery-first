export type RawWebhookEnvelope = Readonly<{
  rawBody: string;
  signature: string;
}>;

export async function readRawWebhook(request: Request): Promise<RawWebhookEnvelope> {
  return {
    rawBody: await request.text(),
    signature: request.headers.get('paddle-signature') ?? '',
  };
}
