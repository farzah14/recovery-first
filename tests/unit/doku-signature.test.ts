import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createDokuRequestHeaders, isValidDokuSignature } from '@/lib/payments/doku-client';

describe('DOKU non-SNAP signatures', () => {
  it('creates the signed headers from the exact JSON body and target path', () => {
    const headers = createDokuRequestHeaders({
      clientId: 'MCH-0001-10791114622547',
      secretKey: 'secret-key-from-DOKU-back-office',
      requestId: 'cc682442-6c22-493e-8121-b9ef6b3fa728',
      requestTimestamp: '2020-08-11T08:45:42Z',
      requestTarget: '/doku-virtual-account/v2/payment-code',
      body: JSON.stringify({ order: { amount: 15000, invoice_number: 'INV-1' } }),
    });

    expect(headers).toMatchObject({
      'Client-Id': 'MCH-0001-10791114622547',
      'Request-Id': 'cc682442-6c22-493e-8121-b9ef6b3fa728',
      'Request-Timestamp': '2020-08-11T08:45:42Z',
    });
    expect(headers.Signature).toMatch(/^HMACSHA256=[A-Za-z0-9+/]+=*$/);
    expect(headers.Digest).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it('rejects a notification when the body, target, or signature changes', () => {
    const input = {
      clientId: 'MCH-TEST-01',
      secretKey: 'secret-key',
      requestId: 'request-1',
      requestTimestamp: '2026-08-04T00:00:00Z',
      requestTarget: '/api/billing/webhook',
      body: '{"status":"SUCCESS"}',
    };
    const headers = createDokuRequestHeaders(input);

    expect(isValidDokuSignature({ ...input, signature: headers.Signature })).toBe(true);
    expect(
      isValidDokuSignature({ ...input, body: '{"status":"FAILED"}', signature: headers.Signature }),
    ).toBe(false);
    expect(
      isValidDokuSignature({ ...input, requestTarget: '/wrong', signature: headers.Signature }),
    ).toBe(false);
    expect(isValidDokuSignature({ ...input, signature: `${headers.Signature}tampered` })).toBe(
      false,
    );
  });
});
