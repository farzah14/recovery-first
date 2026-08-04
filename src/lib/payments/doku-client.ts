import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import type { DokuBillingConfig } from './doku-config';

type DokuSignatureInput = Readonly<{
  clientId: string;
  secretKey: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  body: string;
}>;

export type DokuRequestHeaders = Readonly<{
  'Client-Id': string;
  'Request-Id': string;
  'Request-Timestamp': string;
  Signature: string;
  Digest?: string;
}>;

function digestBody(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('base64');
}

function signatureComponent(input: DokuSignatureInput): string {
  const lines = [
    `Client-Id:${input.clientId}`,
    `Request-Id:${input.requestId}`,
    `Request-Timestamp:${input.requestTimestamp}`,
    `Request-Target:${input.requestTarget}`,
  ];

  if (input.body !== '') {
    lines.push(`Digest:${digestBody(input.body)}`);
  }

  return lines.join('\n');
}

function createSignature(input: DokuSignatureInput): string {
  return `HMACSHA256=${createHmac('sha256', input.secretKey)
    .update(signatureComponent(input), 'utf8')
    .digest('base64')}`;
}

export function createDokuRequestHeaders(input: DokuSignatureInput): DokuRequestHeaders {
  const headers: DokuRequestHeaders = {
    'Client-Id': input.clientId,
    'Request-Id': input.requestId,
    'Request-Timestamp': input.requestTimestamp,
    Signature: createSignature(input),
  };

  return input.body === '' ? headers : { ...headers, Digest: digestBody(input.body) };
}

export function isValidDokuSignature(
  input: DokuSignatureInput & Readonly<{ signature: string }>,
): boolean {
  const expected = createSignature(input);
  const actual = Buffer.from(input.signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export class DokuApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly responseBody: unknown,
  ) {
    super(`DOKU API request failed with status ${status}`);
    this.name = 'DokuApiError';
  }
}

type DokuClientResponse<T> = Readonly<{
  body: T;
  headers: Headers;
}>;

type DokuClientDependencies = Readonly<{
  fetchImpl?: typeof fetch;
  createRequestId?: () => string;
  now?: () => Date;
}>;

export type DokuClient = Readonly<{
  post<T>(path: string, body: unknown): Promise<DokuClientResponse<T>>;
  get<T>(path: string): Promise<DokuClientResponse<T>>;
}>;

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function createDokuClient(
  config: Pick<DokuBillingConfig, 'clientId' | 'secretKey' | 'apiBaseUrl'>,
  dependencies: DokuClientDependencies = {},
): DokuClient {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const createRequestId = dependencies.createRequestId ?? (() => crypto.randomUUID());
  const now = dependencies.now ?? (() => new Date());

  async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown) {
    if (!path.startsWith('/') || path.includes('://')) {
      throw new Error('DOKU request target must be an API path');
    }

    const bodyText = body === undefined ? '' : JSON.stringify(body);
    const requestId = createRequestId();
    const requestTimestamp = now().toISOString();
    const signedHeaders = createDokuRequestHeaders({
      clientId: config.clientId,
      secretKey: config.secretKey,
      requestId,
      requestTimestamp,
      requestTarget: path,
      body: method === 'POST' ? bodyText : '',
    });
    const headers = new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...signedHeaders,
    });

    const requestInit: RequestInit = { method, headers };
    if (method === 'POST') {
      requestInit.body = bodyText;
    }

    const response = await fetchImpl(`${config.apiBaseUrl}${path}`, requestInit);
    const responseBody = await parseResponse(response);

    if (!response.ok) {
      throw new DokuApiError(response.status, responseBody);
    }

    return { body: responseBody as T, headers: response.headers } as const;
  }

  return {
    post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
    get: <T>(path: string) => request<T>('GET', path),
  };
}
