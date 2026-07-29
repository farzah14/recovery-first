import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkEnvironmentExample } from '../../../tool/check-environment-example.mjs';

describe('checkEnvironmentExample', () => {
  it('rejects an example missing a required key', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'recovery-first-env-'));
    const file = path.join(directory, '.env.example');
    await writeFile(file, 'APP_ENVIRONMENT=local\n');

    await expect(checkEnvironmentExample(file)).rejects.toThrow('Missing .env.example keys');
  });

  it('accepts the repository environment example', async () => {
    await expect(checkEnvironmentExample()).resolves.toBeUndefined();
  });
});
