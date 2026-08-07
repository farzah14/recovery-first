import { describe, expect, it } from 'vitest';

import { stableUuidFromText } from '@/lib/identifiers/stable-uuid';

describe('stableUuidFromText', () => {
  it('returns a repeatable RFC 4122-shaped UUID for an identity string', async () => {
    const first = await stableUuidFromText('session:habit:2026-08-07');
    const second = await stableUuidFromText('session:habit:2026-08-07');

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
