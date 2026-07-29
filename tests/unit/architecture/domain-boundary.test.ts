import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { describe, expect, it } from 'vitest';

const forbiddenPatterns = [
  /from ['"]next(?:\/[^'"]*)?['"]/,
  /from ['"]react(?:\/[^'"]*)?['"]/,
  /from ['"]react-dom(?:\/[^'"]*)?['"]/,
  /from ['"]@\/(?:app|components|features|hooks|lib|providers)\//,
];

describe('domain module boundary', () => {
  it('keeps domain modules independent from frameworks and infrastructure', async () => {
    const files = await fg('src/domain/**/*.{ts,tsx}', { dot: false });
    const violations: string[] = [];

    for (const file of files) {
      const source = await readFile(path.resolve(file), 'utf8');

      for (const pattern of forbiddenPatterns) {
        if (pattern.test(source)) {
          violations.push(`${file}: ${pattern.source}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
