import { CryptoIdGenerator, SequenceIdGenerator } from '@/domain/shared/id-generator';

describe('IdGenerator', () => {
  it('returns sequence values in deterministic order', () => {
    const generator = new SequenceIdGenerator(['first-id', 'second-id']);

    expect(generator.next()).toBe('first-id');
    expect(generator.next()).toBe('second-id');
  });

  it('fails when a deterministic sequence is exhausted', () => {
    const generator = new SequenceIdGenerator([]);

    expect(() => generator.next()).toThrow('ID sequence is exhausted.');
  });

  it('creates a UUID with the browser-compatible crypto API', () => {
    expect(new CryptoIdGenerator().next()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
