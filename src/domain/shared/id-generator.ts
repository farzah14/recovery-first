export interface IdGenerator {
  next(): string;
}

export class CryptoIdGenerator implements IdGenerator {
  next(): string {
    return crypto.randomUUID();
  }
}

export class SequenceIdGenerator implements IdGenerator {
  readonly #values: string[];

  constructor(values: readonly string[]) {
    this.#values = [...values];
  }

  next(): string {
    const value = this.#values.shift();

    if (value === undefined) {
      throw new Error('ID sequence is exhausted.');
    }

    return value;
  }
}
